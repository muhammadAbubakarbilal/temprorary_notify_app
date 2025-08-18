import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/Landing";
import Subscribe from "@/pages/Subscribe";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();


  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" nest>
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/signin" component={SignIn} />
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <SignIn />}
      </Route>
      <Route path="/project/:id">
        {isAuthenticated ? <Dashboard /> : <SignIn />}
      </Route>
      <Route path="/subscribe">
        {isAuthenticated ? <Subscribe /> : <SignIn />}
      </Route>
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