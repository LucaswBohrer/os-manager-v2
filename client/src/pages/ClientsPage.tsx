import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery();
  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setIsOpen(false);
      setName("");
      setDocument("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
      utils.clients.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar cliente: ${err.message}`);
    },
  });

  const clients = clientsQuery.data ?? [];
  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.document && c.document.includes(search))
  );

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-muted/20 -m-4 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  Gestão de Clientes
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
              <p className="text-sm text-muted-foreground">Cadastre e gerencie o cadastro de pessoas físicas e jurídicas.</p>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 gap-2 rounded-xl px-5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Novo cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Cadastrar novo cliente</DialogTitle>
                  <DialogDescription>Preencha os dados de contato do cliente para iniciar o atendimento.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo / Razão social *</Label>
                    <Input id="name" placeholder="Ex: João da Silva" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF / CNPJ</Label>
                      <Input id="document" placeholder="Ex: 000.000.000-00" value={document} onChange={e => setDocument(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone / WhatsApp</Label>
                      <Input id="phone" placeholder="Ex: (11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="cliente@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" placeholder="00000-000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Logradouro e Número</Label>
                      <Input id="address" placeholder="Rua Exemplo, 123" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input id="neighborhood" placeholder="Centro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" placeholder="São Paulo" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">UF</Label>
                      <Input id="state" placeholder="SP" maxLength={2} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" placeholder="Preferências ou recados importantes" value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button 
                    disabled={createClientMutation.isPending || !name.trim()}
                    onClick={() => createClientMutation.mutate({ name, document, phone, email: email || undefined, address, notes })}
                  >
                    {createClientMutation.isPending ? "Salvando..." : "Salvar cliente"}
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
                    placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {clientsQuery.isLoading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-4 font-medium">Nenhum cliente encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro cliente para vincular equipamentos e ordens de serviço.</p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {filtered.map(client => (
                    <div key={client.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{client.name}</span>
                          <Badge variant="outline" className="text-xs">ID #{client.id}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {client.phone && <span>Tel: {client.phone}</span>}
                          {client.document && <span>Doc: {client.document}</span>}
                          {client.email && <span>Email: {client.email}</span>}
                        </div>
                        {client.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Ver equipamentos</Button>
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
