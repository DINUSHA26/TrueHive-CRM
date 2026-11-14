import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-8">Last updated: November 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Overview</h2>
            <p>
              This Privacy Policy explains how Fashion Dora / TrueHive (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, and protects customer information received through our official WhatsApp Business messaging platform, retail POS, and customer support channels.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Information We Collect</h2>
            <p>
              When you message our official WhatsApp Business account, we may process:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
              <li>Your WhatsApp phone number and profile name.</li>
              <li>Messages, inquiries, and orders you send to our business.</li>
              <li>Delivery details (e.g., recipient name, shipping address) provided by you during order placement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <p>
              We use your information solely to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
              <li>Respond to your customer inquiries and product questions in real-time.</li>
              <li>Process and fulfill your orders, generate invoices, and send order status updates.</li>
              <li>Provide dedicated customer support and after-sales assistance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Data Protection & Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal data to any third parties. Data is processed securely through Meta WhatsApp Cloud API and encrypted databases adhering to industry standard security protocols.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy or wish to request data deletion, you can reach out directly via our official WhatsApp Business contact or email our support desk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

