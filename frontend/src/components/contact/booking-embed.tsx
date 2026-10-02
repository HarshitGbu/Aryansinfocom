"use client";

import Cal from "@calcom/embed-react";
import { siteConfig } from "@/content/site";

export function BookingEmbed(): React.JSX.Element {
  return <Cal calLink={siteConfig.calLink} config={{ theme: "dark" }} />;
}
