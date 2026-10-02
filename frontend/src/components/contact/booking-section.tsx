"use client";

import dynamic from "next/dynamic";
import { siteConfig } from "@/content/site";

const CalEmbed = dynamic(() => import("@/components/contact/booking-embed").then((m) => m.BookingEmbed), {
  ssr: false,
  loading: () => <p className="text-sm text-text-muted">Loading booking…</p>,
});

export function BookingSection(): React.JSX.Element {
  if (!siteConfig.calLink) {
    return (
      <div className="flat-card rounded-[20px] p-6" id="book">
        <h2 className="font-medium">Booking</h2>
        <p className="mt-2 text-sm text-text-muted">
          Online booking isn&apos;t set up yet. Send a message and we&apos;ll reply with times.
        </p>
        <a href="#contact-form" className="mt-4 inline-block rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Go to message form
        </a>
      </div>
    );
  }
  return (
    <div className="flat-card rounded-[20px] p-6" id="book">
      <CalEmbed />
    </div>
  );
}
