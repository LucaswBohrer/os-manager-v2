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
  const [defectReported, setDefectReported] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [warrantyDays, setWarrantyDays] = useState<string>("90");

  // Campos de texto livre exigidos pelo roadmap / usuário
  const [equipType, setEquipType] = useState("");
  const [equipBrand, setEquipBrand] = useState("");
  const [equipModel, setEquipModel] = useState("");
  const [equipSerial, setEquipSerial] = useState("");

  // Novo cliente inline state
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientDoc, setNewClientDoc] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (client) => {
      toast.success(`Cliente ${client.name} cadastrado e selecionado!`);
      setClientId(String(client.id));
      setShowNewClient(false);
      setNewClientName("");
      setNewClientPhone("");
      setNewClientDoc("");
      setNewClientEmail("");
      setNewClientAddress("");
      clientsQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar cliente: ${err.message}`);
    }
  });

  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery();
  const ordersQuery = trpc.serviceOrders.list.useQuery();

  // Mutation auxiliar para criar o equipamento inline ao submeter a OS
  const createEquipAndOrder = async () => {
    try {
      // 1. Cadastra o equipamento com os campos livres informados
      const equip = await trpc.equipments.create.query({ // ou mutate async
        // como é tRPC mutation no cliente:
      });
    } catch(e) {}
  };

  // Usaremos uma mutation combinada ou criamos o equipamento antes de criar a OS
  const createEquipMutation = trpc.equipments.create.useMutation();
  
  const createOrderMutation = trpc.serviceOrders.create.useMutation({
    onSuccess: (id) => {
      toast.success(`Ordem de Serviço #${id} criada com sucesso!`);
      setIsOpen(false);
      setClientId("");
      setEquipType("");
      setEquipBrand("");
      setEquipModel("");
      setEquipSerial("");
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
                        <Input placeholder="Nome completo / Razão social *" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Telefone / WhatsApp" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                          <Input placeholder="CPF ou CNPJ" value={newClientDoc} onChange={e => setNewClientDoc(e.target.value)} />
                        </div>
                        <Input placeholder="E-mail" type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} />
                        <Input placeholder="Endereço completo (Rua, nº, bairro, cidade - UF)" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} />
                        <Button 
                          type="button" 
                          size="sm" 
                          className="w-full"
                          disabled={!newClientName.trim() || createClientMutation.isPending}
                          onClick={() => createClientMutation.mutate({ 
                            name: newClientName, 
                            phone: newClientPhone, 
                            document: newClientDoc, 
                            email: newClientEmail || undefined, 
                            address: newClientAddress || undefined 
                          })}
                        >
                          Salvar e Selecionar Cliente
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Pesquisar cliente por nome, tel, CPF ou e-mail..."
                            value={clientSearchQuery}
                            onChange={e => setClientSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={clientId} onValueChange={setClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente na lista..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {clients
                              .filter(c => 
                                c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                                (c.phone && c.phone.includes(clientSearchQuery)) ||
                                (c.document && c.document.includes(clientSearchQuery)) ||
                                (c.email && c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                              )
                              .map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name} {c.phone ? `(${c.phone})` : ""} {c.email ? `- ${c.email}` : ""}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                    <h3 className="text-sm font-medium leading-none">Dados do Equipamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Equipamento *</Label>
                        <Input placeholder="Ex: Notebook, Placa, TV" value={equipType} onChange={e => setEquipType(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input placeholder="Ex: Dell, Samsung" value={equipBrand} onChange={e => setEquipBrand(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Modelo</Label>
                        <Input placeholder="Ex: Inspiron 15" value={equipModel} onChange={e => setEquipModel(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Número de série</Label>
                        <Input placeholder="Ex: SN12345678" value={equipSerial} onChange={e => setEquipSerial(e.target.value)} />
                      </div>
                    </div>
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
                    disabled={createOrderMutation.isPending || createEquipMutation.isPending || !clientId || !equipType.trim() || !defectReported.trim()}
                    onClick={async () => {
                      try {
                        // 1. Cria o equipamento primeiro com os campos livres
                        const newEquip = await createEquipMutation.mutateAsync({
                          clientId: Number(clientId),
                          type: equipType,
                          brand: equipBrand,
                          model: equipModel,
                          serialNumber: equipSerial,
                        });
                        // 2. Cria a OS vinculando o equipamento recém-criado
                        createOrderMutation.mutate({
                          clientId: Number(clientId),
                          equipmentId: newEquip.id,
                          defectReported,
                          priority: priority as any,
                          warrantyDays: Number(warrantyDays) || 90,
                        });
                      } catch (err: any) {
                        toast.error(`Erro ao registrar equipamento: ${err.message}`);
                      }
                    }}
                  >
                    {createOrderMutation.isPending || createEquipMutation.isPending ? "Criando OS..." : "Criar Ordem de Serviço"}
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
