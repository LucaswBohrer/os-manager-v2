import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, ClipboardList, HardDrive, Package, Plus, Users, Wrench } from "lucide-react";
import { useLocation } from "wouter";

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof Users;
  tone: "blue" | "violet" | "amber" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  };

  return (
    <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`rounded-2xl p-3 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const metricsQuery = trpc.dashboard.metrics.useQuery();
  const recentOrdersQuery = trpc.dashboard.recentOrders.useQuery();
  const metrics = metricsQuery.data;
  const recentOrders = recentOrdersQuery.data ?? [];

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

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-muted/20 -m-4 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Operação local ativa
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Visão geral</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Acompanhe a operação da assistência técnica e mantenha cada ordem de serviço sob controle.
              </p>
            </div>
            <Button onClick={() => setLocation("/ordens")} className="h-11 gap-2 rounded-xl px-5 shadow-sm">
              <Plus className="h-4 w-4" />
              Nova ordem de serviço
            </Button>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principais">
            <MetricCard label="Clientes" value={metricsQuery.isLoading ? "—" : metrics?.clients ?? 0} description="cadastros ativos" icon={Users} tone="blue" />
            <MetricCard label="Ordens abertas" value={metricsQuery.isLoading ? "—" : metrics?.openOrders ?? 0} description="aguardando atendimento" icon={ClipboardList} tone="violet" />
            <MetricCard label="Equipamentos" value={metricsQuery.isLoading ? "—" : metrics?.equipments ?? 0} description="ativos cadastrados" icon={Wrench} tone="amber" />
            <MetricCard label="Itens no estoque" value={metricsQuery.isLoading ? "—" : metrics?.parts ?? 0} description="peças e componentes" icon={Package} tone="emerald" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">Ordens recentes</CardTitle>
                  <CardDescription>Últimas movimentações registradas no sistema.</CardDescription>
                </div>
                <Button variant="ghost" className="gap-1 text-primary" onClick={() => setLocation("/ordens")}>
                  Ver todas <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrdersQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(item => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <p className="mt-3 font-medium">Nenhuma ordem registrada ainda</p>
                    <p className="mt-1 text-sm text-muted-foreground">Abra a primeira OS para começar a acompanhar a operação.</p>
                    <Button variant="outline" className="mt-5" onClick={() => setLocation("/ordens")}>Abrir primeira OS</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map(order => (
                      <button key={order.id} onClick={() => setLocation(`/ordens/${order.id}`)} className="flex w-full items-center justify-between gap-4 rounded-xl p-3 text-left transition-colors hover:bg-muted/60">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ClipboardList className="h-4 w-4" /></div>
                          <div className="min-w-0">
                            <p className="font-medium">OS #{order.displayNumber || String(order.sequentialNumber || order.id).padStart(5, "0")}</p>
                            <p className="truncate text-sm text-muted-foreground">{order.defectReported}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">{statusLabels[order.status] ?? order.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/60 bg-slate-950 text-slate-50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-300"><HardDrive className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Local-first</span></div>
                <CardTitle className="mt-3 text-xl text-white">Dados sob seu controle</CardTitle>
                <CardDescription className="text-slate-300">O núcleo operacional permanece disponível mesmo quando integrações externas estiverem indisponíveis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-300">Banco operacional</span><span className="font-medium text-emerald-300">Pronto</span></div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full rounded-full bg-emerald-400" /></div>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">Backups, documentos e integrações serão habilitados em módulos independentes, sem bloquear o atendimento diário.</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <button onClick={() => setLocation("/clientes")} className="group rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><Users className="h-5 w-5 text-primary" /><p className="mt-4 font-semibold">Cadastrar cliente</p><p className="mt-1 text-sm text-muted-foreground">Mantenha contatos e histórico organizados.</p><ArrowUpRight className="mt-5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></button>
            <button onClick={() => setLocation("/equipamentos")} className="group rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><Wrench className="h-5 w-5 text-primary" /><p className="mt-4 font-semibold">Adicionar equipamento</p><p className="mt-1 text-sm text-muted-foreground">Vincule ativos ao cliente correto.</p><ArrowUpRight className="mt-5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></button>
            <button onClick={() => setLocation("/estoque")} className="group rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><Package className="h-5 w-5 text-primary" /><p className="mt-4 font-semibold">Revisar estoque</p><p className="mt-1 text-sm text-muted-foreground">Acompanhe peças e níveis mínimos.</p><ArrowUpRight className="mt-5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></button>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
