import { z } from "zod";

export const estimatorServices = [
  "custom_web",
  "erp_custom",
  "ai_solutions",
  "office_networking",
  "local_ai_server",
  "workstation_provisioning",
] as const;

export const estimateRequestSchema = z.object({
  selected_services: z.array(z.enum(estimatorServices)).min(1).max(6),
  office_parameters: z
    .object({
      workstations: z.number().int().min(0).max(500),
      floor_area_sqft: z.number().int().min(0).max(200000),
      require_server_rack: z.boolean(),
      air_gapped_security: z.boolean(),
    })
    .optional(),
  software_parameters: z
    .object({
      user_roles_count: z.number().int().min(0).max(50),
      third_party_integrations: z
        .array(z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/).max(40))
        .max(10),
    })
    .optional(),
});

export const contactSchema = z.object({
  client_name: z.string().min(2).max(120),
  client_email: z.string().email(),
  company_name: z.string().max(255).optional(),
  phone_number: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  consent: z.literal(true),
});

export const contactFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(255).optional(),
  topic: z.enum(["software", "erp", "ai", "infrastructure", "other"]).optional(),
  message: z.string().min(10).max(2000),
  consent: z.literal(true),
});
