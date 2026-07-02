import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function TermsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0D0D14] text-gray-100">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt={t("common.appName")} className="w-8 h-8" />
            <span className="font-bold text-base">{t("common.appName")}</span>
          </button>
          <a
            href="https://github.com/v944/image-pipeline"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t("common.github")} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> {t("common.backToHome")}
        </button>

        <h1 className="text-3xl font-bold mb-8">{t("terms.title")}</h1>
        <p className="text-sm text-gray-500 mb-8">{t("terms.lastUpdated")}</p>

        <Section title="Acceptance of Terms">
          By accessing or using Image Pipeline ("the Service"), you agree to be bound by these Terms of
          Service. If you do not agree, do not use the Service.
        </Section>

        <Section title="Service Description">
          Image Pipeline is a browser-based batch image processing tool. It allows users to build visual
          processing pipelines using a node-based editor. All processing occurs client-side; no images are
          uploaded to any server.
        </Section>

        <Section title="License">
          The source code is available under an open-source license on GitHub. This does not grant you the
          right to use the Service in a manner that violates these terms or applicable law.
        </Section>

        <Section title="User Responsibilities">
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
            <li>You are solely responsible for the images you process using the Service</li>
            <li>You must not use the Service to process illegal or harmful content</li>
            <li>You must not attempt to reverse-engineer, abuse, or disrupt the Service</li>
            <li>You must comply with all applicable laws and regulations</li>
          </ul>
        </Section>

        <Section title="Free Tier">
          The free tier is provided at no cost with the following limitations:
          <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-400">
            <li>Maximum 10 files per batch</li>
            <li>Maximum 4 nodes per pipeline</li>
            <li>Maximum 10 processing batches per day</li>
            <li>Usage resets daily</li>
          </ul>
        </Section>

        <Section title="Paid Plans">
          <p className="mb-2">Paid plans unlock additional features and remove free-tier limitations:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
            <li><strong>Pro ($10 USDT one-time):</strong> Unlimited files, unlimited nodes, unlimited processing</li>
            <li><strong>Lifetime ($30 USDT one-time):</strong> Same as Pro, never expires</li>
          </ul>
          <p className="mt-2">All payments are processed via USDT (TRC-20) cryptocurrency. Payments are final and
          non-refundable except as required by applicable law.</p>
        </Section>

        <Section title="Payment Verification">
          After sending payment to the provided wallet address, you must submit the transaction ID (TxID)
          for verification. Verification is performed via the TronScan API. Activation is automatic upon
          successful verification. In rare cases where verification fails due to TronScan unavailability,
          we will manually verify upon email request.
        </Section>

        <Section title="Intellectual Property">
          The Service, including its UI, design, and brand name "Image Pipeline", is owned by Maxim Mitenkov.
          The underlying open-source code is licensed separately. You may not use our branding without
          prior written permission.
        </Section>

        <Section title="Limitation of Liability">
          The Service is provided "as is" without warranties of any kind, either express or implied. We are
          not liable for any damages arising from the use or inability to use the Service. In no event shall
          our liability exceed the amount paid by you for the Service.
        </Section>

        <Section title="No Guarantee of Availability">
          We strive to maintain high availability but do not guarantee uninterrupted access. The Service may
          be temporarily unavailable for maintenance, updates, or due to factors beyond our control.
        </Section>

        <Section title="Prohibited Uses">
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
            <li>Processing illegal, harmful, or abusive content</li>
            <li>Attempting to bypass rate limits or payment requirements</li>
            <li>Using automated tools to abuse the Service</li>
            <li>Distributing malware or malicious files through the Service</li>
          </ul>
        </Section>

        <Section title="Termination">
          We reserve the right to suspend or terminate access to the Service at our discretion, without
          notice, for violations of these terms. Paid users will not be entitled to refunds in case of
          termination for cause.
        </Section>

        <Section title="Changes to Terms">
          We may modify these terms at any time. Continued use of the Service after changes constitutes
          acceptance of the new terms. Material changes will be communicated via the website.
        </Section>

        <Section title="Governing Law">
          These terms are governed by the laws of the United Kingdom. Any disputes shall be resolved in
          the courts of the United Kingdom.
        </Section>

        <Section title="Contact">
          For questions about these terms, contact:<br />
          <strong>Maxim Mitenkov</strong><br />
          Email: <a href="mailto:vimarkart@gmail.com" className="text-amber-400 hover:underline">vimarkart@gmail.com</a><br />
          GitHub: <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">github.com/v944/image-pipeline</a>
        </Section>
      </main>

      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <span>{t("common.appName")} &mdash; Open source batch image processing</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">{t("common.github")}</a>
            <button onClick={() => navigate("/faq")} className="hover:text-gray-300 transition-colors">{t("common.faq")}</button>
            <button onClick={() => navigate("/")} className="hover:text-gray-300 transition-colors">{t("common.home")}</button>
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
