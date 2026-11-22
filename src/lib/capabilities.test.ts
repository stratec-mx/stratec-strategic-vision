import { describe, expect, it } from "vitest";
import { capabilitiesFromRoles, effectiveCapabilities, isMissingTable } from "./capabilities";
import { missingRoleMessage } from "./access";

describe("capabilitiesFromRoles", () => {
  it("ser admin no da facultades técnicas", () => {
    expect(capabilitiesFromRoles(["admin"]).size).toBe(0);
  });
  it("el consultor valida y aprueba, pero no elabora", () => {
    const c = capabilitiesFromRoles(["consultant"]);
    expect(c.has("mdesr.approve")).toBe(true);
    expect(c.has("mdesr.validate")).toBe(true);
    expect(c.has("mdesr.prepare")).toBe(false);
  });
  it("el analista elabora y revisa, pero no aprueba", () => {
    const c = capabilitiesFromRoles(["analyst"]);
    expect([...c].sort()).toEqual(["mdesr.comment", "mdesr.prepare", "mdesr.review", "mdesr.submit"]);
    expect(c.has("mdesr.approve")).toBe(false);
  });
  it("otros roles no traen facultades", () => {
    expect(capabilitiesFromRoles(["executive", "viewer"]).size).toBe(0);
  });
});

describe("effectiveCapabilities", () => {
  it("el admin puede elaborar si se asigna la facultad", () => {
    const c = effectiveCapabilities(["admin"], ["mdesr.prepare", "mdesr.submit"]);
    expect(c.has("mdesr.prepare")).toBe(true);
    expect(c.has("mdesr.approve")).toBe(false);
  });
  it("validar, aprobar y cerrar solo cuentan para un Consultor", () => {
    const admin = effectiveCapabilities(["admin"], ["mdesr.validate", "mdesr.approve", "mdesr.close", "mdesr.reject"]);
    expect(admin.has("mdesr.validate") || admin.has("mdesr.approve") || admin.has("mdesr.close")).toBe(false);
    expect(admin.has("mdesr.reject")).toBe(true);
    expect(effectiveCapabilities(["consultant"], []).has("mdesr.approve")).toBe(true);
  });
  it("ignora valores desconocidos", () => {
    expect(effectiveCapabilities([], ["mdesr.volar"]).size).toBe(0);
  });
});

describe("avisos", () => {
  it("reconoce tabla faltante", () => {
    expect(isMissingTable({ code: "42P01" })).toBe(true);
    expect(isMissingTable({ code: "PGRST205" })).toBe(true);
    expect(isMissingTable({ code: "42501" })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
  it("mensaje de rol sin crear apunta al script correcto", () => {
    expect(missingRoleMessage("consultant")).toMatch(/09-consultor-y-facultades\.sql \(paso 1\)/);
    expect(missingRoleMessage("advisor")).toMatch(/08-rol-asesor\.sql/);
  });
});
