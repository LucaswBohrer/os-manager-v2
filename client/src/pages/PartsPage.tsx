import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Plus, Search } from "lucide-react";

export function PartsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [minStockQty, setMinStockQty] = useState("2");
  const [search, setSearch] = useState("");

  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState("1");
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");

  const utils = trpc.useUtils();
  const partsQuery = trpc.parts.list.useQuery();

  const createPartMutation = trpc.parts.create.useMutation({
    onSuccess: () => {
      toast.success("Peça cadastrada com sucesso!");
      setIsOpen(false);
      setName("");
      setSku("");
      setCostPrice("");
      setSellPrice("");
      setStockQty("");
      setMinStockQty("2");
      utils.parts.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar peça: ${err.message}`);
    },
  });

  const adjustStockMutation = trpc.parts.adjustStock.useMutation({
    onSuccess: () => {
      toast.success("Estoque ajustado com sucesso!");
      setIsAdjustOpen(false);
      setAdjustQty("1");
      setSelectedPartId(null);
      utils.parts.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao ajustar estoque: ${err.message}`);
    },
  });

  const parts = partsQuery.data ?? [];
  const filtered = parts.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-muted/20 -m-4 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Estoque e Peças</h1>
              <p className="text-muted-foreground">Gerencie componentes, peças de reposição e controle de estoque integrado às OS.</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Nova Peça / Componente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Peça</DialogTitle>
                  <DialogDescription>Insira os dados do item de estoque.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Peça *</Label>
                    <Input id="name" placeholder="Ex: Tela iPhone 13 / SSD NVMe 500GB" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU / Código</Label>
                      <Input id="sku" placeholder="Ex: TELA-IP13" value={sku} onChange={e => setSku(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Qtd. Inicial *</Label>
                      <Input id="stock" type="number" placeholder="0" value={stockQty} onChange={e => setStockQty(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cost">Custo (R$)</Label>
                      <Input id="cost" placeholder="0.00" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sell">Venda (R$) *</Label>
                      <Input id="sell" placeholder="0.00" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min">Estoque Mín.</Label>
                      <Input id="min" type="number" value={minStockQty} onChange={e => setMinStockQty(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button disabled={createPartMutation.isPending || !name || !sellPrice || !stockQty} onClick={() => {
                    createPartMutation.mutate({
                      name,
                      sku: sku || undefined,
                      costPrice: costPrice || "0.00",
                      sellPrice,
                      stockQty: parseInt(stockQty, 10) || 0,
                      minStockQty: parseInt(minStockQty, 10) || 2,
                    });
                  }}>
                    {createPartMutation.isPending ? "Salvando..." : "Salvar Peça"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Catálogo de Peças</CardTitle>
                  <CardDescription>Lista completa de itens cadastrados no inventário.</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome ou SKU..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhuma peça encontrada</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Cadastre novos componentes para controlar seu estoque.</p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {filtered.map((part: any) => (
                    <div key={part.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{part.name}</span>
                          {part.sku && <Badge variant="outline" className="text-xs">SKU: {part.sku}</Badge>}
                          {part.stockQty <= part.minStockQty && (
                            <Badge variant="destructive" className="text-xs">Estoque baixo</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <span>Estoque: <strong className="text-foreground">{part.stockQty} un.</strong></span>
                          <span>Preço de Venda: <strong className="text-foreground">R$ {Number(part.sellPrice).toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPartId(part.id); setIsAdjustOpen(true); }}>
                          Ajustar estoque
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajustar Estoque de Peça</DialogTitle>
                <DialogDescription>Adicione ou remova unidades do estoque atual.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Operação</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={adjustMode === "add" ? "default" : "outline"} className="flex-1" onClick={() => setAdjustMode("add")}>
                      Adicionar Entrada (+)
                    </Button>
                    <Button type="button" variant={adjustMode === "remove" ? "default" : "outline"} className="flex-1" onClick={() => setAdjustMode("remove")}>
                      Dar Baixa / Saída (-)
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjustQty">Quantidade</Label>
                  <Input id="adjustQty" type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancelar</Button>
                <Button disabled={adjustStockMutation.isPending || !selectedPartId} onClick={() => {
                  if (!selectedPartId) return;
                  const qty = parseInt(adjustQty, 10);
                  if (isNaN(qty) || qty <= 0) {
                    toast.error("Informe uma quantidade válida");
                    return;
                  }
                  const finalChange = adjustMode === "add" ? qty : -qty;
                  adjustStockMutation.mutate({ partId: selectedPartId, quantityChange: finalChange });
                }}>
                  {adjustStockMutation.isPending ? "Salvando..." : "Confirmar Ajuste"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
