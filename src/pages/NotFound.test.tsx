import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import NotFound from "./NotFound";

const Destino = () => {
  const { pathname, search, hash } = useLocation();
  return <div>destino:{pathname}{search}{hash}</div>;
};

const abrir = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/diagnostico" element={<Destino />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  );

describe("NotFound", () => {
  it("corrige solo el enlace con un signo pegado al final", () => {
    abrir("/diagnostico)");
    expect(screen.getByText("destino:/diagnostico")).toBeInTheDocument();
  });

  it("conserva los parámetros al corregir", () => {
    abrir("/diagnostico.?tipo=casa#cuestionario");
    expect(screen.getByText("destino:/diagnostico?tipo=casa#cuestionario")).toBeInTheDocument();
  });

  it("muestra la página en español cuando la dirección de verdad no existe", () => {
    abrir("/no-existe");
    expect(screen.getByText("No encontramos esta página")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Diagnóstico gratuito/ })).toHaveAttribute("href", "/diagnostico");
  });

  it("pide a los buscadores no indexar la dirección inexistente y lo restaura al salir", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "index, follow");
    document.head.appendChild(meta);
    const vista = abrir("/no-existe");
    expect(meta.getAttribute("content")).toBe("noindex, follow");
    vista.unmount();
    expect(meta.getAttribute("content")).toBe("index, follow");
    meta.remove();
  });
});
