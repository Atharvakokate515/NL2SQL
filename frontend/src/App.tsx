import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { Navbar } from "@/components/common/Navbar";
import Home from "./pages/Home";
import NL2SQL from "./pages/NL2SQL";
import Copilot from "./pages/Copilot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Pages where the Navbar should be hidden (chat UIs have their own top bar)
const HIDE_NAVBAR_PATHS = ["/nl2sql", "/copilot"];

const AppLayout = () => {
  const location = useLocation();
  const hideNavbar = HIDE_NAVBAR_PATHS.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nl2sql" element={<NL2SQL />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;