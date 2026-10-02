"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEstimatorStore, needsOffice, needsSoftware } from "@/lib/stores/estimator-store";
import type { EstimatorService } from "@/lib/api/types";
import { estimatorServiceMeta } from "@/content/pillars";
import { LiveSummary } from "@/components/estimator/live-summary";
import { submitEstimate } from "@/lib/api/endpoints";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const allServices = Object.keys(estimatorServiceMeta) as EstimatorService[];
const integrations = ["stripe", "salesforce", "hubspot", "quickbooks", "slack", "shopify"];

function WizardInner(): React.JSX.Element {
  const params = useSearchParams();
  const store = useEstimatorStore();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const pre = params.get("services");
    if (pre) {
      const list = pre.split(",").filter((s) => s in estimatorServiceMeta) as EstimatorService[];
      if (list.length > 0) store.setServices(list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { step, services } = store;
  const showOffice = needsOffice(services);
  const showSoftware = needsSoftware(services);

  function next(): void {
    setError(null);
    let n = step + 1;
    if (n === 2 && !showOffice) n = 3;
    if (n === 3 && !showSoftware) n = 4;
    store.setStep(Math.min(n, 6));
  }
  function back(): void {
    let n = step - 1;
    if (n === 3 && !showSoftware) n = 2;
    if (n === 2 && !showOffice) n = 1;
    store.setStep(Math.max(n, 1));
  }

  async function send(): Promise<void> {
    setSending(true);
    setError(null);
    try {
      const res = await submitEstimate({
        client_name: store.contact.client_name,
        client_email: store.contact.client_email,
        company_name: store.contact.company_name || undefined,
        phone_number: store.contact.phone_number || undefined,
        notes: store.contact.notes || undefined,
        estimate_input: {
          selected_services: services,
          office_parameters: { ...store.office },
          software_parameters: { ...store.software },
        },
        consent: true,
        website: store.contact.website || undefined,
      });
      store.setResult(res.estimate);
      store.setLead(res.lead_id, res.booking_url);
      store.setStep(6);
      try {
        sessionStorage.removeItem("estimator:v1");
      } catch {
        /* ignore */
      }
    } catch (e) {
      const err = e as { code?: string; retryAfterSeconds?: number; message?: string };
      if (err.code === "rate_limited") {
        setError(`Too many requests. Try again in ${Math.ceil((err.retryAfterSeconds ?? 600) / 60)} minutes.`);
      } else {
        setError("Couldn't send your estimate. Your details are saved. Try again.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        aria-live="polite"
      >
        <ol className="mb-8 flex gap-2" aria-label="Progress">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <li key={s} className={cn("h-1.5 flex-1 rounded-full", s <= step ? "bg-white" : "bg-white/10")} />
          ))}
        </ol>

        {step === 1 && (
          <section aria-labelledby="s1">
            <h2 id="s1" tabIndex={-1} className="text-2xl font-semibold">What do you need?</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {allServices.map((s) => (
                <button
                  key={s}
                  onClick={() => store.setServices(services.includes(s) ? services.filter((x) => x !== s) : [...services, s])}
                  aria-pressed={services.includes(s)}
                  className={cn(
                    "rounded-[20px] border p-5 text-left min-h-[88px]",
                    services.includes(s) ? "border-white bg-white/10" : "flat-card",
                  )}
                >
                  <span className="font-medium">{estimatorServiceMeta[s]?.label}</span>
                </button>
              ))}
            </div>
            {services.length === 0 && <p className="mt-3 text-sm text-text-faint">Select at least one service to continue.</p>}
          </section>
        )}

        {step === 2 && showOffice && (
          <section aria-labelledby="s2">
            <h2 id="s2" tabIndex={-1} className="text-2xl font-semibold">Office and hardware</h2>
            <label className="mt-6 block text-sm">
              Workstations: {store.office.workstations}
              <input
                type="range" min={1} max={200} value={store.office.workstations}
                onChange={(e) => store.setOffice({ workstations: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <label className="mt-6 block text-sm">
              Floor area (sqft): {store.office.floor_area_sqft}
              <input
                type="range" min={200} max={20000} step={100} value={store.office.floor_area_sqft}
                onChange={(e) => store.setOffice({ floor_area_sqft: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <label className="mt-6 flex items-center gap-3 text-sm">
              <input
                type="checkbox" checked={store.office.require_server_rack}
                onChange={(e) => store.setOffice({ require_server_rack: e.target.checked })}
                className="h-5 w-5"
              />
              Server rack
            </label>
            {services.includes("local_ai_server") && (
              <label className="mt-4 flex items-start gap-3 text-sm">
                <input
                  type="checkbox" checked={store.office.air_gapped_security}
                  onChange={(e) => store.setOffice({ air_gapped_security: e.target.checked })}
                  className="mt-1 h-5 w-5"
                />
                <span>Air-gapped security <span className="block text-xs text-text-faint">Isolated VLAN 30 with no outbound route.</span></span>
              </label>
            )}
          </section>
        )}

        {step === 3 && showSoftware && (
          <section aria-labelledby="s3">
            <h2 id="s3" tabIndex={-1} className="text-2xl font-semibold">Software scope</h2>
            <label className="mt-6 block text-sm">
              User roles: {store.software.user_roles_count}
              <input
                type="range" min={1} max={20} value={store.software.user_roles_count}
                onChange={(e) => store.setSoftware({ user_roles_count: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <p className="mt-6 text-sm">Integrations</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {integrations.map((i) => (
                <button
                  key={i}
                  onClick={() =>
                    store.setSoftware({
                      third_party_integrations: store.software.third_party_integrations.includes(i)
                        ? store.software.third_party_integrations.filter((x) => x !== i)
                        : [...store.software.third_party_integrations, i],
                    })
                  }
                  aria-pressed={store.software.third_party_integrations.includes(i)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm capitalize",
                    store.software.third_party_integrations.includes(i) ? "bg-white/10 border-white" : "border-white/10",
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby="s4">
            <h2 id="s4" tabIndex={-1} className="text-2xl font-semibold">Review</h2>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              <li>Services: {services.join(", ") || "—"}</li>
              {showOffice && <li>Workstations: {store.office.workstations}, {store.office.floor_area_sqft} sqft</li>}
              {showSoftware && <li>Roles: {store.software.user_roles_count}, integrations: {store.software.third_party_integrations.join(", ") || "none"}</li>}
            </ul>
            <p className="mt-4 text-xs text-text-faint">Planning estimate, not a quote.</p>
          </section>
        )}

        {step === 5 && (
          <section aria-labelledby="s5">
            <h2 id="s5" tabIndex={-1} className="text-2xl font-semibold">Your details</h2>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">Name*
                <input value={store.contact.client_name} onChange={(e) => store.setContact({ client_name: e.target.value })}
                  className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
              </label>
              <label className="block text-sm">Email*
                <input type="email" value={store.contact.client_email} onChange={(e) => store.setContact({ client_email: e.target.value })}
                  className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
              </label>
              <label className="block text-sm">Company
                <input value={store.contact.company_name} onChange={(e) => store.setContact({ company_name: e.target.value })}
                  className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
              </label>
              <label className="block text-sm">Notes
                <textarea value={store.contact.notes} onChange={(e) => store.setContact({ notes: e.target.value })} maxLength={2000}
                  className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" rows={3} />
              </label>
              <input
                type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
                value={store.contact.website} onChange={(e) => store.setContact({ website: e.target.value })}
                className="absolute h-px w-px overflow-hidden opacity-0"
              />
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={store.contact.consent} onChange={(e) => store.setContact({ consent: e.target.checked })} className="mt-1 h-5 w-5" />
                I agree to be contacted about this estimate.
              </label>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
          </section>
        )}

        {step === 6 && (
          <section aria-labelledby="s6">
            <h2 id="s6" tabIndex={-1} className="text-2xl font-semibold">Estimate sent.</h2>
            <p className="mt-3 text-text-muted">Book a call to confirm scope.</p>
            <div className="mt-6 flex gap-3">
              <Link
                href={store.bookingUrl ?? "/contact#book"}
                className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black"
              >
                Book Discovery Call
              </Link>
              <button onClick={() => { store.reset(); store.setStep(1); }} className="rounded-[12px] border border-white/15 px-5 py-2.5 text-sm">
                Start a new estimate
              </button>
            </div>
          </section>
        )}

        {step < 6 && (
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button onClick={back} className="rounded-[12px] border border-white/15 px-5 py-2.5 text-sm">
                Back
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={next}
                disabled={step === 1 && services.length === 0}
                className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => void send()}
                disabled={sending || !store.contact.client_name || !store.contact.client_email || !store.contact.consent}
                className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send estimate"}
              </button>
            )}
          </div>
        )}
      </motion.div>
      <div className="max-lg:fixed max-lg:inset-x-4 max-lg:bottom-4 max-lg:z-30">
        <LiveSummary />
      </div>
    </div>
  );
}

export function Wizard(): React.JSX.Element {
  return (
    <Suspense>
      <WizardInner />
    </Suspense>
  );
}
