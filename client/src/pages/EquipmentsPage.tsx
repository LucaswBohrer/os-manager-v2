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
import { Plus, Search, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EquipmentsPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [specs, setSpecs] = useState("");

  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery();
  const equipmentsQuery = trpc.equipments.list.useQuery();

  const createEquipmentMutation = trpc.equipments.create.useMutation({
    onSuccess: () => {
      toast.success("Equipamento cadastrado com sucesso!");
      setIsOpen(false);
      setClientId("");
      setType("");
      setBrand("");
      setModel("");
      setSerialNumber("");
      setSpecs("");
      utils.equipments.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar equipamento: ${err.message}`);
    },
  });

  const clients = clientsQuery.data ?? [];
  const equipments = equipmentsQuery.data ?? [];
  
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const filtered = equipments.filter(eq => {
    const clientName = clientMap.get(eq.clientId) || "";
    return (
      eq.type.toLowerCase().includes(search.toLowerCase()) ||
      (eq.brand && eq.brand.toLowerCase().includes(search.toLowerCase())) ||
      (eq.model && eq.model.toLowerCase().includes(search.toLowerCase())) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
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
                  Gestão de Ativos
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Equipamentos</h1>
              <p className="text-sm text-muted-foreground">Vincule notebooks, desktops, celulares e outros ativos aos clientes.</p>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 gap-2 rounded-xl px-5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Novo equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Cadastrar novo equipamento</DialogTitle>
                  <DialogDescription>Selecione o proprietário e informe os detalhes técnicos do aparelho.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Proprietário (Cliente) *</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name} (ID #{c.id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Equipamento / Aparelho *</Label>
                    <Input id="type" placeholder="Ex: Notebook, Smartphone, Impressora" value={type} onChange={e => setType(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Input id="brand" placeholder="Ex: Dell, Apple, Samsung" value={brand} onChange={e => setBrand(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input id="model" placeholder="Ex: Inspiron 15, iPhone 13" value={model} onChange={e => setModel(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Número de Série / IMEI</Label>
                    <Input id="serialNumber" placeholder="Ex: SN123456789" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specs">Especificações e Acessórios</Label>
                    <Textarea id="specs" placeholder="Ex: Acompanha carregador original, 8GB RAM, SSD 256GB" value={specs} onChange={e => setSpecs(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button 
                    disabled={createEquipmentMutation.isPending || !clientId || !type.trim()}
                    onClick={() => createEquipmentMutation.mutate({ clientId: Number(clientId), type, brand, model, serialNumber, specs })}
                  >
                    {createEquipmentMutation.isPending ? "Salvando..." : "Salvar equipamento"}
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
                    placeholder="Buscar por tipo, marca, modelo, número de série ou cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {equipmentsQuery.isLoading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                  <Wrench className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-4 font-medium">Nenhum equipamento encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cadastre equipamentos vinculados aos clientes para abrir ordens de serviço.</p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {filtered.map(eq => {
                    const clientName = clientMap.get(eq.clientId) || `Cliente #${eq.clientId}`;
                    return (
                      <div key={eq.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{eq.type} {eq.brand} {eq.model}</span>
                            <Badge variant="outline" className="text-xs">ID #{eq.id}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>Proprietário: <strong className="text-foreground">{clientName}</strong></span>
                            {eq.serialNumber && <span>S/N: {eq.serialNumber}</span>}
                          </div>
                          {eq.specs && <p className="text-xs text-muted-foreground">Specs: {eq.specs}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">Abrir OS</Button>
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
