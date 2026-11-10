"use client";

import { useState } from "react";
import { siteConfig } from "@/content/site";
import { submitToWeb3Forms } from "@/lib/web3forms";

interface Fields {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
  consent: boolean;
  website: string;
}

const initial: Fields = {
  name: "",
  email: "",
  company: "",
  topic: "",
  message: "",
  consent: false,
  website: "",
};

export function ContactForm(): React.JSX.Element {
  const [values, setValues] = useState<Fields>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function set<K extends keyof Fields>(key: K, value: Fields[K]): void {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof Fields, string>> = {};
    if (values.name.trim().length < 2) e.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "Enter a valid email address.";
    if (values.message.trim().length < 10) e.message = "Tell us a bit more (at least 10 characters).";
    if (!values.consent) e.consent = "Consent is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>): Promise<void> {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSending(true);
    try {
      await submitToWeb3Forms(`New contact form message from ${values.name}`, {
        name: values.name,
        email: values.email,
        company: values.company || "",
        topic: values.topic || "",
        message: values.message,
        consent: values.consent,
        // Honeypot: hidden field, should stay empty for real humans.
        website: values.website || "",
      });
      setSent(true);
    } catch {
      setServerError("Couldn't send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flat-card rounded-[20px] p-6 text-center">
        <p>Message sent. We&apos;ll reply within {siteConfig.responseTime}.</p>
        <button
          onClick={() => {
            setValues(initial);
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
    <form onSubmit={onSubmit} noValidate className="flat-card space-y-4 rounded-[20px] p-6">
      <div>
        <label htmlFor="cf-name" className="text-sm">Name*</label>
        <input id="cf-name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
        {errors.name && <p className="mt-1 text-xs text-rose">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="cf-email" className="text-sm">Email*</label>
        <input id="cf-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
        {errors.email && <p className="mt-1 text-xs text-rose">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="cf-company" className="text-sm">Company</label>
        <input id="cf-company" value={values.company} onChange={(e) => set("company", e.target.value)} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
      </div>
      <div>
        <label htmlFor="cf-topic" className="text-sm">Topic</label>
        <select id="cf-topic" value={values.topic} onChange={(e) => set("topic", e.target.value)} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5">
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
        <textarea id="cf-message" value={values.message} onChange={(e) => set("message", e.target.value)} rows={4} aria-invalid={!!errors.message} className="mt-1 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2.5" />
        {errors.message && <p className="mt-1 text-xs text-rose">{errors.message}</p>}
      </div>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={values.website}
        onChange={(e) => set("website", e.target.value)}
        className="absolute h-px w-px overflow-hidden opacity-0"
      />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={values.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-5 w-5" />
        I agree to be contacted about this message.
      </label>
      {errors.consent && <p className="text-xs text-rose">Consent is required.</p>}
      {serverError && <p role="alert" className="text-sm text-rose">{serverError}</p>}
      <button type="submit" disabled={sending} className="w-full rounded-[12px] bg-white py-3 text-sm font-semibold text-black disabled:opacity-50">
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
