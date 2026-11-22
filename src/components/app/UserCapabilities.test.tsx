import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

type Res = { data: unknown; error: { code?: string; message: string } | null };
let selectRes: Res = { data: [], error: null };
let writeRes: Res = { data: null, error: null };
const calls: { op: string; args: unknown[] }[] = [];
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      const q: Record<string, unknown> = {};
      let op = "select";
      q.select = () => q;
      q.eq = (...a: unknown[]) => { calls.push({ op: `${op}.eq`, args: a }); return q; };
      q.upsert = (row: unknown) => { op = "upsert"; calls.push({ op, args: [row] }); return q; };
      q.delete = () => { op = "delete"; calls.push({ op, args: [] }); return q; };
      q.then = (ok: (v: Res) => unknown, ko: (e: unknown) => unknown) =>
        Promise.resolve(op === "select" ? selectRes : writeRes).then(ok, ko);
      return q;
    },
  },
}));
const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "admin1" }, refreshAccess: vi.fn() }) }));

import { UserCapabilities } from "./UserCapabilities";

const casilla = (nombre: string) => screen.getByLabelText(nombre) as HTMLInputElement;

describe("UserCapabilities", () => {
  beforeEach(() => {
    selectRes = { data: [], error: null };
    writeRes = { data: null, error: null };
    calls.length = 0;
    toast.mockReset();
  });

  it("agrupa en Elaboración y Validación; las del rol vienen marcadas", async () => {
    render(<UserCapabilities userId="u2" email="a@x.com" role="analyst" />);
    expect(await screen.findByText("Elaboración")).toBeInTheDocument();
    expect(screen.getByText("Validación")).toBeInTheDocument();
    expect(screen.getByText("Administración")).toBeInTheDocument();
    expect(casilla("Elaborar diagnósticos").checked).toBe(true);
    expect(casilla("Revisar el trabajo de otro analista").checked).toBe(false);
    expect(casilla("Revisar el trabajo de otro analista").disabled).toBe(false);
    expect(casilla("Elaborar diagnósticos").disabled).toBe(false);
    // Rechazar: solo Administrador
    expect(casilla("Rechazar").disabled).toBe(true);
    expect(screen.getAllByText("(solo Administrador)")).toHaveLength(1);
    // Validar, aprobar y cerrar: solo Consultor o Administrador
    expect(casilla("Aprobar").checked).toBe(false);
    expect(casilla("Aprobar").disabled).toBe(true);
    expect(casilla("Validar").disabled).toBe(true);
    expect(casilla("Cerrar el diagnóstico").disabled).toBe(true);
    expect(screen.getAllByText("(solo Consultor o Administrador)")).toHaveLength(3);
  });

  it("consultor: rechazar bloqueado (solo Administrador); validar y aprobar con el rol", async () => {
    render(<UserCapabilities userId="u3" email="c@x.com" role="consultant" />);
    await screen.findByText("Validación");
    expect(casilla("Rechazar").checked).toBe(false);
    expect(casilla("Rechazar").disabled).toBe(true);
    expect(casilla("Aprobar").checked).toBe(true);
    expect(screen.queryByText("(solo Consultor o Administrador)")).toBeNull();
  });

  it("admin: trae las 12, incluida reasignar, y nada está bloqueado", async () => {
    render(<UserCapabilities userId="admin1" email="yo@x.com" role="admin" />);
    await screen.findByText("Validación");
    expect(casilla("Aprobar").checked).toBe(true);
    expect(casilla("Aprobar").disabled).toBe(false);
    expect(casilla("Reasignar clientes o proyectos").checked).toBe(true);
    expect(screen.getAllByText("(viene con el rol)")).toHaveLength(12);
  });

  it("quitar una del rol guarda un deny; volver a marcarla lo borra", async () => {
    render(<UserCapabilities userId="u3" email="c@x.com" role="consultant" />);
    await screen.findByText("Validación");
    fireEvent.click(casilla("Aprobar"));
    await waitFor(() => expect(casilla("Aprobar").checked).toBe(false));
    expect(calls).toContainEqual({ op: "upsert", args: [{ user_id: "u3", capability: "mdesr.approve", effect: "deny" }] });
    expect(screen.getByText("(retirada a esta persona)")).toBeInTheDocument();

    fireEvent.click(casilla("Aprobar"));
    await waitFor(() => expect(casilla("Aprobar").checked).toBe(true));
    expect(calls.some((c) => c.op === "delete")).toBe(true);
  });

  it("muestra como retirada la que ya tiene deny", async () => {
    selectRes = { data: [{ capability: "mdesr.prepare", effect: "deny" }], error: null };
    render(<UserCapabilities userId="u2" email="a@x.com" role="analyst" />);
    await screen.findByText("Validación");
    expect(casilla("Elaborar diagnósticos").checked).toBe(false);
    expect(screen.getByText("(retirada a esta persona)")).toBeInTheDocument();
  });

  it("da y quita las que no trae el rol", async () => {
    selectRes = { data: [{ capability: "mdesr.assign_reviewer", effect: "grant" }], error: null };
    render(<UserCapabilities userId="u2" email="a@x.com" role="analyst" />);
    await screen.findByText("Validación");
    expect(casilla("Asignar revisor").checked).toBe(true);

    fireEvent.click(casilla("Revisar el trabajo de otro analista"));
    await waitFor(() => expect(casilla("Revisar el trabajo de otro analista").checked).toBe(true));
    expect(calls).toContainEqual({ op: "upsert", args: [{ user_id: "u2", capability: "mdesr.review", effect: "grant" }] });

    fireEvent.click(casilla("Asignar revisor"));
    await waitFor(() => expect(casilla("Asignar revisor").checked).toBe(false));
    expect(calls.some((c) => c.op === "delete")).toBe(true);
  });

  it("si alguien que no es Consultor tiene una de solo Consultor, se le puede quitar", async () => {
    selectRes = { data: [{ capability: "mdesr.approve", effect: "grant" }], error: null };
    render(<UserCapabilities userId="u2" email="a@x.com" role="analyst" />);
    await screen.findByText("Validación");
    expect(casilla("Aprobar").checked).toBe(true);
    expect(casilla("Aprobar").disabled).toBe(false);
    fireEvent.click(casilla("Aprobar"));
    await waitFor(() => expect(casilla("Aprobar").checked).toBe(false));
  });

  it("si falta el script 09 muestra el aviso", async () => {
    selectRes = { data: null, error: { code: "42P01", message: "relation does not exist" } };
    render(<UserCapabilities userId="u2" email="a@x.com" role="analyst" />);
    expect(await screen.findByRole("status")).toHaveTextContent("09-consultor-y-facultades.sql");
    expect(toast).not.toHaveBeenCalled();
  });

  it("si la base rechaza el cambio, avisa y no marca", async () => {
    writeRes = { data: null, error: { code: "42501", message: "permiso denegado" } };
    render(<UserCapabilities userId="u2" email="a@x.com" role="viewer" />);
    await screen.findByText("Validación");
    fireEvent.click(casilla("Comentar"));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(casilla("Comentar").checked).toBe(false);
  });
});
