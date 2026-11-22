/** Fictional utility logistics fixtures. Never import into the shared hub store. */
export type EnergyStage = "Produção" | "Inspeção" | "Em trânsito" | "Recebido";
export interface EnergyMaterial {
  id: string; material: string; supplier: string; destination: string; project: string;
  po: string; quantity: number; unit: string; needed: string; eta: string | null;
  stage: EnergyStage; owner: string; inspection: string; nextAction: string;
}
export const ENERGY_AS_OF = "2026-11-22";
export function buildEnergyDemo(): EnergyMaterial[] {
  return [
    { id: "E01", material: "Transformador de distribuição 300 kVA", supplier: "Fornecedor Alfa (fictício)", destination: "Base Nordeste A", project: "Ampliação de subestação A", po: "DEMO-PO-001", quantity: 4, unit: "un", needed: "2026-11-25", eta: "2026-11-28", stage: "Produção", owner: "Compras", inspection: "Inspeção de fábrica pendente", nextAction: "Confirmar conclusão da produção e janela de inspeção." },
    { id: "E02", material: "Cabo de média tensão 15 kV", supplier: "Fornecedor Beta (fictício)", destination: "CD Sudeste B", project: "Expansão de rede B", po: "DEMO-PO-002", quantity: 3200, unit: "m", needed: "2026-11-26", eta: "2026-11-24", stage: "Em trânsito", owner: "Distribuição", inspection: "Liberação registrada no exemplo", nextAction: "Confirmar agendamento no CD e evidência de chegada." },
    { id: "E03", material: "Chave seccionadora 24 kV", supplier: "Fornecedor Gama (fictício)", destination: "Base Nordeste A", project: "Ampliação de subestação A", po: "DEMO-PO-003", quantity: 12, unit: "un", needed: "2026-11-24", eta: null, stage: "Inspeção", owner: "Qualidade", inspection: "Laudo técnico pendente", nextAction: "Solicitar laudo e data prevista de liberação; não presumir aprovação." },
    { id: "E04", material: "Isolador polimérico 34,5 kV", supplier: "Fornecedor Delta (fictício)", destination: "Base Centro-Oeste C", project: "Reforço de alimentador C", po: "DEMO-PO-004", quantity: 180, unit: "un", needed: "2026-11-27", eta: "2026-11-29", stage: "Em trânsito", owner: "Distribuição", inspection: "Liberação registrada no exemplo", nextAction: "Validar ETA com operador e avaliar impacto no cronograma da obra." },
    { id: "E05", material: "Para-raios de distribuição 12 kV", supplier: "Fornecedor Alfa (fictício)", destination: "CD Sudeste B", project: "Manutenção programada D", po: "DEMO-PO-005", quantity: 60, unit: "un", needed: "2026-11-30", eta: "2026-11-27", stage: "Produção", owner: "Planejamento", inspection: "Inspeção agendada no exemplo", nextAction: "Acompanhar marco de produção e confirmar inspeção." },
    { id: "E06", material: "Conector de derivação", supplier: "Fornecedor Beta (fictício)", destination: "Base Centro-Oeste C", project: "Reforço de alimentador C", po: "DEMO-PO-006", quantity: 240, unit: "un", needed: "2026-11-24", eta: "2026-11-21", stage: "Recebido", owner: "Distribuição", inspection: "Recebimento registrado no exemplo", nextAction: "Conferir aceite físico e documental antes de encerrar no sistema de origem." },
    { id: "E07", material: "Disjuntor de média tensão 24 kV", supplier: "Fornecedor Gama (fictício)", destination: "Base Sul D", project: "Modernização de subestação E", po: "DEMO-PO-007", quantity: 2, unit: "un", needed: "2026-12-02", eta: null, stage: "Produção", owner: "Compras", inspection: "Ensaios de fábrica não confirmados", nextAction: "Solicitar cronograma de produção, ensaios e transporte." },
    { id: "E08", material: "Cabo multiplexado de baixa tensão", supplier: "Fornecedor Delta (fictício)", destination: "Base Sul D", project: "Expansão de rede F", po: "DEMO-PO-008", quantity: 1800, unit: "m", needed: "2026-11-28", eta: "2026-11-28", stage: "Inspeção", owner: "Qualidade", inspection: "Verificação documental pendente", nextAction: "Confirmar documentos e liberação antes da coleta." },
  ];
}
export function energyRisk(m: EnergyMaterial): "Recebido" | "Sem previsão" | "Atraso previsto" | "Dentro da data" {
  if (m.stage === "Recebido") return "Recebido";
  if (!m.eta) return "Sem previsão";
  return m.eta > m.needed ? "Atraso previsto" : "Dentro da data";
}
export function energySummary(materials: EnergyMaterial[]) {
  const open = materials.filter((m) => m.stage !== "Recebido");
  const risks = open.filter((m) => energyRisk(m) !== "Dentro da data");
  return { open: open.length, late: open.filter((m) => energyRisk(m) === "Atraso previsto").length,
    unknown: open.filter((m) => !m.eta).length, projects: new Set(risks.map((m) => m.project)).size };
}