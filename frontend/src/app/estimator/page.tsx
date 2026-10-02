import { Wizard } from "@/components/estimator/wizard";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Estimator",
  description: "Estimate your project in a minute.",
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
