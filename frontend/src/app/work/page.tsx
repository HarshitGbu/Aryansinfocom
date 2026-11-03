import { WorkBrowser } from "./work-client";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Work",
  description: "Case studies across web apps, ERP systems, AI tools, and office infrastructure.",
  path: "/work",
});

export default function WorkPage(): React.JSX.Element {
  return <WorkBrowser />;
}
