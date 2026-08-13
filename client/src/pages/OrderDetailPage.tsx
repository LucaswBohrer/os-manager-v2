import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Wrench, FileText, CheckCircle2, AlertTriangle, User, Monitor, DollarSign, PackageCheck, Layers, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute, Link } from "wouter";
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
    urgent: "Urgente",
  };

  const partsTotal = orderParts.reduce((acc, p: any) => acc + (Number(p.sellPrice || 0) * Number(p.quantity || 1)), 0);
  const laborNum = Number(order.laborCost || laborCost || 0);
  const discountNum = Number(order.discount || discount || 0);
  const totalAmount = Math.max(0, partsTotal + laborNum - discountNum);

  return (
    <div className="min-h-screen bg-muted/20 p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/ordens">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">OS #{order.displayNumber || String(order.sequentialNumber || order.id).padStart(5, "0")}</h1>
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade</p>
                        <p className="font-semibold text-sm mt-1">{priorityLabels[order.priority] || order.priority}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Garantia</p>
                        <p className="font-semibold text-sm mt-1">{order.warrantyDays || 90} dias</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Defeito Relatado pelo Cliente</p>
                      <p className="text-sm mt-1 p-3.5 rounded-xl bg-muted/40 border">{order.defectReported}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/60 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Cliente Vinculado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold">{client?.name || "Cliente não vinculado"}</p>
                  <p className="text-muted-foreground">Telefone: {client?.phone || "Não informado"}</p>
                  <p className="text-muted-foreground">CPF/CNPJ: {client?.document || "Não informado"}</p>
                  <p className="text-muted-foreground">E-mail: {client?.email || "Não informado"}</p>
                  <p className="text-muted-foreground">Endereço: {client?.address || "Não informado"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /> Equipamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold">{equipment ? `${equipment.type} - ${equipment.brand || ""} ${equipment.model || ""}` : "Equipamento vinculado"}</p>
                  <p className="text-muted-foreground">Número de Série: {equipment?.serialNumber || "N/D"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnostico" className="space-y-6">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Laudo Técnico e Diagnóstico</CardTitle>
              <CardDescription>Registro detalhado da análise técnica realizada na bancada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Laudo Técnico Atual</label>
                <textarea 
                  className="w-full mt-2 p-4 border rounded-xl text-sm bg-background min-h-[160px] outline-none focus:ring-2 focus:ring-primary/25" 
                  placeholder="Descreva a causa raiz, testes efetuados e a solução aplicada..."
                  value={editDiagnosis}
                  onChange={e => setEditDiagnosis(e.target.value)}
                  defaultValue={order.diagnosis || ""}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => updateDetailsMutation.mutate({ id: order.id, diagnosis: editDiagnosis || order.diagnosis })}
                  disabled={updateDetailsMutation.isPending}
                >
                  Salvar Diagnóstico
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamento" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/60 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Composição do Orçamento</CardTitle>
                <CardDescription>Valores de peças, mão de obra e descontos calculados pelo sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Valor Mão de Obra (R$)</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-background" 
                      value={order.laborCost || laborCost} 
                      onChange={e => setLaborCost(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Desconto Aplicado (R$)</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-background" 
                      value={order.discount || discount} 
                      onChange={e => setDiscount(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal Peças:</span>
                    <span className="font-medium">R$ {partsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mão de Obra:</span>
                    <span className="font-medium">R$ {Number(order.laborCost || laborCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto:</span>
                    <span className="font-medium text-red-600">- R$ {Number(order.discount || discount || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-bold">
                    <span>Total da OS:</span>
                    <span className="text-primary text-xl">R$ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Aprovação do Orçamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">O orçamento pode ser apresentado ao cliente via PDF ou no portal web.</p>
                <Button className="w-full gap-2" variant="outline" onClick={() => toast.info("Geração de PDF de orçamento em breve na Evolução 6.")}>
                  <FileText className="h-4 w-4" /> Gerar PDF Orçamento
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Serviços e Mão de Obra</CardTitle>
              <CardDescription>Escopo de intervenções técnicas executadas ou previstas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
                <Layers className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <p className="font-medium">Nenhum serviço avulso lançado ainda</p>
                <p className="text-sm text-muted-foreground">A mão de obra principal já está integrada no orçamento geral da OS.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pecas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/60 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Peças Vinculadas à OS</CardTitle>
                <CardDescription>Componentes aplicados no reparo e baixa automática no estoque</CardDescription>
              </CardHeader>
              <CardContent>
                {orderParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center space-y-2">
                    <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <p className="font-medium">Nenhuma peça vinculada a esta OS</p>
                    <p className="text-sm text-muted-foreground">Utilize o painel ao lado para selecionar e adicionar peças do estoque.</p>
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border">
                    {orderParts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold">Peça ID #{p.partId}</p>
                          <p className="text-xs text-muted-foreground">Quantidade: {p.quantity} • Valor Unit.: R$ {p.sellPrice || "0.00"}</p>
                        </div>
                        <span className="font-bold text-primary">R$ {((Number(p.sellPrice || 0) * Number(p.quantity || 1))).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Adicionar Peça do Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Selecionar Peça</label>
                  <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha uma peça..." /></SelectTrigger>
                    <SelectContent>
                      {catalogParts.map((part: any) => (
                        <SelectItem key={part.id} value={String(part.id)}>
                          {part.name} (Estoque: {part.stockQty}) - R$ {part.sellPrice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                  <input type="number" min="1" className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-background" value={partQty} onChange={e => setPartQty(e.target.value)} />
                </div>
                <Button 
                  className="w-full gap-2" 
                  disabled={!selectedPartId || addPartMutation.isPending}
                  onClick={() => {
                    const part = catalogParts.find((p: any) => String(p.id) === selectedPartId);
                    if (!part) return;
                    addPartMutation.mutate({
                      serviceOrderId: order.id,
                      partId: Number(selectedPartId),
                      quantity: Number(partQty) || 1,
                      sellPrice: part.sellPrice || "0.00",
                    });
                  }}
                >
                  <Plus className="h-4 w-4" /> Adicionar e Reservar Peça
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Histórico Completo de Auditoria</CardTitle>
              <CardDescription>Linha do tempo oficial com todas as ações e alterações da ordem de serviço</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento registrado no histórico.</p>
              ) : (
                <div className="space-y-4 border-l-2 border-primary/20 pl-4 ml-2">
                  {history.map((h: any, idx: number) => (
                    <div key={idx} className="space-y-1 relative">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-sm font-semibold text-foreground">{h.action || "Atualização"}</p>
                      <p className="text-sm text-muted-foreground">{h.description}</p>
                      <p className="text-xs text-muted-foreground/80">{new Date(h.date || h.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
