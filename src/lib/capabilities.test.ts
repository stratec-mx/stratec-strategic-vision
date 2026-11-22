import { describe, expect, it } from "vitest";
import { CAPABILITIES, capabilitiesFromRoles, effectiveCapabilities, isMissingTable } from "./capabilities";
import { missingRoleMessage } from "./access";

describe("capabilitiesFromRoles", () => {
  it("el admin trae las 12 facultades, incluida reasignar", () => {
    const c = capabilitiesFromRoles(["admin"]);
    expect(c.size).toBe(12);
    expect(CAPABILITIES).toHaveLength(12);
    expect(c.has("admin.reassign_clients_projects")).toBe(true);
    expect(c.has("mdesr.approve")).toBe(true);
  });
  it("el consultor elabora, revisa, valida y aprueba, pero no reasigna", () => {
    const c = capabilitiesFromRoles(["consultant"]);
    expect(c.has("mdesr.approve")).toBe(true);
    expect(c.has("mdesr.validate")).toBe(true);
    expect(c.has("mdesr.prepare")).toBe(true);
    expect(c.has("mdesr.review")).toBe(true);
    expect(c.has("admin.reassign_clients_projects")).toBe(false);
  });
  it("el analista elabora, comenta y envía; revisar solo si se le autoriza", () => {
    const c = capabilitiesFromRoles(["analyst"]);
    expect([...c].sort()).toEqual(["mdesr.comment", "mdesr.prepare", "mdesr.submit"]);
    expect(effectiveCapabilities(["analyst"], [{ capability: "mdesr.review", effect: "grant" }]).has("mdesr.review")).toBe(true);
  });
  it("asesor y otros roles no traen facultades", () => {
    expect(capabilitiesFromRoles(["advisor", "executive", "viewer", "operations"]).size).toBe(0);
  });
});

describe("effectiveCapabilities", () => {
  it("un deny retira una facultad que trae el rol", () => {
    const c = effectiveCapabilities(["admin"], [{ capability: "mdesr.approve", effect: "deny" }]);
    expect(c.has("mdesr.approve")).toBe(false);
    expect(c.has("mdesr.validate")).toBe(true);
  });
  it("el deny gana aunque también haya grant", () => {
    const c = effectiveCapabilities(["analyst"], [
      { capability: "mdesr.reject", effect: "grant" },
      { capability: "mdesr.reject", effect: "deny" },
    ]);
    expect(c.has("mdesr.reject")).toBe(false);
  });
  it("un grant suma; sin effect cuenta como grant", () => {
    const c = effectiveCapabilities(["analyst"], [{ capability: "mdesr.reject" }]);
    expect(c.has("mdesr.reject")).toBe(true);
  });
  it("validar, aprobar y cerrar solo cuentan para Consultor o admin", () => {
    const a = effectiveCapabilities(["analyst"], ["mdesr.validate", "mdesr.approve", "mdesr.close"].map((capability) => ({ capability, effect: "grant" })));
    expect(a.has("mdesr.validate") || a.has("mdesr.approve") || a.has("mdesr.close")).toBe(false);
    expect(effectiveCapabilities(["consultant"], []).has("mdesr.approve")).toBe(true);
    expect(effectiveCapabilities(["admin"], []).has("mdesr.approve")).toBe(true);
  });
  it("ignora valores desconocidos", () => {
    expect(effectiveCapabilities([], [{ capability: "mdesr.volar", effect: "grant" }]).size).toBe(0);
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
