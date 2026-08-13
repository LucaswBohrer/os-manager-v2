import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Wrench, FileText, CheckCircle2, AlertTriangle, User, Monitor } from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailPage() {
  const [, params] = useRoute("/ordens/:id");
  const orderId = Number(params?.id);

  const ordersQuery = trpc.serviceOrders.list.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const equipmentsQuery = trpc.equipments.list.useQuery();
  const historyQuery = trpc.serviceOrders.history.useQuery({ serviceOrderId: orderId }, { enabled: !!orderId });

  const utils = trpc.useUtils();
  const updateStatusMutation = trpc.serviceOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status da OS atualizado com sucesso!");
      utils.serviceOrders.list.invalidate();
      historyQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    }
  });

  const orders = ordersQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const equipments = equipmentsQuery.data ?? [];
  const history = historyQuery.data ?? [];

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
      case "diagnosing": return <Badge className="bg-blue-500">Em Diagnóstico</Badge>;
      case "budget": return <Badge className="bg-amber-500">Orçamento</Badge>;
      case "in_progress": return <Badge className="bg-indigo-500">Em Execução</Badge>;
      case "waiting_parts": return <Badge className="bg-purple-500">Aguardando Peças</Badge>;
      case "completed": return <Badge className="bg-emerald-600">Concluída</Badge>;
      case "delivered": return <Badge className="bg-green-700">Entregue</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ordens">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ordem de Serviço #{order.id}</h1>
            <p className="text-sm text-muted-foreground">Aberta em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Status Atual:</span>
          {getStatusBadge(order.status)}
          <Select defaultValue={order.status} onValueChange={(val) => updateStatusMutation.mutate({ id: order.id, status: val as any })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alterar status" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 space-y-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes do Atendimento
            </CardTitle>
            <CardDescription>Informações do defeito, garantia e prioridade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Prioridade</p>
                <p className="font-medium uppercase text-sm mt-1">{order.priority}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Garantia</p>
                <p className="font-medium text-sm mt-1">{order.warrantyDays} dias</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Defeito Relatado</p>
              <p className="text-sm mt-1 p-3 rounded-lg bg-muted/40 border">{order.defectReported}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{client?.name || "Cliente não vinculado"}</p>
              <p className="text-muted-foreground">Tel: {client?.phone || "Não informado"}</p>
              <p className="text-muted-foreground">Doc: {client?.document || "Não informado"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="h-4 w-4 text-primary" />
                Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{equipment ? `${equipment.type} ${equipment.brand} ${equipment.model}` : "Equipamento vinculado"}</p>
              <p className="text-muted-foreground">S/N: {equipment?.serialNumber || "N/D"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Histórico e Timeline da OS
          </CardTitle>
          <CardDescription>Registro de alterações e movimentações desta ordem de serviço</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento registrado no histórico ainda.</p>
          ) : (
            <div className="space-y-4">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 border-l-2 pl-4 py-1">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{h.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
