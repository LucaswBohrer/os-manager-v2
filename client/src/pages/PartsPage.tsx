import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Boxes, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PartsPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("2");
  const [costPrice, setCostPrice] = useState("0.00");
  const [sellPrice, setSellPrice] = useState("0.00");
  const [location, setLocation] = useState("");

  const utils = trpc.useUtils();
  const partsQuery = trpc.parts.list.useQuery();

  const createPartMutation = trpc.parts.create.useMutation({
    onSuccess: () => {
      toast.success("Peça cadastrada com sucesso!");
      setIsOpen(false);
      setName("");
      setSku("");
      setStock("0");
      setMinStock("2");
      setCostPrice("0.00");
      setSellPrice("0.00");
      setLocation("");
      utils.parts.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar peça: ${err.message}`);
    },
  });

  const parts = partsQuery.data ?? [];
  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-muted/20 -m-4 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  Controle de Estoque
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Peças e Componentes</h1>
              <p className="text-sm text-muted-foreground">Gerencie o estoque de peças, preços de custo/venda e baixa automática nas OS.</p>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 gap-2 rounded-xl px-5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Nova Peça / Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Cadastrar nova peça</DialogTitle>
                  <DialogDescription>Informe os dados de estoque, preços e localização no armazém.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Peça / Componente *</Label>
                    <Input id="name" placeholder="Ex: Tela SSD 480GB Kingston, Bateria Notebook" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">Código SKU / Referência</Label>
                      <Input id="sku" placeholder="Ex: SSD480-KNG" value={sku} onChange={e => setSku(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Localização (Prateleira)</Label>
                      <Input id="location" placeholder="Ex: Prateleira B3" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Quantidade em Estoque</Label>
                      <Input id="stock" type="number" value={stock} onChange={e => setStock(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Estoque Mínimo (Alerta)</Label>
                      <Input id="minStock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                      <Input id="costPrice" placeholder="0.00" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellPrice">Preço de Venda (R$) *</Label>
                      <Input id="sellPrice" placeholder="0.00" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button 
                    disabled={createPartMutation.isPending || !name.trim() || !sellPrice.trim()}
                    onClick={() => createPartMutation.mutate({
                      name,
                      sku,
                      stockQty: Number(stock) || 0,
                      minStockQty: Number(minStock) || 2,
                      costPrice,
                      sellPrice,
                    })}
                  >
                    {createPartMutation.isPending ? "Salvando..." : "Salvar peça"}
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
                    placeholder="Buscar por nome da peça ou SKU..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {partsQuery.isLoading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                  <Boxes className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-4 font-medium">Nenhuma peça cadastrada no estoque</p>
                  <p className="mt-1 text-sm text-muted-foreground">Adicione componentes para utilizá-los nos orçamentos e ordens de serviço.</p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {filtered.map(part => (
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
                        <Button variant="outline" size="sm">Ajustar estoque</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
