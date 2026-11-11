import { Wizard } from "@/components/estimator/wizard";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Estimator",
  description:
    "Get a planning range for your custom web app, ERP, AI, or office networking project in under a minute. No signup needed — see indicative cost and timeline.",
  path: "/estimator",
});

export default function EstimatorPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <h1 className="text-4xl font-semibold">Project estimator</h1>
      <div className="mt-8">
        <Wizard />
      </div>
    </main>
  );
}
