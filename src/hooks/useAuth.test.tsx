import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

type Res = { data: unknown; error: { code?: string; message: string } | null };
let tables: Record<string, Res> = {};
const chain = (table: string) => {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "eq", "in"]) q[m] = () => q;
  q.then = (ok: (v: Res) => unknown, ko: (e: unknown) => unknown) =>
    Promise.resolve(tables[table] ?? { data: [], error: null }).then(ok, ko);
  return q;
};
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (t: string) => chain(t),
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: { user: { id: "u1" } } } }),
      signOut: vi.fn(),
    },
  },
}));

import { AuthProvider, useAuth } from "./useAuth";

const Probe = () => {
  const { loading, hasCapability, capabilitiesMissing } = useAuth();
  if (loading) return <div>cargando</div>;
  return (
    <div>
      <span data-testid="prepare">{String(hasCapability("mdesr.prepare"))}</span>
      <span data-testid="approve">{String(hasCapability("mdesr.approve"))}</span>
      <span data-testid="missing">{String(capabilitiesMissing)}</span>
    </div>
  );
};
const montar = () => render(<AuthProvider><Probe /></AuthProvider>);

describe("useAuth.hasCapability", () => {
  beforeEach(() => { tables = { access_rules: { data: [], error: null } }; });

  it("analista: facultades del rol, y aprobar no aunque tenga una fila vieja", async () => {
    tables.user_roles = { data: [{ role: "analyst" }], error: null };
    tables.user_capabilities = { data: [{ capability: "mdesr.approve" }], error: null };
    montar();
    await waitFor(() => expect(screen.getByTestId("prepare")).toHaveTextContent("true"));
    expect(screen.getByTestId("approve")).toHaveTextContent("false");
    expect(screen.getByTestId("missing")).toHaveTextContent("false");
  });

  it("consultor aprueba pero no elabora", async () => {
    tables.user_roles = { data: [{ role: "consultant" }], error: null };
    montar();
    await waitFor(() => expect(screen.getByTestId("approve")).toHaveTextContent("true"));
    expect(screen.getByTestId("prepare")).toHaveTextContent("false");
  });

  it("admin: trae las facultades técnicas por su rol", async () => {
    tables.user_roles = { data: [{ role: "admin" }], error: null };
    montar();
    await waitFor(() => expect(screen.getByTestId("approve")).toHaveTextContent("true"));
    expect(screen.getByTestId("prepare")).toHaveTextContent("true");
  });

  it("un deny le retira al admin una facultad de su rol", async () => {
    tables.user_roles = { data: [{ role: "admin" }], error: null };
    tables.user_capabilities = { data: [{ capability: "mdesr.approve", effect: "deny" }], error: null };
    montar();
    await waitFor(() => expect(screen.getByTestId("prepare")).toHaveTextContent("true"));
    expect(screen.getByTestId("approve")).toHaveTextContent("false");
  });

  it("sin la tabla (falta 09) no se rompe: quedan las del rol", async () => {
    tables.user_roles = { data: [{ role: "analyst" }], error: null };
    tables.user_capabilities = { data: null, error: { code: "PGRST205", message: "not found" } };
    montar();
    await waitFor(() => expect(screen.getByTestId("missing")).toHaveTextContent("true"));
    expect(screen.getByTestId("prepare")).toHaveTextContent("true");
    expect(screen.getByTestId("approve")).toHaveTextContent("false");
  });
});
