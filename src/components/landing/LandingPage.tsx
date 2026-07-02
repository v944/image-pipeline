import { ArrowRight, Shield, Zap, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PricingPage } from "../pricing/PricingPage";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D0D14] text-gray-100 overflow-y-auto">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Image Pipeline" className="w-10 h-10" />
            <span className="font-bold">Image Pipeline</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/editor")}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Editor
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/editor")}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            Batch image processing
            <br />
            <span className="text-amber-400">in your browser</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Build visual processing pipelines with a node-based editor.
            Resize, crop, compress, and convert 100s of images at once.
            Nothing leaves your device.
          </p>
          <button
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-base font-medium transition-colors"
          >
            Start Building
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Batch Processing"
              description="Process hundreds of images in one click with a visual node pipeline"
            />
            <FeatureCard
              icon={Shield}
              title="100% Private"
              description="All processing happens in your browser. Images never leave your device."
            />
            <FeatureCard
              icon={Layers}
              title="Node-Based Editor"
              description="Drag and drop nodes to build processing pipelines visually"
            />
          </div>
        </section>

        <PricingPage />

        <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 text-center border-t border-white/5">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-gray-400 mb-4">No signup required. Free for basic use.</p>
          <button
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-base font-medium transition-colors"
          >
            Open Editor
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <span>Image Pipeline — Open source batch image processing</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">GitHub</a>
            <button onClick={() => navigate("/faq")} className="hover:text-gray-300 transition-colors">FAQ</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-gray-300 transition-colors">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-gray-300 transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <Icon className="w-8 h-8 text-amber-400 mb-3" />
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
