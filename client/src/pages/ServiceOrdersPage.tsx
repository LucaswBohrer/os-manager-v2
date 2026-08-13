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

  // Novo cliente inline state
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientDoc, setNewClientDoc] = useState("");

  // Novo equipamento inline state (caso queira cadastrar na hora)
  const [showNewEquip, setShowNewEquip] = useState(false);
  const [newEquipType, setNewEquipType] = useState("Notebook");
  const [newEquipBrand, setNewEquipBrand] = useState("");
  const [newEquipModel, setNewEquipModel] = useState("");
  const [newEquipSerial, setNewEquipSerial] = useState("");

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (client) => {
      toast.success(`Cliente ${client.name} cadastrado e selecionado!`);
      setClientId(String(client.id));
      setShowNewClient(false);
      setNewClientName("");
      setNewClientPhone("");
      setNewClientDoc("");
      clientsQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar cliente: ${err.message}`);
    }
  });

  const createEquipMutation = trpc.equipments.create.useMutation({
    onSuccess: (equip) => {
      toast.success(`Equipamento cadastrado e vinculado!`);
      setEquipmentId(String(equip.id));
      setShowNewEquip(false);
      setNewEquipType("Notebook");
      setNewEquipBrand("");
      setNewEquipModel("");
      setNewEquipSerial("");
      equipmentsQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar equipamento: ${err.message}`);
    }
  });

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

  const clients = clientsQuery.data ?? [];
  const equipments = equipmentsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const filtered = orders.filter(o => {
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client">Cliente *</Label>
                      <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setShowNewClient(!showNewClient)}>
                        {showNewClient ? "Selecionar existente" : "+ Novo Cliente"}
                      </Button>
                    </div>
                    {showNewClient ? (
                      <div className="space-y-3 rounded-xl border p-3 bg-muted/30">
                        <Input placeholder="Nome completo *" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Telefone / WhatsApp" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                          <Input placeholder="CPF ou CNPJ" value={newClientDoc} onChange={e => setNewClientDoc(e.target.value)} />
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          className="w-full"
                          disabled={!newClientName.trim() || createClientMutation.isPending}
                          onClick={() => createClientMutation.mutate({ name: newClientName, phone: newClientPhone, document: newClientDoc })}
                        >
                          Salvar e Selecionar Cliente
                        </Button>
                      </div>
                    ) : (
                      <Select value={clientId} onValueChange={val => { setClientId(val); setEquipmentId(""); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name} (ID #{c.id})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="equipment">Equipamento *</Label>
                      <Button type="button" variant="link" className="h-auto p-0 text-xs" disabled={!clientId} onClick={() => setShowNewEquip(!showNewEquip)}>
                        {showNewEquip ? "Selecionar existente" : "+ Novo Equipamento"}
                      </Button>
                    </div>
                    {showNewEquip ? (
                      <div className="space-y-3 rounded-xl border p-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Tipo (ex: Notebook, TV)" value={newEquipType} onChange={e => setNewEquipType(e.target.value)} />
                          <Input placeholder="Marca (ex: Dell, LG)" value={newEquipBrand} onChange={e => setNewEquipBrand(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Modelo" value={newEquipModel} onChange={e => setNewEquipModel(e.target.value)} />
                          <Input placeholder="Número de Série" value={newEquipSerial} onChange={e => setNewEquipSerial(e.target.value)} />
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          className="w-full"
                          disabled={!clientId || !newEquipType.trim() || createEquipMutation.isPending}
                          onClick={() => createEquipMutation.mutate({ clientId: Number(clientId), type: newEquipType, brand: newEquipBrand, model: newEquipModel, serialNumber: newEquipSerial })}
                        >
                          Cadastrar e Selecionar Equipamento
                        </Button>
                      </div>
                    ) : (
                      <Select value={equipmentId} onValueChange={setEquipmentId} disabled={!clientId}>
                        <SelectTrigger>
                          <SelectValue placeholder={clientId ? "Selecione o equipamento..." : "Primeiro selecione o cliente"} />
                        </SelectTrigger>
                        <SelectContent>
                          {equipments.map(eq => (
                            <SelectItem key={eq.id} value={String(eq.id)}>{eq.type} {eq.brand} {eq.model} (S/N: {eq.serialNumber || "N/D"})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                  {filtered.map(order => {
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
                          <Button variant="outline" size="sm">Gerenciar OS</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
