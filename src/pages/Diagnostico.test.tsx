import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Diagnostico from "./Diagnostico";

const Destino = () => {
  const { pathname, search, hash } = useLocation();
  return <div>destino:{pathname}{search}{hash}</div>;
};

const abrir = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="/diagnostico-residencial" element={<Destino />} />
        <Route path="/diagnostico-eventos" element={<Destino />} />
      </Routes>
    </MemoryRouter>,
  );

describe("enlaces anteriores con ?tipo=", () => {
  it("llevan a la página propia de casa o eventos y conservan los demás parámetros", () => {
    abrir("/diagnostico?tipo=casa&utm_source=whatsapp#cuestionario");
    expect(screen.getByText("destino:/diagnostico-residencial?utm_source=whatsapp#cuestionario")).toBeInTheDocument();
  });

  it("aceptan signos pegados al tipo", () => {
    abrir("/diagnostico?tipo=evento)");
    expect(screen.getByText("destino:/diagnostico-eventos")).toBeInTheDocument();
  });
});
