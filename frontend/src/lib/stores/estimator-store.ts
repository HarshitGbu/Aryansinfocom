"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EstimatorService, EstimateResult } from "@/lib/api/types";

export interface OfficeParams {
  workstations: number;
  floor_area_sqft: number;
  require_server_rack: boolean;
  air_gapped_security: boolean;
}

export interface SoftwareParams {
  user_roles_count: number;
  third_party_integrations: string[];
}

export interface ContactFields {
  client_name: string;
  client_email: string;
  company_name: string;
  phone_number: string;
  notes: string;
  consent: boolean;
  website: string;
}

interface EstimatorState {
  step: number;
  services: EstimatorService[];
  office: OfficeParams;
  software: SoftwareParams;
  contact: ContactFields;
  result: EstimateResult | null;
  leadId: string | null;
  bookingUrl: string | null;
  setStep: (step: number) => void;
  setServices: (services: EstimatorService[]) => void;
  setOffice: (office: Partial<OfficeParams>) => void;
  setSoftware: (software: Partial<SoftwareParams>) => void;
  setContact: (contact: Partial<ContactFields>) => void;
  setResult: (result: EstimateResult | null) => void;
  setLead: (leadId: string | null, bookingUrl: string | null) => void;
  reset: () => void;
}

const initial = {
  step: 1,
  services: [] as EstimatorService[],
  office: {
    workstations: 10,
    floor_area_sqft: 1500,
    require_server_rack: false,
    air_gapped_security: false,
  },
  software: { user_roles_count: 3, third_party_integrations: [] as string[] },
  contact: {
    client_name: "",
    client_email: "",
    company_name: "",
    phone_number: "",
    notes: "",
    consent: false,
    website: "",
  },
  result: null as EstimateResult | null,
  leadId: null as string | null,
  bookingUrl: null as string | null,
};

export function needsOffice(services: EstimatorService[]): boolean {
  return services.some((s) =>
    ["office_networking", "local_ai_server", "workstation_provisioning"].includes(s),
  );
}

export function needsSoftware(services: EstimatorService[]): boolean {
  return services.some((s) => ["custom_web", "erp_custom", "ai_solutions"].includes(s));
}

export const useEstimatorStore = create<EstimatorState>()(
  persist(
    (set) => ({
      ...initial,
      setStep: (step) => set({ step }),
      setServices: (services) => set({ services }),
      setOffice: (office) => set((s) => ({ office: { ...s.office, ...office } })),
      setSoftware: (software) => set((s) => ({ software: { ...s.software, ...software } })),
      setContact: (contact) => set((s) => ({ contact: { ...s.contact, ...contact } })),
      setResult: (result) => set({ result }),
      setLead: (leadId, bookingUrl) => set({ leadId, bookingUrl }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "estimator:v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : sessionStorage,
      ),
      partialize: (s) => ({
        step: s.step,
        services: s.services,
        office: s.office,
        software: s.software,
        contact: { ...s.contact, website: "" },
        result: s.result,
        leadId: s.leadId,
        bookingUrl: s.bookingUrl,
      }),
    },
  ),
);
