import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
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
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: July 1, 2026</p>

        <Section title="Introduction">
          Image Pipeline ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy
          explains how we handle your information when you use our service at imagepipeline.art.
        </Section>

        <Section title="Image Privacy">
          <p className="mb-2">We do not collect, store, or process your images.</p>
          <p className="mb-2">All image processing happens client-side in your browser using WebAssembly and the
          Canvas API. Your images never leave your device.</p>
          <p>We have no access to the images you process, and they are never transmitted to any server.</p>
        </Section>

        <Section title="Information We Collect">
          <p className="mb-4">We collect minimal anonymous usage analytics to improve the service:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
            <li>Page views and navigation patterns</li>
            <li>Feature usage (button clicks, node types used)</li>
            <li>Processing performance metrics (file count, processing time)</li>
            <li>Error events for debugging</li>
          </ul>
        </Section>

        <Section title="Information We Do NOT Collect">
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
            <li>Personal identification information (name, email, address)</li>
            <li>Account credentials (no accounts exist)</li>
            <li>Uploaded images or their metadata</li>
            <li>IP addresses (anonymized only)</li>
            <li>Cookies for tracking purposes</li>
          </ul>
        </Section>

        <Section title="Payment Data">
          All payments are processed via USDT (TRC-20) cryptocurrency. We only record the transaction ID
          (TxID) to verify payment. No banking details, credit card numbers, or personal financial
          information is collected or stored by us.
        </Section>

        <Section title="Local Storage">
          We use localStorage in your browser to store:
          <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-400">
            <li>Usage counters for rate limiting</li>
            <li>Pipeline drafts for auto-save functionality</li>
            <li>Theme preferences</li>
            <li>License activation status</li>
          </ul>
          <p className="mt-2">This data stays in your browser and is never sent to our servers.</p>
        </Section>

        <Section title="Third-Party Services">
          <p className="mb-2">We use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
            <li><strong>Vercel</strong> — hosting and analytics. See Vercel's privacy policy for details.</li>
            <li><strong>TronScan API</strong> — USDT transaction verification. Only TxID is submitted.</li>
            <li><strong>GitHub</strong> — open-source repository hosting.</li>
          </ul>
        </Section>

        <Section title="Data Retention">
          Since we do not collect personal data or images, there is nothing to retain. Usage analytics
          are stored in aggregated, anonymized form and retained indefinitely for trend analysis.
        </Section>

        <Section title="Your Rights">
          Depending on your jurisdiction (e.g., GDPR, CCPA), you may have the right to:
          <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-400">
            <li>Request information about data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
          </ul>
          <p className="mt-2">To exercise these rights, contact us at vimarkart@gmail.com.</p>
        </Section>

        <Section title="GDPR Compliance">
          As a service available to EU users, we comply with the General Data Protection Regulation (GDPR).
          Our processing is based on legitimate interests (service improvement) and consent (analytics).
          All data processing is limited to what is strictly necessary for the service to function.
        </Section>

        <Section title="CCPA Compliance">
          California residents have the right to know what personal information is collected and to request
          deletion. We collect no personal information under CCPA definitions.
        </Section>

        <Section title="Children's Privacy">
          Our service is not directed at children under 13. We do not knowingly collect any information
          from children.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. Changes are effective immediately upon
          posting. We encourage you to review this page periodically.
        </Section>

        <Section title="Contact">
          If you have any questions about this Privacy Policy, please contact:<br />
          <strong>Maxim Mitenkov</strong><br />
          Email: <a href="mailto:vimarkart@gmail.com" className="text-amber-400 hover:underline">vimarkart@gmail.com</a><br />
          GitHub: <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">github.com/v944/image-pipeline</a>
        </Section>
      </main>

      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <span>Image Pipeline &mdash; Open source batch image processing</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">GitHub</a>
            <button onClick={() => navigate("/faq")} className="hover:text-gray-300 transition-colors">FAQ</button>
            <button onClick={() => navigate("/")} className="hover:text-gray-300 transition-colors">Home</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-gray-200">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  );
}
