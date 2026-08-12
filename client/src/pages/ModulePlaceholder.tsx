import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction, Plus } from "lucide-react";
import { useLocation } from "wouter";

const moduleCopy = {
  clientes: {
    title: "Clientes",
    description: "Cadastre pessoas físicas e jurídicas, mantenha contatos atualizados e consulte o histórico de atendimentos.",
    next: "A próxima entrega deste módulo incluirá busca rápida, cadastro completo e histórico por cliente.",
  },
  equipamentos: {
    title: "Equipamentos",
    description: "Organize os equipamentos de cada cliente por marca, modelo, número de série e histórico de falhas.",
    next: "A próxima entrega deste módulo incluirá vínculo ao cliente e abertura de OS pelo equipamento.",
  },
  ordens: {
    title: "Ordens de serviço",
    description: "O núcleo da operação está preparado no backend para suportar status, prioridades, orçamento e timeline.",
    next: "A próxima entrega deste módulo incluirá o fluxo completo de abertura e atualização da OS.",
  },
  estoque: {
    title: "Estoque e peças",
    description: "Controle peças, custos, preços de venda e níveis mínimos com movimentações vinculadas às OS.",
    next: "A próxima entrega deste módulo incluirá entradas, saídas e alertas de estoque mínimo.",
  },
  configuracoes: {
    title: "Configurações",
    description: "As configurações da empresa, documentos, usuários e integrações opcionais ficarão centralizadas aqui.",
    next: "Este espaço será desenvolvido após a fundação operacional e as regras de negócio principais.",
  },
} as const;

type ModuleKey = keyof typeof moduleCopy;

export default function ModulePlaceholder({ module }: { module: ModuleKey }) {
  const [, setLocation] = useLocation();
  const copy = moduleCopy[module];

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-muted/20 -m-4 p-4 md:p-8">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl items-center justify-center">
          <Card className="w-full max-w-2xl border-border/60 shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Construction className="h-7 w-7" /></div>
              <CardTitle className="text-2xl">{copy.title}</CardTitle>
              <CardDescription className="mx-auto max-w-xl text-base leading-relaxed">{copy.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-center">
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">{copy.next}</div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="outline" className="gap-2" onClick={() => setLocation("/")}><ArrowLeft className="h-4 w-4" />Voltar à visão geral</Button>
                {module === "ordens" && <Button className="gap-2" onClick={() => setLocation("/ordens/nova")}><Plus className="h-4 w-4" />Preparar nova OS</Button>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
