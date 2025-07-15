import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { EventDetailPage } from "./components/EventDetailPage";
import { PromoDetailPage } from "./components/PromoDetailPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { Contact } from "./pages/Contact";
import { EditEventPage } from "./pages/EditEventPage";
import { UserProfile } from "./components/UserProfile"; // Import UserProfile

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
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/promo/:id" element={<PromoDetailPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/edit-event/:id" element={<EditEventPage />} />
          <Route path="/profile" element={<UserProfile />} /> {/* New route for user profile */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
