import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";

import { WhatsAppGroupDialog } from "@/components/WhatsAppGroupDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InstagramPostGenerator from "./pages/InstagramPostGenerator";
import { EventDetailPage } from "./components/EventDetailPage";
import { PromoDetailPage } from "./components/PromoDetailPage";
import { VenueDetailPage } from "./components/VenueDetailPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { Contact } from "./pages/Contact";
import { EditEventPage } from "./pages/EditEventPage";
import { EditPromoPage } from "./pages/EditPromoPage";
import { UserProfile } from "./components/UserProfile";
import TermsConditions from "./pages/TermsConditions";
import About from "./pages/About";
import ResetPassword from "./pages/ResetPassword";
import WorldCupExplorer from "./pages/WorldCupExplorer";
import Proofing from "./pages/Proofing";
import BatchImport from "./pages/BatchImport";
import MapExplorer from "./pages/MapExplorer";
import VenueDirectory from "./pages/VenueDirectory";
import PromoReview from "./pages/PromoReview";
import VenueAreaReview from "./pages/VenueAreaReview";
import VoucherVerify from "./pages/VoucherVerify";
import Lintang from "./pages/Lintang";

const queryClient = new QueryClient();

// Component to handle scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/events" element={<Index initialSection="events" />} />
          <Route path="/promos" element={<Index initialSection="promos" />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/promo/:id" element={<PromoDetailPage />} />
          <Route path="/venue/:id" element={<VenueDetailPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/instagram-generator" element={<InstagramPostGenerator />} />
          <Route path="/instagram-generator" element={<InstagramPostGenerator />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/edit-event/:id" element={<EditEventPage />} />
          <Route path="/edit-promo/:id" element={<EditPromoPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/admin/user/:userId" element={<UserProfile />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/about" element={<About />} />
          <Route path="/wce" element={<WorldCupExplorer />} />
          <Route path="/import" element={<BatchImport />} />
          <Route path="/map" element={<MapExplorer />} />
          <Route path="/venues" element={<VenueDirectory />} />
          <Route path="/admin/review-promos" element={<PromoReview />} />
          <Route path="/admin/review-venues" element={<VenueAreaReview />} />
          <Route path="/lexium" element={<Proofing />} />
          <Route path="/lintang" element={<Lintang />} />
          <Route path="/voucher/:code" element={<VoucherVerify />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <WhatsAppGroupDialog />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
