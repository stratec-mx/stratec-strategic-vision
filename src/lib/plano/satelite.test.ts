import { describe, expect, it } from "vitest";
import { ATRIBUCION_ESRI, capasDeImagen } from "./satelite";

describe("satélite de Esri", () => {
  it("toma solo las capas de imagen y les pone la atribución obligatoria", () => {
    const { fuentes, capas } = capasDeImagen({
      sources: {
        imagery: { type: "raster", tiles: ["https://ejemplo/{z}/{y}/{x}"], tileSize: 256 },
        labels: { type: "vector", url: "https://ejemplo/labels" },
      },
      layers: [
        { id: "World Imagery", type: "raster", source: "imagery" },
        { id: "Etiquetas", type: "symbol", source: "labels", "source-layer": "x" },
      ],
    });
    expect(capas.map((c) => c.id)).toEqual(["esri-sat-World Imagery"]);
    expect(Object.keys(fuentes)).toEqual(["esri-sat-imagery"]);
    expect((fuentes["esri-sat-imagery"] as { attribution?: string }).attribution).toBe(ATRIBUCION_ESRI);
  });

  it("sin capas de imagen no devuelve nada", () => {
    expect(capasDeImagen({ layers: [] }).capas).toHaveLength(0);
  });
});
