import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/landing/LandingPage";
import { PricingPage } from "./components/pricing/PricingPage";
import { EditorLayout } from "./components/layout/EditorLayout";
import { FaqPage } from "./pages/FaqPage";
function PricingPageWrapper() {
  return (
    <div className="min-h-screen bg-[#0D0D14] text-gray-100 overflow-y-auto">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Image Pipeline" className="w-10 h-10" />
            <span className="font-bold">Image Pipeline</span>
          </div>
        </div>
      </header>
      <PricingPage />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPageWrapper />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/editor" element={<EditorLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
