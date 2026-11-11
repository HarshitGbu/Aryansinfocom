"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Code2, Layers, Phone, Calculator, FlaskConical,
  Home, Info, Mail, Server,
} from "lucide-react";
import { usePaletteStore } from "@/lib/stores/palette-store";
import { search } from "@/lib/api/endpoints";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { siteConfig } from "@/content/site";
import { safeInternalPath } from "@/lib/safe-url";

interface Item {
  id: string;
  label: string;
  hint: string;
  href?: string;
  run?: () => void;
  icon: React.ReactNode;
}

const iconClass = "text-accent";
const NAV: Item[] = [
  { id: "home", label: "Home", hint: "Page", href: "/", icon: <Home size={16} className={iconClass} /> },
  { id: "services", label: "Services", hint: "Page", href: "/services", icon: <Layers size={16} className={iconClass} /> },
  { id: "web", label: "Custom web apps", hint: "Service", href: "/services/web-apps", icon: <Code2 size={16} className={iconClass} /> },
  { id: "erp", label: "Enterprise ERP systems", hint: "Service", href: "/services/erp-systems", icon: <Layers size={16} className={iconClass} /> },
  { id: "ai", label: "AI tools and integration", hint: "Service", href: "/services/ai-solutions", icon: <FlaskConical size={16} className={iconClass} /> },
  { id: "infra", label: "Turnkey office and hardware", hint: "Service", href: "/services/infrastructure", icon: <Server size={16} className={iconClass} /> },
  { id: "work", label: "Case studies", hint: "Page", href: "/work", icon: <Layers size={16} className={iconClass} /> },
  { id: "about", label: "About", hint: "Page", href: "/about", icon: <Info size={16} className={iconClass} /> },
  { id: "contact", label: "Contact", hint: "Page", href: "/contact", icon: <Mail size={16} className={iconClass} /> },
];

export function CommandPalette(): React.JSX.Element | null {
  const router = useRouter();
  const { open, setOpen } = usePaletteStore();
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const dq = useDebouncedValue(q, 200);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      const typing =
        t !== null && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!usePaletteStore.getState().open);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open ]);

  const remote = useQuery({
    queryKey: ["search", dq],
    queryFn: () => search(dq),
    enabled: open && dq.length >= 2,
    staleTime: 30_000,
    retry: false,
  });

  const actions: Item[] = useMemo(
    () => [
      { id: "estimate", label: "Calculate Project Scope", hint: "Action", href: "/estimator", icon: <Calculator size={16} className="text-cyan" /> },
      { id: "book", label: "Book Discovery Call", hint: "Action", href: "/contact#book", icon: <Phone size={16} className="text-emerald" /> },
      {
        id: "copy",
        label: "Copy contact email",
        hint: "Action",
        run: () => void navigator.clipboard?.writeText(siteConfig.email),
        icon: <Mail size={16} className="text-emerald" />,
      },
    ],
    [],
  );

  function go(item: { href?: string; run?: () => void }): void {
    setOpen(false);
    if (item.run) item.run();
    else if (item.href) router.push(safeInternalPath(item.href));
  }

  if (!mounted) return null;

  const row =
    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-white/10";
  const group =
    "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-faint";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search and commands"
      overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
      contentClassName="liquid-glass fixed left-1/2 top-[18vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[28px] text-text"
    >
      <div className="flex items-center border-b border-white/10 px-4 py-3">
        <Search size={18} className="mr-3 shrink-0 text-text-muted" aria-hidden />
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder="Search pages, services, or run an action…"
          className="w-full bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
        />
        <kbd className="rounded border border-white/10 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-text-muted">
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[320px] overflow-y-auto p-2">
        <Command.Empty className="p-4 text-center text-xs text-text-muted">
          No matches. Try “estimate”, “air-gapped”, or “ERP”.
        </Command.Empty>

        {remote.data !== undefined && remote.data.results.length > 0 ? (
          <Command.Group heading="Results" className={group}>
            {remote.data.results.map((r) => (
              <Command.Item
                key={`${r.type}:${r.href}`}
                value={`${r.title} ${r.subtitle ?? ""}`}
                onSelect={() => go({ href: safeInternalPath(r.href) })}
                className={row}
              >
                <Search size={16} className="text-text-muted" aria-hidden />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="text-xs text-text-faint">{r.type.replace("_", " ")}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}

        <Command.Group heading="Actions" className={group}>
          {actions.map((a) => (
            <Command.Item key={a.id} value={a.label} onSelect={() => go(a)} className={row}>
              {a.icon}
              <span className="flex-1">{a.label}</span>
              <span className="text-xs text-text-faint">{a.hint}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Navigate" className={group}>
          {NAV.map((n) => (
            <Command.Item key={n.id} value={n.label} onSelect={() => go(n)} className={row}>
              {n.icon}
              <span className="flex-1">{n.label}</span>
              <span className="text-xs text-text-faint">{n.hint}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>

      <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-xs text-text-faint">
        <span><kbd className="font-mono">↑↓</kbd> navigate</span>
        <span><kbd className="font-mono">↵</kbd> open</span>
        <span><kbd className="font-mono">esc</kbd> close</span>
      </div>
    </Command.Dialog>
  );
}
