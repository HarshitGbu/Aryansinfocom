import { ContactForm } from "@/components/contact/contact-form";
import { BookingSection } from "@/components/contact/booking-section";
import { siteConfig } from "@/content/site";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Contact",
  description:
    "Talk to Aryans Infocom about a custom web app, ERP system, AI or RAG tool, or office network. Book a call or send a message — we reply in one business day.",
  path: "/contact",
});

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <h1 className="text-4xl font-semibold">Contact</h1>
      <div className="flat-card mt-6 rounded-[20px] p-6">
        <h2 className="font-medium">Get in touch</h2>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          <li>
            <a href={`mailto:${siteConfig.email}`} className="hover:text-text">{siteConfig.email}</a>
          </li>
          <li>
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="hover:text-text">{siteConfig.phone}</a>
          </li>
        </ul>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <BookingSection />
        <div id="contact-form">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
