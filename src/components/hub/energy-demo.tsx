import { useState } from "react";
import { Download, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildEnergyDemo, ENERGY_AS_OF, energyRisk, energySummary } from "@/lib/energy-demo";

export function EnergyDemo() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("Todas");
  const [risksOnly, setRisksOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const materials = buildEnergyDemo();
  const summary = energySummary(materials);
  const shown = materials.filter((m) => (destination === "Todas" || m.destination === destination) &&
    (!risksOnly || ["Atraso previsto", "Sem previsão"].includes(energyRisk(m))));
  const detail = materials.find((m) => m.id === selected);
  const download = () => {
    const rows = [["Cenário fictício", "Material", "PO", "Fornecedor", "Destino", "Obra", "Quantidade", "Unidade", "Data necessária", "ETA", "Etapa", "Responsável", "Inspeção", "Próxima ação"],
      ...shown.map((m) => ["DEMO", m.material, m.po, m.supplier, m.destination, m.project, String(m.quantity), m.unit, m.needed, m.eta ?? "", m.stage, m.owner, m.inspection, m.nextAction])];
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "apex-setor-eletrico-ficticio.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <><Button variant="outline" onClick={() => setOpen(true)}><Zap aria-hidden className="size-4" />Demo · Setor elétrico</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>Visibilidade logística · Setor elétrico</DialogTitle><DialogDescription>Cenário fictício independente para o Desafio 3 do PERSEO. Não utiliza dados da Neoenergia nem altera o quadro existente.</DialogDescription></DialogHeader>
      <p className="text-xs text-muted-foreground">Referência fixa: {ENERGY_AS_OF}. Datas, fornecedores, quantidades e destinos são exemplos. Alertas comparam ETA e data necessária; não preveem interrupções da rede.</p>
      <div className="grid grid-cols-2 gap-3 border-y py-4 sm:grid-cols-4">{[[summary.open, "Materiais em aberto"], [summary.late, "ETAs após a necessidade"], [summary.unknown, "Sem ETA confirmada"], [summary.projects, "Obras com alertas"]].map(([n, label]) => <div key={label}><strong className="font-mono text-2xl">{n}</strong><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
      <div className="flex flex-wrap items-center gap-3"><label className="text-xs font-semibold">Destino <select aria-label="Destino elétrico" className="ml-2 h-11 max-w-full rounded-md border border-input bg-card px-2" value={destination} onChange={(e) => setDestination(e.target.value)}><option>Todas</option>{[...new Set(materials.map((m) => m.destination))].map((d) => <option key={d}>{d}</option>)}</select></label>
        <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={risksOnly} onChange={(e) => setRisksOnly(e.target.checked)} />Somente alertas</label>
        <Button variant="outline" onClick={download}><Download aria-hidden className="size-4" />Exportar seleção</Button>
        <Button variant="ghost" onClick={() => { setDestination("Todas"); setRisksOnly(false); setSelected(null); }}><RotateCcw aria-hidden className="size-4" />Limpar filtros</Button>
      </div>
      <div className="relative max-w-full overflow-x-auto rounded-md border"><table className="w-full min-w-[760px] text-left text-xs"><caption className="sr-only">Materiais fictícios por destino, marco e previsão de entrega</caption><thead className="bg-muted"><tr>{["Material / PO", "Destino / Obra", "Etapa / Responsável", "Necessidade / ETA", "Situação", "Ação"].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead><tbody>{shown.map((m) => <tr key={m.id} className="border-t"><td className="p-3"><p className="font-semibold">{m.material}</p><p className="text-muted-foreground">{m.po} · {m.quantity} {m.unit}</p></td><td className="p-3">{m.destination}<p className="text-muted-foreground">{m.project}</p></td><td className="p-3">{m.stage}<p className="text-muted-foreground">{m.owner}</p></td><td className="p-3 font-mono">{m.needed}<p className="text-muted-foreground">{m.eta ?? "Não informada"}</p></td><td className="p-3 font-semibold">{energyRisk(m)}</td><td className="p-3"><Button variant="outline" onClick={() => setSelected(m.id)}>Detalhes</Button></td></tr>)}</tbody></table>{!shown.length && <p className="p-4 text-sm text-muted-foreground">Nenhum material nesta seleção.</p>}</div>
      {detail && <section aria-label="Detalhes do material elétrico" className="border-t pt-3"><h3 className="font-semibold">{detail.material}</h3><p className="mt-2 text-sm">{detail.supplier} · {detail.inspection}</p><p className="mt-2 text-sm"><strong>Próxima ação sugerida:</strong> {detail.nextAction}</p></section>}
      <p className="text-xs text-muted-foreground">Este preset ilustra produção, inspeção e distribuição. Integrações SAP, operadores, rastreamento e aprovações técnicas reais ainda precisam ser desenvolvidas e validadas em piloto.</p>
    </DialogContent></Dialog>
  </>;
}