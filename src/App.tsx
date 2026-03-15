import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfigModeProvider } from "@/hooks/useConfigMode";
import Index from "./pages/Index.tsx";
import Process from "./pages/Process.tsx";
import FloorPlan from "./pages/FloorPlan.tsx";
import Alarms from "./pages/Alarms.tsx";
import Generators from "./pages/Generators.tsx";
import EquipmentRegistry from "./pages/EquipmentRegistry.tsx";
import EquipmentDetail from "./pages/EquipmentDetail.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/process" element={<Process />} />
            <Route path="/floorplan" element={<FloorPlan />} />
            <Route path="/alarms" element={<Alarms />} />
            <Route path="/generators" element={<Generators />} />
            <Route path="/equipment" element={<EquipmentRegistry />} />
            <Route path="/equipment/:id" element={<EquipmentDetail />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ConfigModeProvider>
  </QueryClientProvider>
);

export default App;
