import { describe, expect, it } from "vitest";
import {
  etiquetaRol, faltaTabla, motivoValido, nombreResponsable, papelSugerido, sinAsignar, usuariosConRol,
} from "./responsables";

const perfiles = [
  { id: "u1", full_name: "Zoe Ruiz", email: "z@x.mx" },
  { id: "u2", full_name: "", email: "ana@x.mx" },
  { id: "u3", full_name: "Sin Rol", email: "s@x.mx" },
];
const roles = [
  { user_id: "u1", role: "advisor" },
  { user_id: "u2", role: "admin" },
  { user_id: "u1", role: "viewer" },
];

describe("responsables", () => {
  it("lista solo usuarios con rol, por nombre, con el correo si no hay nombre", () => {
    const u = usuariosConRol(perfiles, roles);
    expect(u.map((x) => x.nombre)).toEqual(["ana@x.mx", "Zoe Ruiz"]);
    expect(u.find((x) => x.id === "u1")?.roles).toEqual(["advisor", "viewer"]);
  });

  it("filtra los que no tienen responsable", () => {
    expect(sinAsignar([{ id: 1, owner_id: null }, { id: 2, owner_id: "u1" }, { id: 3 }]).map((f) => f.id)).toEqual([1, 3]);
  });

  it("nombra al responsable o dice que falta", () => {
    const u = usuariosConRol(perfiles, roles);
    expect(nombreResponsable(null, u)).toBe("Sin asignar");
    expect(nombreResponsable("u1", u)).toBe("Zoe Ruiz");
    expect(nombreResponsable("u3", u)).toBe("Usuario sin rol");
  });

  it("sugiere el papel de la asignación según el rol", () => {
    expect(papelSugerido({ id: "a", nombre: "a", roles: ["executive"] })).toBe("ejecutivo");
    expect(papelSugerido({ id: "a", nombre: "a", roles: ["admin", "viewer"] })).toBe("lectura");
    expect(papelSugerido({ id: "a", nombre: "a", roles: ["analyst"] })).toBe("asesor");
    expect(papelSugerido(undefined)).toBe("asesor");
  });

  it("exige motivo de 5 letras y reconoce la tabla faltante", () => {
    expect(motivoValido("  abc ")).toBe(false);
    expect(motivoValido("Cuenta nueva")).toBe(true);
    expect(faltaTabla({ code: "PGRST205" })).toBe(true);
    expect(faltaTabla({ code: "42501" })).toBe(false);
    expect(etiquetaRol("advisor")).toBe("Asesor");
  });
});
