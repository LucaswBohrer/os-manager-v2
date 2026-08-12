import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Plus, Search, Wrench, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  opened: "Aberta",
  diagnosing: "Em diagnóstico",
  budget: "Orçamento",
  in_progress: "Em andamento",
  waiting_parts: "Aguardando peça",
  completed: "Concluída",
  delivered: "Entregue",
  cancelled: "Cancelada",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export default function ServiceOrdersPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [defectReported, setDefectReported] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [warrantyDays, setWarrantyDays] = useState<string>("90");

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("opened");
  const [statusNotes, setStatusNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [laborCost, setLaborCost] = useState("0.00");
  const [partsCost, setPartsCost] = useState("0.00");
  const [discount, setDiscount] = useState("0.00");

  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery();
  const equipmentsQuery = trpc.equipments.list.useQuery(
    clientId ? { clientId: Number(clientId) } : undefined
  );
  const ordersQuery = trpc.serviceOrders.list.useQuery();

  const createOrderMutation = trpc.serviceOrders.create.useMutation({
    onSuccess: (id) => {
      toast.success(`Ordem de Serviço #${id} criada com sucesso!`);
      setIsOpen(false);
      setClientId("");
      setEquipmentId("");
      setDefectReported("");
      setPriority("normal");
      setWarrantyDays("90");
      utils.serviceOrders.list.invalidate();
      utils.dashboard.metrics.invalidate();
      utils.dashboard.recentOrders.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao criar OS: ${err.message}`);
    },
  });

  const updateStatusMutation = trpc.serviceOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.serviceOrders.list.invalidate();
      utils.dashboard.metrics.invalidate();
      utils.dashboard.recentOrders.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    },
  });

  const updateDetailsMutation = trpc.serviceOrders.updateDetails.useMutation({
    onSuccess: () => {
      toast.success("Diagnóstico e orçamento salvos!");
      setIsDetailOpen(false);
      utils.serviceOrders.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao salvar orçamento: ${err.message}`);
    },
  });

  const clients = clientsQuery.data ?? [];
  const equipments = equipmentsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const clientMap = new Map(clients.map((c: any) => [c.id, c.name]));

  const filtered = orders.filter((o: any) => {
    const clientName = clientMap.get(o.clientId) || "";
    return (
      String(o.id).includes(search) ||
      o.defectReported.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-muted/20 -m-4 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  Núcleo Operacional
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Ordens de Serviço</h1>
              <p className="text-sm text-muted-foreground">Gerencie o ciclo de atendimento, diagnósticos, peças e entregas.</p>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 gap-2 rounded-xl px-5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Nova Ordem de Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Abrir nova Ordem de Serviço</DialogTitle>
                  <DialogDescription>Vincule o cliente, o equipamento e descreva o defeito relatado.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <Select value={clientId} onValueChange={val => { setClientId(val); setEquipmentId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name} (ID #{c.id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipamento *</Label>
                    <Select value={equipmentId} onValueChange={setEquipmentId} disabled={!clientId}>
                      <SelectTrigger>
                        <SelectValue placeholder={clientId ? "Selecione o equipamento..." : "Primeiro selecione o cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq: any) => (
                          <SelectItem key={eq.id} value={String(eq.id)}>{eq.type} {eq.brand} {eq.model} (S/N: {eq.serialNumber || "N/D"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warranty">Garantia (Dias)</Label>
                      <Input id="warranty" type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defect">Defeito Relatado pelo Cliente *</Label>
                    <Textarea id="defect" placeholder="Descreva detalhadamente o problema apresentado..." value={defectReported} onChange={e => setDefectReported(e.target.value)} rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button 
                    disabled={createOrderMutation.isPending || !clientId || !equipmentId || !defectReported.trim()}
                    onClick={() => createOrderMutation.mutate({
                      clientId: Number(clientId),
                      equipmentId: Number(equipmentId),
                      defectReported,
                      priority: priority as any,
                      warrantyDays: Number(warrantyDays) || 90,
                    })}
                  >
                    {createOrderMutation.isPending ? "Criando OS..." : "Criar Ordem de Serviço"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Buscar por número da OS, defeito relatado ou cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ordersQuery.isLoading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-4 font-medium">Nenhuma Ordem de Serviço encontrada</p>
                  <p className="mt-1 text-sm text-muted-foreground">Abra a primeira OS para começar a acompanhar o fluxo técnico.</p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {filtered.map((order: any) => {
                    const clientName = clientMap.get(order.clientId) || `Cliente #${order.clientId}`;
                    return (
                      <div key={order.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">OS #{String(order.id).padStart(5, "0")}</span>
                            <Badge variant="outline" className="text-xs">{statusLabels[order.status] || order.status}</Badge>
                            <Badge variant="secondary" className="text-xs">{priorityLabels[order.priority] || order.priority}</Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{order.defectReported}</p>
                          <p className="text-xs text-muted-foreground">Cliente: <strong className="text-foreground">{clientName}</strong> • Aberta em {new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedOrderId(order.id);
                            setNewStatus(order.status);
                            setDiagnosis(order.diagnosis || "");
                            setLaborCost(order.laborCost || "0.00");
                            setPartsCost(order.partsCost || "0.00");
                            setDiscount(order.discount || "0.00");
                            setIsDetailOpen(true);
                          }}>
                            Gerenciar OS
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciar Ordem de Serviço #{selectedOrderId ? String(selectedOrderId).padStart(5, "0") : ""}</DialogTitle>
                <DialogDescription>Atualize status, diagnóstico técnico, mão de obra e custos do orçamento.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="statusSelect">Status da OS</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger id="statusSelect">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusNotes">Observação da Mudança</Label>
                    <Input id="statusNotes" placeholder="Ex: Peça encomendada" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} />
                  </div>
                </div>
                <Button variant="secondary" onClick={() => {
                  if (!selectedOrderId) return;
                  updateStatusMutation.mutate({
                    id: selectedOrderId,
                    status: newStatus as any,
                    notes: statusNotes,
                  });
                  setStatusNotes("");
                }}>
                  Atualizar Status
                </Button>

                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Laudo Técnico / Diagnóstico</Label>
                    <Textarea id="diagnosis" rows={3} placeholder="Descreva os testes realizados e a solução..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="labor">Mão de Obra (R$)</Label>
                      <Input id="labor" value={laborCost} onChange={e => setLaborCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parts">Peças (R$)</Label>
                      <Input id="parts" value={partsCost} onChange={e => setPartsCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount">Desconto (R$)</Label>
                      <Input id="discount" value={discount} onChange={e => setDiscount(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
                <Button onClick={() => {
                  if (!selectedOrderId) return;
                  const l = parseFloat(laborCost) || 0;
                  const p = parseFloat(partsCost) || 0;
                  const d = parseFloat(discount) || 0;
                  const total = Math.max(0, l + p - d).toFixed(2);
                  updateDetailsMutation.mutate({
                    id: selectedOrderId,
                    diagnosis,
                    laborCost: l.toFixed(2),
                    partsCost: p.toFixed(2),
                    discount: d.toFixed(2),
                    totalAmount: total,
                  });
                }}>
                  Salvar Orçamento e Laudo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
