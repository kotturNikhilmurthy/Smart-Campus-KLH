import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import LostFound from "./pages/LostFound";
import Feedback from "./pages/Feedback";
import Clubs from "./pages/Clubs";
import Resources from "./pages/Resources";
import Polls from "./pages/Polls";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/announcements" element={<Announcements />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
