import { LabTabs } from "@/components/ai-lab/lab-tabs";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "AI Lab",
  description: "Try the same building blocks we use in client projects.",
  path: "/ai-lab",
});

export default function AiLabPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <h1 className="text-4xl font-semibold">AI Lab</h1>
      <p className="mt-3 max-w-[65ch] text-text-muted">Try the same building blocks we use in client projects.</p>
      <div className="mt-8">
        <LabTabs />
      </div>
    </main>
  );
}
