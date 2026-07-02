import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, ArrowRight } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How does batch processing work?",
    answer:
      "Upload your images, build a pipeline by connecting nodes on the canvas (e.g. Load → Crop → Export), then click Process. Every image runs through the same pipeline. The outputs are collected into a single ZIP file for download.",
  },
  {
    question: "What are the free tier limits?",
    answer:
      "Free tier allows up to 10 files per batch, 4 nodes per pipeline, and 10 processing batches per day. Usage resets daily. Upgrade to Pro for unlimited access.",
  },
  {
    question: "How do I pay with USDT (TRC-20)?",
    answer:
      "Go to the Pricing page and select Pro or Lifetime. Copy the USDT (TRC-20) wallet address, send the exact amount, then paste the transaction ID (TxID) in the confirmation modal. Your account upgrades automatically once the transaction is verified via TronScan.",
  },
  {
    question: "What image formats are supported?",
    answer:
      "Input: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF. Output (via the Export node): PNG, JPEG, WebP, AVIF. The Compress and Format nodes let you convert between formats and adjust quality.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. All image processing happens entirely in your browser. Your files are never uploaded to any server — nothing leaves your device. Usage counters are stored locally and synced anonymously with our server only for rate limiting.",
  },
  {
    question: "Can I use the editor without an account?",
    answer:
      "Yes. No signup, no email, no account needed. Just open the editor and start building pipelines.",
  },
  {
    question: "What does each pipeline node do?",
    answer:
      "Load — entry point for your images; Resize — change dimensions; Crop — cut a region; Compress — reduce file size; Format — convert format; Watermark — add text overlay; Denoise — reduce noise; Rename — set output filenames; Export — final output settings. Connect them in any order.",
  },
  {
    question: "How do I connect nodes in the pipeline?",
    answer:
      "Each node has circular handles on its sides. Drag from the output handle (right side) of one node to the input handle (left side) of another. A disconnected node is skipped during processing.",
  },
  {
    question: "What happens if a node fails?",
    answer:
      "Processing continues for the remaining files. Failed files are marked with an error status. You can see the error message in the completion dialog after processing finishes.",
  },
  {
    question: "Can I share my pipeline with someone?",
    answer:
      "Yes. After building a pipeline, click the Share button in the editor header. You'll get a link that expires after 7 days. Anyone with the link can load the pipeline into their own editor.",
  },
  {
    question: "What is the Lifetime plan?",
    answer:
      "Lifetime costs $30 USDT (one-time). It never expires and includes all features of Pro. No recurring payments, no subscriptions.",
  },
  {
    question: "How long does USDT verification take?",
    answer:
      "Once you submit the transaction ID (TxID), verification typically completes within a few seconds. In rare cases, it may take up to a minute depending on TronScan availability.",
  },
];

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left text-gray-200 hover:text-amber-400 transition-colors"
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform flex-shrink-0 ml-4 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-400 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export function FaqPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer,
            },
          })),
        })}
      </script>

      <div className="min-h-screen bg-[#0D0D14] text-gray-100">
        <header className="border-b border-white/5">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="Image Pipeline" className="w-8 h-8" />
              <span className="font-bold text-base">Image Pipeline</span>
            </button>
            <a
              href="https://github.com/v944/image-pipeline"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-400 text-sm mb-8">
            Everything you need to know about Image Pipeline.
          </p>

          <div className="border-t border-white/5">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                question={item.question}
                answer={item.answer}
                open={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>

          <div className="mt-12 text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-semibold mb-2">Still have questions?</h2>
            <p className="text-sm text-gray-400 mb-4">
              Open an issue on GitHub and we&apos;ll help.
            </p>
            <button
              onClick={() => navigate("/editor")}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Open Editor <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        <footer className="border-t border-white/5 py-8 mt-12">
          <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
            <span>Image Pipeline &mdash; Open source batch image processing</span>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/v944/image-pipeline"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors"
              >
                GitHub
              </a>
              <button onClick={() => navigate("/privacy")} className="hover:text-gray-300 transition-colors">Privacy</button>
              <button onClick={() => navigate("/terms")} className="hover:text-gray-300 transition-colors">Terms</button>
              <button onClick={() => navigate("/")} className="hover:text-gray-300 transition-colors">
                Home
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
