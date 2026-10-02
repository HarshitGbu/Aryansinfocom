"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitContact } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { siteConfig } from "@/content/site";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(255).optional(),
  topic: z.enum(["software", "erp", "ai", "infrastructure", "other"]).optional(),
  message: z.string().min(10).max(2000),
  consent: z.literal(true),
  website: z.string().optional(),
});

type Fields = z.infer<typeof schema>;

export function ContactForm(): React.JSX.Element {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Fields): Promise<void> {
    setServerError(null);
    try {
      await submitContact({
        name: values.name,
        email: values.email,
        company: values.company || undefined,
        topic: values.topic,
        message: values.message,
        consent: true,
        website: values.website || undefined,
      });
      setSent(true);
    } catch (e) {
      const err = e as ApiError;
      if (err.code === "rate_limited") {
        setServerError(`Too many messages from this connection. Try again in ${Math.ceil((err.retryAfterSeconds ?? 600) / 60)} minutes.`);
      } else {
        setServerError("Couldn't send. Check your connection and try again.");
      }
    }
  }

  if (sent) {
    return (
      <div className="flat-card rounded-[20px] p-6 text-center">
        <p>Message sent. We&apos;ll reply within {siteConfig.responseTime}.</p>
        <button
          onClick={() => {
            reset();
            setSent(false);
          }}
          className="mt-4 rounded-[12px] border border-white/15 px-4 py-2 text-sm"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flat-card space-y-4 rounded-[20px] p-6">
      <div>
        <label htmlFor="cf-name" className="text-sm">Name*</label>
        <input id="cf-name" {...register("name")} aria-invalid={!!errors.name} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
        {errors.name && <p className="mt-1 text-xs text-rose">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="cf-email" className="text-sm">Email*</label>
        <input id="cf-email" type="email" {...register("email")} aria-invalid={!!errors.email} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
        {errors.email && <p className="mt-1 text-xs text-rose">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="cf-company" className="text-sm">Company</label>
        <input id="cf-company" {...register("company")} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
      </div>
      <div>
        <label htmlFor="cf-topic" className="text-sm">Topic</label>
        <select id="cf-topic" {...register("topic")} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5">
          <option value="">Select…</option>
          <option value="software">Software</option>
          <option value="erp">ERP</option>
          <option value="ai">AI</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="cf-message" className="text-sm">Message*</label>
        <textarea id="cf-message" {...register("message")} rows={4} aria-invalid={!!errors.message} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
        {errors.message && <p className="mt-1 text-xs text-rose">{errors.message.message}</p>}
      </div>
      <input type="text" {...register("website")} tabIndex={-1} autoComplete="off" aria-hidden className="absolute h-px w-px overflow-hidden opacity-0" />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" {...register("consent")} className="mt-1 h-5 w-5" />
        I agree to be contacted about this message.
      </label>
      {errors.consent && <p className="text-xs text-rose">Consent is required.</p>}
      {serverError && <p role="alert" className="text-sm text-rose">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full rounded-[12px] bg-white py-3 text-sm font-semibold text-black disabled:opacity-50">
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
