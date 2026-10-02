// PLACEHOLDER — replace with real company details before launch.
export const siteConfig = {
  // PLACEHOLDER: company name not provided
  name: "Company Name",
  // PLACEHOLDER
  email: "hello@example.com",
  // PLACEHOLDER
  phone: "+1 (555) 000-0000",
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
