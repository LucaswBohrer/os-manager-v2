import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Wrench, FileText, CheckCircle2, AlertTriangle, User, Monitor, DollarSign, PackageCheck, Layers, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function OrderDetailPage() {
  const [, params] = useRoute("/ordens/:id");
  const orderId = Number(params?.id);

  const ordersQuery = trpc.serviceOrders.list.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const equipmentsQuery = trpc.equipments.list.useQuery();
  const historyQuery = trpc.serviceOrders.history.useQuery({ serviceOrderId: orderId }, { enabled: !!orderId });
  const partsQuery = trpc.serviceOrders.parts.useQuery({ serviceOrderId: orderId }, { enabled: !!orderId });
  const allPartsQuery = trpc.parts.list.useQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [editDefect, setEditDefect] = useState("");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editPriority, setEditPriority] = useState("normal");
  const [editWarranty, setEditWarranty] = useState("90");

  const [laborCost, setLaborCost] = useState("0.00");
  const [discount, setDiscount] = useState("0.00");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState("1");

  const utils = trpc.useUtils();
  const updateStatusMutation = trpc.serviceOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.serviceOrders.list.invalidate();
      utils.dashboard.metrics.invalidate();
      utils.dashboard.recentOrders.invalidate();
      historyQuery.refetch();
      ordersQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    }
  });

  const updateDetailsMutation = trpc.serviceOrders.updateDetails.useMutation({
    onSuccess: () => {
      toast.success("Detalhes da OS atualizados!");
      setIsEditing(false);
      utils.serviceOrders.list.invalidate();
      historyQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar OS: ${err.message}`);
    }
  });

  const addPartMutation = trpc.serviceOrders.addPart.useMutation({
    onSuccess: () => {
      toast.success("Peça adicionada à OS e estoque reservado!");
      partsQuery.refetch();
      historyQuery.refetch();
      setSelectedPartId("");
      setPartQty("1");
    },
    onError: (err) => {
      toast.error(`Erro ao adicionar peça: ${err.message}`);
    }
  });

  const orders = ordersQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const equipments = equipmentsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const orderParts = partsQuery.data ?? [];
  const catalogParts = allPartsQuery.data ?? [];

  const order = orders.find(o => o.id === orderId);
  const client = clients.find(c => c.id === order?.clientId);
  const equipment = equipments.find(eq => eq.id === order?.equipmentId);

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-bold">Ordem de Serviço não encontrada</h2>
          <p className="text-muted-foreground">A OS #{orderId} não existe ou foi removida.</p>
          <Link href="/ordens">
            <Button>Voltar para Ordens de Serviço</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "opened": return <Badge variant="secondary">Aberta</Badge>;
      case "diagnosing": return <Badge className="bg-blue-500 text-white">Em Diagnóstico</Badge>;
      case "budget": return <Badge className="bg-amber-500 text-white">Orçamento</Badge>;
      case "in_progress": return <Badge className="bg-indigo-500 text-white">Em Execução</Badge>;
      case "waiting_parts": return <Badge className="bg-purple-500 text-white">Aguardando Peças</Badge>;
      case "completed": return <Badge className="bg-emerald-600 text-white">Concluída</Badge>;
      case "delivered": return <Badge className="bg-green-700 text-white">Entregue</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const priorityLabels: Record<string, string> = {
    low: "Baixa",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente"
  };

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background p-6 rounded-3xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/ordens">
            <Button variant="outline" size="icon" className="rounded-2xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">OS #{order.displayNumber || String(order.sequentialNumber || order.id).padStart(5, '0')}</h1>
              {getStatusBadge(order.status)}
              <Badge variant="outline" className="font-medium text-xs">Prioridade: {priorityLabels[order.priority] || order.priority}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cliente: <strong className="text-foreground">{client?.name || "Não informado"}</strong> • Aberta em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Alterar Status:</span>
          <Select value={order.status} onValueChange={(val) => updateStatusMutation.mutate({ id: order.id, status: val as any })}>
            <SelectTrigger className="w-[190px] rounded-xl font-medium">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opened">Aberta</SelectItem>
              <SelectItem value="diagnosing">Em Diagnóstico</SelectItem>
              <SelectItem value="budget">Orçamento</SelectItem>
              <SelectItem value="in_progress">Em Execução</SelectItem>
              <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1.5 bg-muted/60 rounded-2xl">
          <TabsTrigger value="resumo" className="rounded-xl py-2.5 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Resumo</TabsTrigger>
          <TabsTrigger value="diagnostico" className="rounded-xl py-2.5 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Diagnóstico</TabsTrigger>
          <TabsTrigger value="orcamento" className="rounded-xl py-2.5 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Orçamento</TabsTrigger>
          <TabsTrigger value="servicos" className="rounded-xl py-2.5 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Serviços</TabsTrigger>
          <TabsTrigger value="pecas" className="rounded-xl py-2.5 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Peças e Estoque</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-xl py-2.5 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/60 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Dados Principais da OS</CardTitle>
                  <CardDescription>Defeito relatado, equipamento e prazos de garantia</CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditDefect(order.defectReported || "");
                    setEditDiagnosis(order.diagnosis || "");
                    setEditPriority(order.priority || "normal");
                    setEditWarranty(String(order.warrantyDays || 90));
                    setIsEditing(true);
                  }}>
                    Editar Dados
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button size="sm" disabled={updateDetailsMutation.isPending} onClick={() => {
                      updateDetailsMutation.mutate({
                        id: order.id,
                        defectReported: editDefect,
                        diagnosis: editDiagnosis,
                        priority: editPriority as any,
                        warrantyDays: Number(editWarranty) || 90,
                      });
                    }}>Salvar</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium">Prioridade</label>
                        <Select value={editPriority} onValueChange={setEditPriority}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Garantia (Dias)</label>
                        <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" value={editWarranty} onChange={e => setEditWarranty(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Defeito Relatado</label>
                      <textarea className="w-full mt-1 p-3 border rounded-md text-sm bg-background" rows={3} value={editDefect} onChange={e => setEditDefect(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Diagnóstico Inicial</label>
                      <textarea className="w-full mt-1 p-3 border rounded-md text-sm bg-background" rows={3} value={editDiagnosis} onChange={e => setEditDiagnosis(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Defeito Relatado</span>
                      <p className="mt-1 font-medium bg-muted/40 p-3 rounded-xl border border-border/40">{order.defectReported || "Nenhum defeito informado."}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Diagnóstico Inicial</span>
                      <p className="mt-1 font-medium bg-muted/40 p-3 rounded-xl border border-border/40">{order.diagnosis || "Aguardando diagnóstico técnico."}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Garantia</span>
                        <p className="mt-1 font-semibold">{order.warrantyDays || 90} dias</p>
                      </div>
                      <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Equipamento Vinculado</span>
                        <p className="mt-1 font-semibold">{equipment ? `${equipment.type} - ${equipment.brand || ''} ${equipment.model || ''}` : "Equipamento Livre"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Cliente</CardTitle>
                <CardDescription>Dados de contato e cadastro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Nome</span>
                  <p className="font-semibold text-base">{client?.name || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Telefone / WhatsApp</span>
                  <p className="font-medium">{client?.phone || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">E-mail</span>
                  <p className="font-medium">{client?.email || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Endereço Completo</span>
                  <p className="font-medium text-muted-foreground">{client?.address || "Não informado"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnostico">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Diagnóstico Técnico Avançado</CardTitle>
              <CardDescription>Laudo, causa raiz, testes realizados e solução executada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/40 space-y-2">
                <h4 className="font-semibold text-sm">Laudo Atual</h4>
                <p className="text-sm text-muted-foreground">{order.diagnosis || "Nenhum laudo registrado até o momento. Utilize o botão 'Editar Dados' na aba Resumo para atualizar o diagnóstico."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamento">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Orçamento e Composição de Custos</CardTitle>
              <CardDescription>Mão de obra, peças, descontos e total aprovado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/40">
                  <span className="text-xs text-muted-foreground">Custo de Peças</span>
                  <p className="text-xl font-bold mt-1">R$ {Number(order.partsCost || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/40">
                  <span className="text-xs text-muted-foreground">Mão de Obra</span>
                  <p className="text-xl font-bold mt-1">R$ {Number(order.laborCost || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/40">
                  <span className="text-xs text-muted-foreground">Desconto</span>
                  <p className="text-xl font-bold mt-1 text-emerald-600">- R$ {Number(order.discount || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <span className="text-xs font-primary font-semibold">Valor Total da OS</span>
                  <p className="text-2xl font-extrabold text-primary mt-1">R$ {Number(order.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Serviços e Mão de Obra</CardTitle>
              <CardDescription>Serviços técnicos prestados nesta ordem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <Wrench className="mx-auto h-10 w-10 opacity-40 mb-3" />
                <p>Módulo de serviços vinculado à OS em andamento.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pecas" className="space-y-6">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Peças Utilizadas nesta OS</CardTitle>
                <CardDescription>Componentes vinculados com baixa automática no estoque local</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-3 items-end bg-muted/40 p-4 rounded-2xl border border-border/40">
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium">Selecionar Peça do Estoque</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                    <option value="">Selecione uma peça...</option>
                    {catalogParts.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} (Disponível: {p.stockQty} - R$ {p.sellPrice})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="text-xs font-medium">Quantidade</label>
                  <input type="number" min="1" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" value={partQty} onChange={e => setPartQty(e.target.value)} />
                </div>
                <Button disabled={!selectedPartId || addPartMutation.isPending} onClick={() => {
                  if (!selectedPartId) return;
                  addPartMutation.mutate({
                    serviceOrderId: order.id,
                    partId: Number(selectedPartId),
                    quantity: Number(partQty) || 1,
                    unitPrice: "0.00"
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Peça
                </Button>
              </div>

              <div className="rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border/40 text-left">
                    <tr>
                      <th className="p-3 font-semibold">Peça / Componente</th>
                      <th className="p-3 font-semibold">Quantidade</th>
                      <th className="p-3 font-semibold">Preço Unitário</th>
                      <th className="p-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderParts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhuma peça vinculada a esta OS.</td>
                      </tr>
                    ) : (
                      orderParts.map((op: any) => {
                        const partObj = catalogParts.find((p: any) => p.id === op.partId);
                        const qty = op.quantity || 1;
                        const price = Number(op.unitPrice || partObj?.sellPrice || 0);
                        return (
                          <tr key={op.id} className="border-b border-border/40">
                            <td className="p-3 font-medium">{partObj?.name || `Peça #${op.partId}`}</td>
                            <td className="p-3">{qty}</td>
                            <td className="p-3">R$ {price.toFixed(2)}</td>
                            <td className="p-3 text-right font-semibold">R$ {(qty * price).toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Histórico e Timeline de Auditoria</CardTitle>
              <CardDescription>Registro completo de todas as alterações e movimentações da OS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pl-4 border-l-2 border-primary/30 my-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
                ) : (
                  history.map((h: any, i: number) => (
                    <div key={i} className="relative pl-6 space-y-1">
                      <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary border-4 border-background" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{h.action}</span>
                        <span className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{h.description}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
