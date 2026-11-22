import { describe, expect, it } from "vitest";
import { buildEnergyDemo, energyRisk, energySummary } from "./energy-demo";

describe("isolated utility logistics scenario", () => {
  it("counts dated delays separately from missing ETAs and received materials", () => {
    expect(energySummary(buildEnergyDemo())).toEqual({ open: 7, late: 2, unknown: 2, projects: 3 });
    const first = buildEnergyDemo()[0];
    if (!first) throw new Error("Fixture required");
    expect(energyRisk({ ...first, eta: first.needed })).toBe("Dentro da data");
    expect(energyRisk({ ...first, eta: null })).toBe("Sem previsão");
    expect(energyRisk({ ...first, stage: "Recebido", eta: null })).toBe("Recebido");
  });
  it("creates independent fixtures, never reusing mutated demo state", () => {
    const materials = buildEnergyDemo();
    const first = materials[0];
    if (!first) throw new Error("Fixture required");
    first.eta = "2026-12-20";
    expect(buildEnergyDemo()[0]?.eta).toBe("2026-11-28");
    expect(materials.every((m) => m.po.startsWith("DEMO-"))).toBe(true);
  });
});