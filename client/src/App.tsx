import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Páginas diretas por molde (para anúncios) */}
      <Route path="/casal"     component={Home} />
      <Route path="/mae-bebe"  component={Home} />
      <Route path="/mae-filha" component={Home} />
      <Route path="/pai-filha" component={Home} />
      <Route path="/mae-filho" component={Home} />
      <Route path="/pai-filho" component={Home} />
      <Route path="/familia-3" component={Home} />
      <Route path="/familia-4" component={Home} />
      <Route path="/pet"       component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
