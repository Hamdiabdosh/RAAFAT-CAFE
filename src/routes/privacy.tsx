import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — CaféOS" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link to="/" className="text-sm text-gold hover:underline">← Back to CaféOS</Link>
          <h1 className="mt-6 font-display text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2025</p>
        </div>

        {[
          {
            title: "1. What we collect",
            body: "We collect your name, email address, café name, and the menu content you create. We also collect usage logs for security and debugging purposes.",
          },
          {
            title: "2. How we use it",
            body: "Your data is used to operate the CaféOS platform — to show your menu to customers, process orders, and send you account emails (verification, password reset). We do not sell your data.",
          },
          {
            title: "3. Customer data",
            body: "When your customers place orders through CaféOS, we collect their order details and optional table/note information. This data is visible to you in your dashboard and is used solely to fulfil orders.",
          },
          {
            title: "4. Data storage",
            body: "Your data is stored on secure servers. Menu images are stored on Cloudflare R2. We take reasonable precautions to protect your data but cannot guarantee absolute security.",
          },
          {
            title: "5. Cookies",
            body: "We use a single authentication token stored in your browser's local storage to keep you logged in. We do not use advertising or tracking cookies.",
          },
          {
            title: "6. Third parties",
            body: "We use Cloudflare for infrastructure and content delivery. We do not share your personal data with any other third parties.",
          },
          {
            title: "7. Your rights",
            body: "You can request deletion of your account and associated data at any time by emailing raafatdigital@gmail.com. We will process deletion requests within 7 days.",
          },
          {
            title: "8. Contact",
            body: "For privacy questions, email raafatdigital@gmail.com.",
          },
        ].map((section) => (
          <div key={section.title}>
            <h2 className="font-semibold text-lg">{section.title}</h2>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
