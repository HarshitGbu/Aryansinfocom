// PLACEHOLDER — replace contact details before launch. Company name set to "Aryans Infocom".
export const siteConfig = {
  name: "Aryans Infocom",
  // PLACEHOLDER
  email: "hello@example.com",
  phone: "+91 9910777822",
  // PLACEHOLDER
  address: "123 Market Street, Suite 100, San Francisco, CA 94103",
  // PLACEHOLDER
  hours: "Mon–Fri, 9:00–18:00",
  // PLACEHOLDER: average reply time
  responseTime: "one business day",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  calLink: process.env.NEXT_PUBLIC_CAL_LINK ?? "",
  social: [] as Array<{ label: string; href: string }>,
};
