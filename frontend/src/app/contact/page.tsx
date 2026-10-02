import { ContactForm } from "@/components/contact/contact-form";
import { BookingSection } from "@/components/contact/booking-section";
import { siteConfig } from "@/content/site";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({ title: "Contact", description: "Book a call or send a message.", path: "/contact" });

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <h1 className="text-4xl font-semibold">Contact</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <BookingSection />
        <div id="contact-form">
          <ContactForm />
        </div>
      </div>
      <div className="flat-card mt-6 rounded-[20px] p-6">
        <h2 className="font-medium">Location</h2>
        <p className="mt-2 text-sm text-text-muted">{siteConfig.address}</p>
        <p className="text-sm text-text-muted">{siteConfig.hours}</p>
        <div aria-hidden className="grid-backdrop mt-4 h-32 rounded-[12px] border border-white/10" />
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(siteConfig.address)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-cyan hover:underline"
        >
          Open in Maps
        </a>
      </div>
    </main>
  );
}
