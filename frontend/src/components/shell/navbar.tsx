"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Command, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/content/site";
import { usePaletteStore } from "@/lib/stores/palette-store";
import { Kbd } from "@/components/ui/kbd";

const links = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/ai-lab", label: "AI Lab" },
  { href: "/estimator", label: "Estimator" },
  { href: "/about", label: "About" },
];

export function Navbar(): React.JSX.Element {
  const pathname = usePathname();
  const openPalette = usePaletteStore((s) => s.setOpen);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
    const onScroll = (): void => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      wasOpen.current = true;
      dialogRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  function onDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === "Escape") {
      e.preventDefault();
      setMobileOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !dialog.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <header className="fixed left-1/2 top-4 z-40 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2">
        <nav
          aria-label="Primary"
          className={cn(
            "flex items-center justify-between gap-2 rounded-full border px-4 py-2 transition-all duration-300",
            scrolled ? "liquid-glass py-2" : "border-white/10 bg-transparent py-3",
          )}
        >
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-white" />
            {siteConfig.name}
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-3 py-1.5 text-sm text-text-muted transition hover:text-text",
                    active && "text-text",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-white/10"
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => openPalette(true)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-text-muted hover:bg-white/[0.08]"
            >
              <Command size={12} aria-hidden />
              Search
              <Kbd>{isMac ? "⌘ K" : "Ctrl K"}</Kbd>
            </button>
            <Link
              href="/contact#book"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200 active:scale-95"
            >
              Book Discovery Call
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              aria-label="Search"
              onClick={() => openPalette(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10"
            >
              <Command size={16} aria-hidden />
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div
          ref={dialogRef}
          id="mobile-menu"
          tabIndex={-1}
          onKeyDown={onDialogKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-void/95 backdrop-blur-xl focus:outline-none md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between px-5 py-5">
            <span className="text-sm font-semibold">{siteConfig.name}</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 px-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-[12px] px-4 py-4 text-2xl font-medium",
                  l.href === "/estimator" ? "bg-white/10" : "hover:bg-white/5",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="p-5">
            <Link
              href="/contact#book"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[52px] items-center justify-center rounded-[12px] bg-white text-sm font-semibold text-black"
            >
              Book Discovery Call
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
