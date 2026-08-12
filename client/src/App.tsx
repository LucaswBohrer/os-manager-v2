import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import ClientsPage from "@/pages/ClientsPage";
import EquipmentsPage from "@/pages/EquipmentsPage";
import ServiceOrdersPage from "@/pages/ServiceOrdersPage";
import PartsPage from "@/pages/PartsPage";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/clientes" component={ClientsPage} />
      <Route path="/equipamentos" component={EquipmentsPage} />
      <Route path="/ordens" component={ServiceOrdersPage} />
      <Route path="/estoque" component={PartsPage} />
      <Route path="/estoque"><ModulePlaceholder module="estoque" /></Route>
      <Route path="/configuracoes"><ModulePlaceholder module="configuracoes" /></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
