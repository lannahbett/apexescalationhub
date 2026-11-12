import { buildSeed, type Part } from "./shortages";

/** Independent, explicitly fictional training fixtures; never written into the hub store. */
export function practiceParts(): Part[] {
  const seed = buildSeed()[0];
  if (!seed) return [];
  return [{ ...seed, id: "practice", partNumber: "DEMO-MOTOR", supplier: "Demo Motion Ltd", daysLate: 4,
    targetBuild: "2026-11-12T00:00:00Z", hoursToLineStop: 18, valueAtRisk: 100000,
    orders: [{ so: "DEMO-ORDER", customer: "Demo Medical Systems", committed: "2026-11-12T00:00:00Z", value: 160000, strategic: true, tier: "tier1", penaltyPerDay: 2500 }] }];
}