"use client";

import { useQuery } from "@tanstack/react-query";
import { calculateEstimate } from "@/lib/api/endpoints";
import { useEstimatorStore } from "@/lib/stores/estimator-store";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { formatRange, formatWeeks } from "@/lib/format";
import type { EstimateRequest } from "@/lib/api/types";

export function LiveSummary(): React.JSX.Element {
  const { services, office, software } = useEstimatorStore();
  const payload: EstimateRequest = {
    selected_services: services,
    office_parameters: {
      workstations: office.workstations,
      floor_area_sqft: office.floor_area_sqft,
      require_server_rack: office.require_server_rack,
      air_gapped_security: office.air_gapped_security,
    },
    software_parameters: {
      user_roles_count: software.user_roles_count,
      third_party_integrations: software.third_party_integrations,
    },
  };
  const debounced = useDebouncedValue(JSON.stringify(payload), 400);

  const q = useQuery({
    queryKey: ["estimate", debounced],
    queryFn: () => calculateEstimate(JSON.parse(debounced) as EstimateRequest),
    enabled: services.length > 0,
    placeholderData: (prev) => prev,
    retry: false,
  });

  return (
    <aside aria-label="Live estimate" className="liquid-glass rounded-[20px] p-6 lg:sticky lg:top-24">
      <h2 className="font-mono text-xs uppercase tracking-wider text-text-faint">Planning estimate</h2>
      {services.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">Select a service to see a range.</p>
      ) : q.isPending && !q.data ? (
        <p className="mt-3 font-mono text-xl">…</p>
      ) : q.isError ? (
        <div className="mt-3">
          <p className="text-sm">Couldn&apos;t update the estimate.</p>
          <button onClick={() => void q.refetch()} className="mt-2 text-sm text-cyan">Retry</button>
        </div>
      ) : q.data ? (
        <div className="mt-3">
          <p className="font-mono text-3xl">{formatRange(q.data.cost_range_usd)}</p>
          <p className="mt-1 font-mono text-sm text-text-muted">{formatWeeks(q.data.timeline_weeks)}</p>
          <ul className="mt-4 space-y-1 text-xs text-text-muted">
            {q.data.breakdown.software_development && (
              <li>Software {formatRange(q.data.breakdown.software_development)}</li>
            )}
            {q.data.breakdown.hardware_and_networking && (
              <li>Hardware {formatRange(q.data.breakdown.hardware_and_networking)}</li>
            )}
            {q.data.breakdown.on_prem_ai_setup && (
              <li>On-prem AI {formatRange(q.data.breakdown.on_prem_ai_setup)}</li>
            )}
          </ul>
        </div>
      ) : null}
      <p className="mt-4 text-xs text-text-faint">Planning estimate, not a quote.</p>
    </aside>
  );
}
