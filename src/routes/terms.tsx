import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — CaféOS" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link to="/" className="text-sm text-gold hover:underline">← Back to CaféOS</Link>
          <h1 className="mt-6 font-display text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2025</p>
        </div>

        {[
          {
            title: "1. Service",
            body: "CaféOS provides a digital menu and order management platform for independent café owners. By creating an account you agree to these terms.",
          },
          {
            title: "2. Account",
            body: "You are responsible for keeping your login credentials secure. One account per café location. You must provide accurate information during registration.",
          },
          {
            title: "3. Subscription & payment",
            body: "CaféOS operates on a manual billing model. After selecting a plan, you will be given payment instructions. Your account will be activated once payment is confirmed. Subscriptions are non-refundable once activated.",
          },
          {
            title: "4. Acceptable use",
            body: "You may not use CaféOS for any unlawful purpose. You may not attempt to access other users' accounts or reverse-engineer the platform.",
          },
          {
            title: "5. Content",
            body: "You own the content you upload (menu items, photos, café details). You grant CaféOS a license to display this content to your customers through the platform.",
          },
          {
            title: "6. Service availability",
            body: "We aim for high availability but do not guarantee uninterrupted service. We may perform maintenance with or without notice.",
          },
          {
            title: "7. Termination",
            body: "We may suspend or terminate accounts that violate these terms. You may cancel your subscription at any time by contacting us at raafatdigital@gmail.com.",
          },
          {
            title: "8. Limitation of liability",
            body: "CaféOS is provided as-is. We are not liable for lost revenue or data resulting from service interruptions.",
          },
          {
            title: "9. Contact",
            body: "For questions about these terms, email raafatdigital@gmail.com.",
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
