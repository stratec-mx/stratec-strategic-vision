import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANDINGS, esLanding } from "@/data/landings";
import { buildLandingLead, SIN_CORREO, telefonoValido } from "@/lib/landingLead";
import { LandingPage } from "./LandingPage";

const data = LANDINGS.extorsion;

const renderLanding = (url = "/extorsion") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LandingPage data={data} />
    </MemoryRouter>,
  );

const llenar = (nombre: string, empresa: string, telefono: string) => {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: nombre } });
  fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: empresa } });
  fireEvent.change(screen.getByLabelText("Teléfono o WhatsApp"), { target: { value: telefono } });
};

const enviar = () => fireEvent.submit(screen.getByRole("form", { name: "Formulario de contacto" }));

describe("Landing de extorsión", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const gtag = vi.fn();
  const fbq = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    Object.assign(window, { gtag, fbq });
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    gtag.mockReset();
    fbq.mockReset();
  });

  it("muestra el problema, la solución, los pasos, las preguntas y solo tres campos", () => {
    renderLanding();
    expect(screen.getByRole("heading", { level: 1, name: data.hero.titulo })).toBeInTheDocument();
    expect(screen.getByText(data.hero.solucion)).toBeInTheDocument();
    data.pasos.items.forEach((p) => expect(screen.getByText(p.titulo)).toBeInTheDocument());
    data.faq.items.forEach((f) => expect(screen.getByText(f.q)).toBeInTheDocument());
    const form = screen.getByRole("form", { name: "Formulario de contacto" });
    // nombre, empresa y teléfono, más el campo trampa oculto
    expect(form.querySelectorAll("input")).toHaveLength(4);
    // Sin menú: el encabezado solo lleva la marca
    expect(screen.getByRole("banner").querySelectorAll("a")).toHaveLength(1);
  });

  it("no envía si faltan datos o el teléfono no es válido", async () => {
    renderLanding();
    llenar("A", "", "12345");
    enviar();
    expect(await screen.findByText("Escribe tu nombre")).toBeInTheDocument();
    expect(screen.getByText("Escribe el nombre de tu empresa")).toBeInTheDocument();
    expect(screen.getByText("Escribe un teléfono de 10 dígitos")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía a submit-lead con origen, UTM y correo interno, y agradece con WhatsApp", async () => {
    renderLanding("/extorsion?utm_source=facebook&utm_medium=organico&utm_campaign=extorsion-nov&utm_content=post1");
    llenar("María López", "Abarrotes La Paz", "777 123 4567");
    enviar();

    expect(await screen.findByText(data.formulario.gracias.titulo)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/functions\/v1\/submit-lead$/);
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      name: "María López",
      organization: "Abarrotes La Paz",
      telefono: "777 123 4567",
      email: SIN_CORREO,
      servicio: data.servicio,
      origen: "Landing extorsión",
      honeypot: "",
      correo: true,
    });
    for (const linea of [
      "Origen: Landing extorsión",
      "utm_source: facebook",
      "utm_medium: organico",
      "utm_campaign: extorsion-nov",
      "utm_content: post1",
    ]) {
      expect(body.message).toContain(linea);
    }

    // Medición: generate_lead en GA4 y Lead en el píxel de Meta
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "generate_lead",
      expect.objectContaining({ label: "landing_extorsion", campaign_source: "facebook", campaign_name: "extorsion-nov" }),
    );
    expect(fbq).toHaveBeenCalledWith("track", "Lead", expect.anything());

    const wa = within(screen.getByRole("status")).getByRole("link", { name: data.whatsapp.boton });
    expect(wa.getAttribute("href")).toContain("wa.me/522206488688");
    expect(decodeURIComponent(wa.getAttribute("href")!)).toContain("soy María de Abarrotes La Paz");
  });

  it("si el servidor falla, avisa y conserva lo escrito", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    renderLanding();
    llenar("Juan Pérez", "Taller Pérez", "+52 777 123 4567");
    enviar();
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos enviar tus datos");
    expect(screen.getByLabelText("Nombre")).toHaveValue("Juan Pérez");
    expect(gtag).not.toHaveBeenCalledWith("event", "generate_lead", expect.anything());
  });

  it("si un robot llena el campo trampa, no registra nada", async () => {
    renderLanding();
    llenar("Bot", "Bot SA", "7771234567");
    fireEvent.change(screen.getByLabelText("No llenar"), { target: { value: "http://spam" } });
    enviar();
    await waitFor(() => expect(screen.getByText(data.formulario.gracias.titulo)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("el botón de WhatsApp lleva mensaje prellenado y se mide el clic", () => {
    renderLanding();
    const [hero] = screen.getAllByRole("link", { name: data.whatsapp.boton });
    expect(decodeURIComponent(hero.getAttribute("href")!)).toContain(data.whatsapp.mensaje);
    fireEvent.click(hero);
    expect(gtag).toHaveBeenCalledWith("event", "click_whatsapp", expect.objectContaining({ label: "landing_extorsion_hero" }));
  });
});

describe("Datos del lead de landing", () => {
  it("acepta teléfonos de México con o sin lada internacional", () => {
    expect(telefonoValido("7771234567")).toBe(true);
    expect(telefonoValido("+52 1 777 123 4567")).toBe(true);
    expect(telefonoValido("(777) 123-45-67")).toBe(true);
    expect(telefonoValido("123456")).toBe(false);
  });

  it("sin UTM, la nota lo dice", () => {
    const body = buildLandingLead(data, { nombre: " Ana ", empresa: " X ", telefono: "7771234567" }, {});
    expect(body.name).toBe("Ana");
    expect(body.message).toContain("Sin UTM");
  });

  it("reconoce la ruta de la landing para ocultar los botones flotantes", () => {
    expect(esLanding("/extorsion")).toBe(true);
    expect(esLanding("/extorsion/")).toBe(true);
    expect(esLanding("/")).toBe(false);
    expect(esLanding("/servicios/protocolos-seguridad")).toBe(false);
  });
});
