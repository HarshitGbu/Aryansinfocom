# FRONTEND ENGINEERING PROMPT — Tech Agency Website

> **Target agent:** MiMo v2.6 running in OpenCode (terminal coding agent).
> **Your role:** Sole frontend engineer. You build the complete website described below.
> **Companion document:** `backend_engineering_prompt.md` (another AI builds the API in parallel). You and the backend meet **only** at the API contract in **Appendix A**. Treat it as law.

---

## 0. How to Work (read this first)

This prompt is long. Follow these rules so you never lose your place.

1. **Create `PROGRESS.md` first.** Copy the phase checklist from Section 15 into it. After finishing each phase, tick the boxes and add two lines: what you built, and anything you decided that this prompt didn't specify. If your context is ever reset, re-read this prompt and `PROGRESS.md`, then continue from the first unticked box.
2. **Work in phases, one at a time.** Do not start a phase until the previous phase builds cleanly. After each phase run, in this order: `pnpm typecheck`, `pnpm lint`, `pnpm build`. Fix every error before moving on.
3. **Exact values beat creativity.** Colors, radii, durations, copy, and file names in this prompt are exact. Where the prompt is silent, choose the simplest implementation that meets the acceptance criteria and note it in `PROGRESS.md`.
4. **Do not invent content.** Use the copy deck (Section 11). Anything marked `PLACEHOLDER` goes in `src/content/*.ts` with a visible `// PLACEHOLDER` comment, never hard-coded in components.
5. **No new packages** beyond Section 6 unless a build error forces it. If you add one, write why in `PROGRESS.md`.
6. **TypeScript strict. No `any`.** Use the types from Appendix A (generated from OpenAPI when available; hand-written mirror until then, see Section 10).
7. **Keep files small.** Components under ~200 lines. Split when larger.
8. **Never claim something works without running it.** If you can run the dev server and view pages, do. Check each page at 390px, 768px, and 1440px widths.

---

## 1. Product Context

The client is a high-end agency delivering **custom web apps, enterprise ERPs, bespoke AI tools, AI-integrated software, and turnkey hardware/office networking** (structured cabling, Wi-Fi, local GPU racks, air-gapped compute, workstation setup) from a single team.

**Who visits:** CTOs, operations heads, and founders of small-to-mid companies deciding whether to trust one vendor with both software and physical infrastructure. They are skeptical, time-poor, and technical enough to notice fake polish.

**What the site must do:** make the one-vendor advantage obvious in under ten seconds, prove competence through interactive demos (not claims), and move the visitor to one of two actions: **Calculate Project Scope** or **Book Discovery Call**.

**Company name is not provided.** Use `siteConfig.name` from `src/content/site.ts` (default `"Company Name"`, marked PLACEHOLDER) everywhere. Same for address, email, phone, and the Cal.com link.

---

## 2. Design Direction

A hybrid of three references. Each contributes specific things; do not blend them randomly.

| Reference | What we take | Where it shows up |
| :--- | :--- | :--- |
| **Linear** | Monochrome near-black base, 1px hairline structure, dense compact type, restraint | Page layout, grid lines, tables, navigation, spacing rhythm |
| **Raycast** | `⌘K` launcher as a core feature, mouse-following radial glow on cards, keyboard-first feel, `kbd` hints | Command palette, spotlight cards, bento tiles, buttons with shortcuts |
| **Apple Liquid Glass** | Translucent blurred surfaces, bright specular top edge, soft depth, fluid spring motion | Hero window, navbar, modals, estimator panel, floating elements |

### Principles (these decide every judgment call)

1. **One memorable thing, everything else quiet.** The memorable thing is the hero window (a glass "stack config" panel that plays one short sequence on load) plus the cursor spotlight. Everything else is disciplined and still.
2. **Glass is for floating things, not for everything.** Use glass on elements that sit above content (navbar, hero window, palette, dialogs, the estimator summary panel). Regular cards use a flat surface with a hairline border. At most **3 glass surfaces visible per viewport**.
3. **Structure is information.** A border, divider, or number must mean something. Use numbers only for real sequences (process steps, estimator steps). No decorative `01 / 02 / 03`, no all-caps eyebrow above every heading.
4. **Dark only.** High-contrast dark theme. No light mode, no theme toggle. Set `color-scheme: dark`.
5. **Show the hardware.** The agency's difference is physical + digital. Use rack LEDs, network zones, and stack-layer visuals alongside code visuals. Never make the site look like a pure-software shop.
6. **Plain language.** Buttons say what happens ("Calculate Project Scope"). Errors say what went wrong and how to fix it. Sentence case. No exclamation marks. No "revolutionary", "cutting-edge", "seamless".

---

## 3. Design Tokens (exact)

### 3.1 Color

| Token | Value | Use |
| :--- | :--- | :--- |
| `void` | `#050507` | Page background |
| `surface` | `#0b0b10` | Flat cards, table rows |
| `surface-2` | `#12121a` | Raised flat elements, inputs |
| `hairline` | `rgba(255,255,255,0.08)` | 1px borders on flat elements |
| `grid-line` | `rgba(255,255,255,0.05)` | Background grid |
| `text` | `#f5f5f7` | Primary text |
| `text-muted` | `#a1a1aa` | Secondary text |
| `text-faint` | `#71717a` | Tertiary, captions (do not use for essential info) |
| `accent` | `#6366f1` | Primary accent (indigo) |
| `accent-2` | `#a855f7` | Glow partner (purple) |
| `cyan` | `#22d3ee` | Live/active status, network |
| `emerald` | `#34d399` | Success, OK states |
| `amber` | `#fbbf24` | Warnings |
| `rose` | `#fb7185` | Errors, blocked |

Contrast rule: body text on `void`/`surface` uses `text` or `text-muted` only (both exceed 4.5:1). `text-faint` is allowed only for non-essential captions at ≥14px.

### 3.2 Typography

- **Sans:** Geist (via `geist/font/sans`), tracking `-0.02em` on headings, `-0.01em` on body.
- **Mono:** JetBrains Mono (via `next/font/google`). **Only** for: code blocks, metric numbers, `kbd` hints, status tags, estimator price figures. Do not use mono for headings, buttons, or body copy.
- **Scale** (fluid with `clamp`):

| Role | Size | Weight | Line height |
| :--- | :--- | :--- | :--- |
| Display (hero h1) | `clamp(2.5rem, 6vw, 4.5rem)` | 600 | 1.06 |
| H2 | `clamp(1.75rem, 3.5vw, 2.5rem)` | 600 | 1.15 |
| H3 | `1.25rem` | 600 | 1.3 |
| Body L | `1.125rem` | 400 | 1.6 |
| Body | `1rem` | 400 | 1.6 |
| Small | `0.875rem` | 400 | 1.5 |
| Mono label | `0.75rem` | 500 | 1.4 |

- Max line length for paragraphs: `max-w-[65ch]`.
- Hero headline uses a vertical white gradient (`white → white/40`), as in the blueprint. No other heading gets a gradient. Do not color a single word of a headline.

### 3.3 Radius, spacing, shadows

| Token | Value | Use |
| :--- | :--- | :--- |
| `radius-sm` | `8px` | Inputs, chips, kbd |
| `radius-md` | `12px` | Buttons |
| `radius-lg` | `20px` | Cards |
| `radius-xl` | `28px` | Hero window, palette, dialogs |
| `radius-full` | `9999px` | Badges, navbar pill |

Do **not** apply one radius to everything; use the table by role.
Section vertical padding: `py-24 md:py-32`. Container: `max-w-6xl mx-auto px-5 md:px-8` (hero window and wide diagrams may use `max-w-7xl`).

### 3.4 Motion tokens

- Ease out-expo: `cubic-bezier(0.16, 1, 0.3, 1)` (all CSS transitions and tweens).
- Spring (Framer Motion): `{ type: "spring", stiffness: 300, damping: 30 }`.
- Durations: micro 150ms, standard 300ms, entrance 600ms.

---

## 4. Glass System

### 4.1 `globals.css` (Tailwind v4). Create this file exactly.

```css
@import "tailwindcss";

@theme {
  --color-void: #050507;
  --color-surface: #0b0b10;
  --color-surface-2: #12121a;
  --color-hairline: rgba(255, 255, 255, 0.08);
  --color-text: #f5f5f7;
  --color-text-muted: #a1a1aa;
  --color-text-faint: #71717a;
  --color-accent: #6366f1;
  --color-accent-2: #a855f7;
  --color-cyan: #22d3ee;
  --color-emerald: #34d399;
  --color-amber: #fbbf24;
  --color-rose: #fb7185;
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

:root { color-scheme: dark; }

html { background: var(--color-void); scroll-padding-top: 6rem; }
body {
  background: var(--color-void);
  color: var(--color-text);
  font-family: var(--font-sans);
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
}
::selection { background: rgba(255, 255, 255, 0.2); }

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 6px;
}

@layer components {
  /* Apple Liquid Glass: floating surfaces only */
  .liquid-glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.25),
      inset 0 -1px 1px rgba(0, 0, 0, 0.4);
  }
  .liquid-glass-interactive {
    transition: all 0.3s var(--ease-out-expo);
  }
  .liquid-glass-interactive:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow:
      0 25px 60px rgba(0, 0, 0, 0.6),
      inset 0 1px 2px rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }

  /* Flat card (default content surface) */
  .flat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-hairline);
  }

  /* Raycast spotlight: put on a child overlay inside a position:relative card.
     --mouse-x / --mouse-y are set by <SpotlightCard>. */
  .raycast-glow {
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s var(--ease-out-expo);
    background: radial-gradient(
      600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(255, 255, 255, 0.08),
      transparent 40%
    );
  }
  .spotlight-card:hover .raycast-glow,
  .spotlight-card:focus-within .raycast-glow { opacity: 1; }

  /* Linear sub-pixel grid backdrop */
  .grid-backdrop {
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 4rem 4rem;
    mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%);
  }

  .skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.09), rgba(255,255,255,0.04));
    background-size: 200% 100%;
    animation: shimmer 1.6s linear infinite;
    border-radius: 8px;
  }
}

@keyframes shimmer { to { background-position: -200% 0; } }

/* Fallbacks: never let glass hurt legibility or performance */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .liquid-glass { background: rgba(18, 18, 26, 0.92); }
}
@media (prefers-reduced-transparency: reduce) {
  .liquid-glass { background: rgba(18, 18, 26, 0.96); backdrop-filter: none; -webkit-backdrop-filter: none; }
}
@media (max-width: 767px) {
  .liquid-glass { backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4.2 Usage rules

- `liquid-glass` → navbar, hero window, command palette, dialogs/sheets, estimator live-summary panel, the footer CTA card. Nothing else.
- Every other card is `flat-card` + `rounded-[20px]`, with `spotlight-card` if it is a bento tile, case-study card, or service panel.
- Do not stack glass on glass. Do not animate `backdrop-filter`.
- Large blurred "ambient glow" blobs: **at most 2 per page**, static (no pulse animation), `pointer-events-none`, `will-change` omitted.

### 4.3 `SpotlightCard` (`src/components/ui/spotlight-card.tsx`)

A wrapper that sets `--mouse-x`/`--mouse-y` on mouse move (via `style.setProperty`, **not** React state, so it does not re-render) and renders `<div className="raycast-glow" />` as its first child. It accepts `as`, `className`, `children`. It must also set the vars on `focus` (center of element) so keyboard users get the glow.

---

## 5. Motion System (strict budget)

Motion is limited so the site feels precise, not busy.

**Allowed (and only these):**

1. **Hero sequence** (once, ~1.6 s total): badge fades in → headline → subhead → CTAs (stagger 100 ms) → hero window rises (y 40→0, 0.8 s) → code lines type in line by line → status LEDs switch on. Nothing else on the page auto-plays.
2. **Navbar:** transparent at top; on scroll > 24px it gains `liquid-glass` and shrinks vertical padding (300 ms).
3. **Hover/press responses** on interactive elements only: buttons (`active:scale-95`, arrow nudge `translate-x-1`), spotlight glow, `liquid-glass-interactive` lift (−2px).
4. **Layout/state changes that answer a user action:** accordion open, tab switch (cross-fade 200 ms), estimator step transitions (slide 24 px + fade, 300 ms), result numbers counting to the new value (400 ms), command palette open/close (scale 0.97→1 + fade, 200 ms).
5. **Metric ribbon counters:** count up **once** when scrolled into view.
6. **Synergy section:** one scroll-linked sequence (GSAP ScrollTrigger), see 8.1.

**Forbidden:** fade-and-slide-up on every section; staggered entrances on every grid; parallax; looping decorative animation (except the 2 LED blinks on hero status card and `animate-ping` on the single "live" dot in the hero window); animating blur, box-shadow spread, or layout properties that cause reflow.

**Reduced motion:** with `prefers-reduced-motion`, skip the hero sequence (render final state), disable Lenis smooth scroll, make ScrollTrigger content static and fully visible, and show counters at final values. Use Framer's `useReducedMotion()`.

**Smooth scroll (Lenis):** initialize once in a client provider; disable on touch devices and under reduced motion; ensure anchor links and `scroll-padding-top` still work; never block native scroll inside the command palette, dialogs, or textareas.

---

## 6. Tech Stack & Setup

Use **pnpm**. Create the app with: `pnpm create next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`.

| Area | Choice |
| :--- | :--- |
| Framework | Next.js (latest stable 15+), App Router, Server Components by default |
| Styling | Tailwind CSS v4 (CSS-first config, `@theme` as in 4.1), `clsx`, `tailwind-merge` |
| UI primitives | shadcn/ui (initialize with the CLI; add only: `dialog`, `tabs`, `slider`, `accordion`, `tooltip`, `checkbox`, `sheet`) restyled to our tokens. Radix underneath |
| Command palette | `cmdk` |
| Animation | `framer-motion`; `gsap` (ScrollTrigger) **only** in the Synergy section, loaded with dynamic import |
| Smooth scroll | `lenis` |
| State | `zustand` (estimator wizard, palette open state); `@tanstack/react-query` (client-side calls: estimate, RAG, prompt-parse, search) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Markdown | `react-markdown` + `remark-gfm` (no raw HTML) |
| Booking | `@calcom/embed-react` (lazy) |
| Icons | `lucide-react` |
| Fonts | `geist`, JetBrains Mono via `next/font/google` |
| Types from API | `openapi-typescript` (dev dependency) |
| Tests | `vitest` (pure logic), `@playwright/test` (smoke) |

### Environment variables (`.env.local.example`)

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000            # server-side fetches
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 # browser fetches
NEXT_PUBLIC_CAL_LINK=                          # e.g. team/discovery-call
NEXT_PUBLIC_API_MOCKING=disabled               # "enabled" uses local fixtures
```

### File structure

```
src/
├── app/
│   ├── layout.tsx  globals.css  not-found.tsx  error.tsx  sitemap.ts  robots.ts
│   ├── page.tsx                      # Home
│   ├── services/ page.tsx  [slug]/page.tsx  loading.tsx
│   ├── work/ page.tsx  [slug]/page.tsx  loading.tsx
│   ├── ai-lab/ page.tsx
│   ├── estimator/ page.tsx
│   ├── about/ page.tsx
│   └── contact/ page.tsx
├── components/
│   ├── shell/    navbar.tsx  footer.tsx  mobile-menu.tsx  command-palette.tsx  providers.tsx  skip-link.tsx
│   ├── ui/       button.tsx  badge.tsx  kbd.tsx  spotlight-card.tsx  glass-panel.tsx  section.tsx  stat.tsx  skeleton.tsx  markdown.tsx  (+ shadcn files)
│   ├── home/     hero.tsx  metric-ribbon.tsx  capability-bento.tsx  synergy-stack.tsx  tech-switcher.tsx  featured-work.tsx  estimator-teaser.tsx  footer-cta.tsx
│   ├── services/ service-panel.tsx  service-toc.tsx
│   ├── work/     case-card.tsx  filter-bar.tsx  metric-row.tsx
│   ├── estimator/ wizard.tsx  step-services.tsx  step-office.tsx  step-software.tsx  step-review.tsx  step-contact.tsx  live-summary.tsx  success.tsx
│   ├── ai-lab/   lab-tabs.tsx  rag-simulator.tsx  pipeline-visual.tsx  prompt-parser.tsx  airgap-diagram.tsx
│   └── contact/  contact-form.tsx  booking-embed.tsx  location-card.tsx
├── content/      site.ts  copy.ts  metrics.ts  tech-stack.ts  pillars.ts  process.ts  team.ts
├── lib/
│   ├── api/      client.ts  endpoints.ts  mocks.ts  types.ts  (api.generated.ts after codegen)
│   ├── hooks/    use-debounced-value.ts  use-count-up.ts  use-mouse-glow.ts
│   ├── stores/   estimator-store.ts  palette-store.ts
│   ├── format.ts (money, ranges, weeks)   cn.ts   seo.ts
└── tests/        format.test.ts  estimator-store.test.ts  e2e/smoke.spec.ts
```

---

## 7. Global Shell

### 7.1 Navbar (`navbar.tsx`, client component)

```
[ ◆ Company Name ]   Services  Work  AI Lab  Estimator  About        [ ⌘K Search ]  [ Book Discovery Call ]
```

- Fixed, centered floating pill (`rounded-full`), `top-4`, `max-w-5xl`, `w-[calc(100%-2rem)]`. At scroll top: transparent with hairline border. After 24px scroll: `liquid-glass`.
- Active route link has a `bg-white/10 rounded-full` pill behind it (Framer `layoutId="nav-active"`, spring).
- `⌘K Search` button shows `kbd` with `⌘ K` on macOS and `Ctrl K` elsewhere (detect after mount to avoid hydration mismatch). Click opens the palette.
- Primary button "Book Discovery Call" → `/contact#book`.
- **Mobile (<768px):** logo + `⌘K` icon button + menu button. Menu opens a full-height `sheet` with large links, the estimator link emphasized, and the booking button pinned at the bottom. Trap focus; `Esc` closes; body scroll locked.
- Services link opens a hover/focus dropdown (desktop) listing the four service pages; keyboard accessible (arrow keys, Esc). On mobile they are listed inline in the sheet.

### 7.2 Footer

Four link columns (Services, Company, Lab & tools, Contact), a divider, and a bottom row with copyright, a "Press ⌘K to search" hint, and email. No newsletter form. No social icons unless `siteConfig.social` has entries.

### 7.3 Command Palette (`command-palette.tsx`)

Raycast-style launcher. See the full reference code in Section 13.2. Behavior:

- Opens with `⌘K` / `Ctrl+K`, the navbar button, or `/` when focus is not in an input. Closes with `Esc`, outside click, or after selecting.
- **Groups (static, always available offline):** *Navigate* (Home, Services, each of the 4 services, Work, AI Lab, Estimator, About, Contact), *Actions* (Calculate Project Scope → `/estimator`; Book Discovery Call → `/contact#book`; Copy contact email).
- **Remote results:** when the query has ≥ 2 characters, debounce 200 ms and call `GET /search`; show a *Results* group above the static ones. If the call fails, silently show static results only.
- Each item has an icon, a title, and a right-aligned hint (`Page`, `Service`, `Case study`, `Action`). Selected item: `bg-white/10`, arrow keys move, `Enter` activates.
- Footer row inside the palette: `↑↓ navigate · ↵ open · esc close` rendered with `kbd`.
- Empty state: "No matches. Try “estimate”, “air-gapped”, or “ERP”."
- Lazy-load the palette code (dynamic import) on first idle or on first open so it does not weigh on first load.

---

## 8. Page Specifications

Every page: one `<h1>`, sections wrapped in `<section aria-labelledby>`, metadata via `generateMetadata`/`metadata`, a skeleton `loading.tsx` where data is fetched, and graceful error states. Data fetching on content pages happens in **Server Components** with `revalidate: 60`.

### 8.1 Home `/`

Section order (exact):

1. **Hero**
2. **Metric ribbon**
3. **Capability bento** (5 pillars)
4. **Synergy stack** (hardware ↔ software)
5. **Tech stack switcher**
6. **Featured work** (3 case studies)
7. **Estimator teaser**
8. **Footer CTA** + footer

#### 8.1.1 Hero

```
                        [● Software + infrastructure, one team   ⌘K]          <- capsule badge
                 Architecting High-Performance Software,
              Agentic AI, and Turnkey IT Infrastructure.                       <- h1, gradient
   From enterprise web platforms and custom ERPs to air-gapped local AI servers
   and complete office networking—we build the entire digital and physical
   technology stack.                                                           <- subhead
              [ Calculate Project Scope → ]  [ ▸ Book Discovery Call ]         <- CTAs
 ┌─ ● ● ● ──────────── stack.config.ts ───────────── ✦ ─┐
 │ ┌───────────────────────────────┐ ┌─────────────────┐ │
 │ │ ● Delivery plan   TypeScript  │ │ ▣ AI inference  │ │
 │ │ const project = defineProject │ │ VLAN 30 · Active│ │
 │ │   software: [web, erp, ai],   │ │ Outbound: blocked│ │
 │ │   network: "cabling + Wi-Fi", │ │ ▮▮▮▮▮▯ rack LEDs│ │
 │ │   compute: "local GPU rack",  │ │ ████████░░ 80%  │ │
 │ │   aiMode: "air-gapped" ...    │ └─────────────────┘ │
 │ └───────────────────────────────┘                     │
 └───────────────────────────────────────────────────────┘
```

- Copy: use the exact h1, subhead, and CTA labels from the engineering spec (Section 11.1).
- Primary CTA: white button, black text → `/estimator`. Secondary CTA: glass button → `/contact#book`. (The blueprint's "View Interactive Stack" is replaced because the spec's CTAs win.)
- Capsule badge text: "Software + infrastructure, one team" with a cyan dot and a `kbd` `⌘ K`. Clicking opens the palette.
- Hero window: left cell shows a typed config snippet (syntax-colored: keywords `accent-2`, strings `emerald`, functions `cyan`); right cell is the **status card**: an AI-inference node named "AI inference", tag `VLAN 30`, line "Outbound traffic: blocked", a row of 6 rack LEDs (CSS only; 4 emerald steady, 1 cyan blinking slowly, 1 off), and a thin progress bar labeled "GPU load" that is **static decorative** at 64% and has `aria-hidden`. **Do not show fake performance numbers** (no "<8ms").
- The only auto-playing motion is the sequence in Section 5 item 1. The pointer-follow spotlight (`--mouse-x/--mouse-y`) is set on the hero container with `style.setProperty`; the overlay uses `.raycast-glow` at full opacity on hover of the hero.
- Background: grid backdrop + **one** static gradient glow (indigo → purple), blurred 140px, behind the hero window.
- Full-reference code in Section 13.1.

#### 8.1.2 Metric ribbon

A thin full-width band with hairline top/bottom borders, 4 stats in a row (2×2 on mobile): mono number, small label under it. Values come from `src/content/metrics.ts` and are **PLACEHOLDER** (clearly commented) until the agency supplies verified figures. Defaults to display: `—` is not allowed; use these placeholders: "Projects delivered", "Offices wired", "Systems in production", "Client retention". Counters animate once on first view; if a value is not numeric (e.g., "24/7") render as-is.

#### 8.1.3 Capability bento (5 pillars)

Asymmetric grid, 6 columns on desktop (`grid-cols-6 auto-rows-[minmax(220px,auto)]`), stacked on mobile:

```
┌──────────── Web apps (col-span-3) ───────┐┌── ERP (col-span-3) ────┐
│ mini code/typed snippet                  ││ modular blocks diagram │
└──────────────────────────────────────────┘└────────────────────────┘
┌── AI tools (col-span-2) ─┐┌─ Infrastructure (col-span-2)─┐┌ Synergy (col-span-2) ┐
│ mini chat + source chip  ││ rack with LEDs, cable lines  ││ stacked layers icon  │
└──────────────────────────┘└──────────────────────────────┘└─────────────────────┘
```

- Each tile is a `flat-card spotlight-card rounded-[20px]` with: icon (Lucide), title (H3), one-sentence description (messaging matrix, Section 11.2), a small visual in the lower half, and a "Learn more" text link to the service page (the synergy tile links to `#synergy`).
- Visuals are lightweight CSS/SVG, **not images or video**: code snippet (static text), ERP modules as 6 small rounded squares with labels (Finance, Inventory, CRM, HR, Orders, Reports), AI chat bubble + "Source: Network_Security_Spec.pdf" chip, rack drawing built from `div`s with LEDs, layered rectangles for synergy.
- Hover: spotlight glow follows the cursor. No lift animation on these tiles.

#### 8.1.4 Synergy stack (id `synergy`) — the only scroll-linked animation

Two columns. Left: sticky text block (heading "One team from cable to code", paragraph from the messaging matrix, a text link "See how we work →" to `/about`). Right: a vertical stack of 5 layers (bottom to top):

1. Cabling and network
2. Servers and GPU racks
3. Runtime and security
4. Business applications (Web, ERP)
5. AI agents and tools

- As the user scrolls the section, layers light up from the bottom (border → `accent`, small glow, label brightens); the left text swaps a one-line caption per active layer (cross-fade). GSAP ScrollTrigger with `scrub`, pinned only on desktop (≥1024px). On mobile and reduced motion: all layers fully lit, static, no pinning.
- Layers are also **buttons**: click/Enter on a layer jumps the caption to it (works for keyboard users and when scroll-linking is off).
- Load GSAP via `await import("gsap")` inside `useEffect`; kill triggers on unmount.

#### 8.1.5 Tech stack switcher

Filter chips: **All · Frontend · Backend · AI · Infrastructure · Cloud** (single-select, `role="tablist"`). Below, a responsive grid (2/3/4/6 columns) of tiles. Each tile: monogram square (first 2 letters, colored by group) + name + one-word role. **No brand logos.** Content in `src/content/tech-stack.ts`:

- Frontend: Next.js, React, TypeScript, Tailwind
- Backend: Python, FastAPI, Node.js, PostgreSQL, Redis
- AI: PyTorch, vLLM, pgvector, LangChain-style pipelines (name it "RAG pipelines")
- Infrastructure: Cisco, Ubiquiti, Structured cabling, GPU racks
- Cloud: AWS, Cloudflare, Docker, Linux

Filtering uses a 200 ms cross-fade (no layout shuffle animation). Selected chip: white text, `bg-white/10`, hairline border.

#### 8.1.6 Featured work

Fetch `GET /case-studies?limit=3`. Show 3 `CaseCard`s (see 8.4). Heading "Recent work", link "View all work" → `/work`. If the API fails: render a single quiet card "Case studies are loading slowly. Browse all work." linking to `/work`. If empty: hide the section entirely.

#### 8.1.7 Estimator teaser

A flat card with hairline border, two columns on desktop.
Left: heading "Estimate your project in a minute", sentence "Pick what you need. We'll show a planning range for cost and timeline." Right: 6 selectable service chips (labels from Section 11.3), and a result area.

- On any selection, debounce 400 ms, then `POST /estimate/calculate` with sensible defaults (workstations 10, floor area 1500, no rack, no air-gap, roles 3, no integrations). Show: mono range `$18,500 – $27,000`, timeline `6–10 weeks`, small note "Planning estimate. Refine it next."
- Button "Refine this estimate" → `/estimator?services=custom_web,erp_custom` (comma-separated chosen values).
- States: nothing selected → muted placeholder "Select at least one service." Loading → skeleton lines. Error → "Couldn't calculate right now. Try again." with a retry button.

#### 8.1.8 Footer CTA

A single centered `liquid-glass` card (`rounded-[28px]`), ambient glow behind it: heading "Tell us what you're building", one sentence, two buttons (same as hero). Then the footer.

### 8.2 Services `/services`

- Header: H1 "Services", one-sentence intro.
- Four large `ServicePanel`s in a vertical list (not a grid): left column title + short description + technology chips; right column a plain bullet list of 4–5 capabilities (from the messaging in the engineering spec route map, stored in `src/content/pillars.ts`), "Explore" link to `/services/{slug}`. Panels use `flat-card spotlight-card`. Data (`title`, `short_description`, `technologies_used`) from `GET /services`; the bullet lists come from `pillars.ts` keyed by `category`.
- Below: **Delivery model** as a horizontal 4-step timeline (a real sequence, so numbers are allowed): Discover → Design → Build and install → Support. Short captions from `process.ts`.
- End with the Footer CTA.

### 8.3 Service detail `/services/[slug]`

Slugs: `web-apps`, `erp-systems`, `ai-solutions`, `infrastructure`.

- Header: breadcrumb (`Services / {title}`), H1, short description, technology chips, primary CTA "Estimate this project" → `/estimator?services={default service for category}` (`web→custom_web`, `erp→erp_custom`, `ai→ai_solutions`, `infrastructure→office_networking`).
- Body: two columns on desktop (≥1024px). Left: sticky table of contents built from the Markdown `##` headings with scroll-spy (active heading gets a 2px `accent` left bar). Right: Markdown content rendered by `<Markdown>` (typography styles: H2 24px with top margin, paragraphs `max-w-[65ch]`, lists with custom bullets, code blocks mono on `surface-2`, tables with hairline borders and horizontal scroll container).
- "Related work": up to 3 case studies where `domains` includes the service category, using `GET /case-studies?filter={category}` (for `infrastructure` use `filter=hardware`).
- Unknown slug → `notFound()`. API down → error boundary state (Section 12.3).

### 8.4 Work `/work` and `/work/[slug]`

**Filter bar:** chips `All · Web · ERP · AI · Hardware · Hybrid`, mapped to `filter` values (`all, web, erp, ai, hardware, hybrid`). Sync with the URL (`?filter=erp`) using `router.replace` with `scroll: false`. Show the result count ("6 case studies") with `aria-live="polite"`.

**`CaseCard`** (`flat-card spotlight-card rounded-[20px]`, whole card is a link):

- Top: cover image (`next/image`, 16:9) or, if `cover_image_url` is null, a generated placeholder (grid backdrop + category icon + faint accent gradient).
- Body: industry (small muted), title (H3), two headline metrics as mono number + label.
- Category badge (`Software`, `Hardware`, `Hybrid`).
- **Hover/focus expand:** a region below the metrics reveals the top 4 `software_stack` chips and the text "View architecture →" by transitioning `grid-template-rows` from `0fr` to `1fr` (300 ms). On devices with `(hover: none)`, this region is always visible.

**States:** loading → 6 skeleton cards; empty → "No case studies in this category yet." plus a button "Show all work"; error → "Couldn't load case studies." plus "Try again".

**Detail page:** H1, industry + category badge, a metric row (large mono numbers, each in a hairline-separated cell), **Problem** (text), **Solution architecture** (Markdown), **Technical specifications** (two-column definition list: `hardware_specs` entries; `software_stack` as chips), CTA band "Estimate a similar project" → `/estimator`. Unknown slug → `notFound()`.

### 8.5 Estimator `/estimator`

Full flow in Section 9. Layout: two columns on desktop: wizard (left, ~62%) and **live summary panel** (right, sticky, `liquid-glass`). On mobile the summary collapses into a sticky bottom bar showing the range, which expands into a sheet on tap.

### 8.6 AI Lab `/ai-lab`

Header: H1 "AI Lab", sentence "Try the same building blocks we use in client projects." Tabs (Radix `tabs`, keyboard accessible, URL hash sync `#rag`, `#parser`, `#airgap`): **RAG simulator**, **Prompt parser**, **Air-gapped architecture**. Heavy tabs load lazily (`next/dynamic`, `ssr: false` for the diagram and simulators).

**RAG simulator**

```
Left (form)                                   Right (pipeline)
┌ Ask the demo knowledge base ───────┐        ● Embed query        12 ms
│ [ How does local air-gapped AI ... ]│        │
│ Try: [Air-gap routing] [VLAN 30] .. │        ● Vector search      8 ms
│ Results to retrieve: (1)(2)(3)(4)(5)│        │   chunk cards with score bars
│ [ Run simulation ]                  │        ● Rerank             1 ms
└─────────────────────────────────────┘        ● Assemble prompt    1 ms
                                               ● Generate answer    420 ms
                                               ┌ Answer (typed reveal) ┐
```

- Prefill with the spec's query: "How does local air-gapped AI routing work with our hardware firewall?" Offer 3 suggestion chips (that one plus two short related questions about VLAN isolation and what leaves the building).
- `top_k` selector 1–5 (default 2). Query length counter (max 300) with live validation.
- On run: disable the button, show all five stages as pending; light them in order using each stage's real `duration_ms` scaled so each stage shows for between 250 ms and 700 ms (total animation ≤ 3 s), regardless of the actual network time. Show returned chunks as cards: source file name (mono), a score bar (`score × 100`%), and the chunk text. Then reveal `llm_response` with a fast typewriter (≈ 25 ms/char, skippable by clicking "Show full answer").
- Mode badge next to the title: `Live` (emerald), `Cached` (cyan), `Demo mode` (amber, tooltip "Using keyword retrieval and a templated answer"). Never hide the mode.
- Errors: 429 → "You've run a lot of demos. Try again in {n} seconds." (use `details.retry_after_seconds`); 503/network → "The demo is unavailable right now. Try again shortly."; 422 → show field message under the input.

**Prompt parser**

- Textarea (max 500) with 3 preset prompts (one network, one compliance, one with an email address to demonstrate blocking). Button "Analyze prompt".
- Result sections, shown together after the response: **Tokens** (chips colored by `kind`, mono), **Intent** (label + confidence bar), **Entities** (list with type badges), **Guardrails** (4 rows with ✓ emerald / ✕ rose icon and note), **Routing** (a result card: icon + target name: "Local air-gapped model" (shield), "Cloud model" (cloud), "Blocked" (ban), and the `reason`).
- A small animated connector from guardrails to routing is allowed (a 300 ms line draw on result arrival only).

**Air-gapped architecture**

- Fetch `GET /hardware-blueprints/BLUEPRINT-AIRGAP-25`. Render each `zone` as a glass-less flat node card in a fixed layout: top row `Internet` (dashed border) and `Perimeter firewall`; middle row `Office LAN`, `Core services`; bottom row `AI inference` (accent border, shield icon) and `Management`. Each node shows name, `VLAN n` mono tag (if any), purpose, and an egress badge (`none` rose "No outbound", `restricted` amber, `open` emerald).
- Draw connecting lines as simple SVG paths between node centers using `getBoundingClientRect`-free fixed coordinates from a small constant map keyed by zone id (do not build an auto-layout engine).
- Interaction: hover/focus/click a node → highlight the links touching it (line turns `accent`, others dim to 20%) and show the policy text for those links in a panel at the right (desktop) or below (mobile). Default selection: `ai`.
- A legend explains the egress badges. A "BOM" accordion below lists `hardware_bom` rows (item, qty, notes).

### 8.7 About `/about`

H1 "About". Sections: **How we work** (3 short principles, plain text blocks, not cards), **Process** (vertical timeline, real sequence, numbers allowed: Discover → Architect → Build → Install on site → Operate; copy in `process.ts`), **Security commitments** (5 items in a hairline-separated list; copy is PLACEHOLDER until the agency confirms), **Team** (grid of people with initials avatars; PLACEHOLDER data in `team.ts`). End with Footer CTA. No stock photos.

### 8.8 Contact `/contact`

Two columns on desktop.
- Left: **Booking** (`id="book"`): glass-free card containing the Cal.com inline embed (lazy, only when scrolled near or when `#book` is targeted). If `NEXT_PUBLIC_CAL_LINK` is empty, show the card with text "Online booking isn't set up yet. Send a message and we'll reply with times." and a button that focuses the form.
- Right: **Quick message** form (fields: name*, email*, company, topic select, message*, consent checkbox*, hidden honeypot `website` with `tabIndex=-1`, `autoComplete="off"`, visually hidden but not `display:none`). Validation with zod (same limits as Appendix A). Submit button "Send message"; while sending "Sending…". Success replaces the form with: "Message sent. We'll reply within {siteConfig.responseTime}." and a "Send another" button. Errors: field-level messages; 429 "Too many messages from this connection. Try again in {n} minutes."; network "Couldn't send. Check your connection and try again." Keep entered values on error.
- Below: **Location card** with address/hours from `siteConfig` (PLACEHOLDER), a static decorative map-style grid graphic (no third-party map embed, no tracking), and a link "Open in Maps" (plain URL).

---

## 9. Estimator UX (state machine)

Single `zustand` store (`estimator-store.ts`) holds: `step`, `services`, `office`, `software`, `contact`, `result`, `status`. Persist to `sessionStorage` (key `estimator:v1`) so refresh doesn't lose progress; clear after a successful submit.

**Steps (a real sequence, show a numbered progress rail; keep it simple: dots + labels, current highlighted):**

1. **Services.** Six selectable cards (icon, title, one-line description; multi-select with checkmark). At least one required. Preselect from `?services=`.
2. **Office and hardware.** Shown **only if** `office_networking`, `local_ai_server`, or `workstation_provisioning` is selected; otherwise skipped. Fields: workstations (slider 1–200 + number input), floor area sqft (slider 200–20,000, step 100 + number input), toggles "Server rack" and "Air-gapped security" (the latter shown only if `local_ai_server` selected, with a one-line explanation).
3. **Software.** Shown **only if** any of `custom_web`, `erp_custom`, `ai_solutions` is selected. Fields: user roles (stepper 1–20), integrations (multi-select chips: Stripe, Salesforce, HubSpot, QuickBooks, Slack, Shopify, plus "Other" which adds a text input; convert to lowercase slugs, matching `^[a-z0-9][a-z0-9_-]{0,39}$`, max 10).
4. **Review.** Read-only summary of choices with "Edit" links back to each step and the full estimate (range, timeline, breakdown lines, recommended blueprint name with a link to `/ai-lab#airgap` if it contains `AIRGAP`, and the `assumptions` as a list). Buttons: "Back", "Continue".
5. **Your details.** name*, email*, company, phone, notes (max 2000), consent checkbox* ("I agree to be contacted about this estimate."), honeypot. Button "Send estimate".
6. **Done.** Success screen: "Estimate sent." with the range, a sentence "Book a call to confirm scope." and a primary button "Book Discovery Call" opening `booking_url` (if null → `/contact#book`). Secondary: "Start a new estimate".

**Live estimate:** from step 1 onward, whenever inputs change, debounce 400 ms and call `POST /estimate/calculate`; update the **live summary panel**: total range (mono, large), timeline, and breakdown lines. Numbers count to new values (400 ms). Use TanStack Query with `placeholderData: keepPreviousData` so the panel doesn't flash blank. Cancel in-flight requests when inputs change. Panel states: nothing selected → "Select a service to see a range."; loading → keep old numbers, show a small spinner; error → "Couldn't update the estimate." with "Retry".

**Behavior details:**
- Step transitions slide 24 px + fade (300 ms); focus moves to the step heading on change (`tabIndex={-1}`, announced via `aria-live="polite"`).
- "Continue" is disabled until the step is valid; show the reason below the button, not just a disabled state.
- Back never loses data.
- Submit → `POST /estimate/submit` with `estimate_input` built from the store. Do not send any computed numbers. Use the `estimate` from the response for the Done screen.
- Errors on submit: 422 → map `details` to fields; 429 → rate-limit message with minutes; other → "Couldn't send your estimate. Your details are saved. Try again."
- Always show the disclaimer under the panel: "Planning estimate, not a quote."

---

## 10. Data Layer

- `src/lib/api/client.ts`: a typed `request<T>()` using `fetch`. Server calls use `API_BASE_URL`, browser calls use `NEXT_PUBLIC_API_BASE_URL`. Parse the Appendix A envelope: on `success:false` throw `ApiError { status, code, message, details }`. Add a 10 s timeout via `AbortController`. Server fetches pass `next: { revalidate: 60 }` for content GETs and `cache: "no-store"` for others.
- `src/lib/api/endpoints.ts`: one typed function per endpoint (`getServices`, `getService(slug)`, `getCaseStudies(params)`, `getCaseStudy(slug)`, `getBlueprint(code)`, `calculateEstimate(body)`, `submitEstimate(body)`, `submitContact(body)`, `runRag(body)`, `parsePrompt(body)`, `search(q)`).
- **Types:** until the backend is available, hand-write `src/lib/api/types.ts` by copying the Appendix A.3 interfaces verbatim. When `../backend/docs/openapi.json` exists, add a script `"gen:api": "openapi-typescript ../backend/docs/openapi.json -o src/lib/api/api.generated.ts"` and make `types.ts` re-export from the generated file while keeping the Appendix A names. Never edit generated files.
- **Mocks (`NEXT_PUBLIC_API_MOCKING=enabled`):** `mocks.ts` returns static fixtures that match Appendix A (4 services, 6 case studies, 1 blueprint with the zones from Section 8.6, the A.4 golden estimate for any calculate call, a canned RAG response, a canned parser response). Mocks exist so you can build and review every screen before the backend runs. They are not business logic; do **not** re-implement pricing in the frontend.
- Case study and service Markdown is rendered with `react-markdown` + `remark-gfm`; never use `dangerouslySetInnerHTML`.
- Format helpers in `format.ts`: `formatUSD(12000) → "$12,000"`, `formatRange({min,max}) → "$12,000 – $16,000"`, `formatWeeks({min,max}) → "6–10 weeks"` (single value if equal). Unit-test them.

---

## 11. Copy Deck (use verbatim; PLACEHOLDER items live in `src/content/`)

### 11.1 Hero
- **H1:** Architecting High-Performance Software, Agentic AI, and Turnkey IT Infrastructure.
- **Subhead:** From enterprise web platforms and custom ERPs to air-gapped local AI servers and complete office networking—we build the entire digital and physical technology stack.
- **CTAs:** Calculate Project Scope · Book Discovery Call

### 11.2 Pillars (title → description)
1. **Custom web apps** → Bespoke, scalable web apps and microservices built with modern frameworks.
2. **Enterprise ERP systems** → Modular business management platforms replacing legacy bottlenecks.
3. **AI tools and integration** → Domain-specific LLMs, agentic workflows, and automated pipeline integration.
4. **Hardware and infrastructure** → Enterprise network cabling, zero-downtime Wi-Fi, workstation setup, and local GPU server racks.
5. **One team, cable to code** → Software engineering and physical infrastructure under one roof, eliminating vendor friction.

### 11.3 Estimator service labels
`custom_web` Custom web app · `erp_custom` Custom ERP · `ai_solutions` AI tools and integration · `office_networking` Office networking and cabling · `local_ai_server` Local AI server · `workstation_provisioning` Workstation setup

### 11.4 System messages
- Generic load error: "Something went wrong loading this page. Try again."
- Not found: heading "Page not found", text "That page doesn't exist or has moved." buttons "Go home" and "Open search (⌘K)".
- Empty search: "No matches. Try “estimate”, “air-gapped”, or “ERP”."
- Footer CTA: heading "Tell us what you're building", text "Share your goals and constraints. We'll reply with a plan and a planning range."
- Success toasts keep the action's verb: button "Send message" → confirmation "Message sent."; "Send estimate" → "Estimate sent."

### 11.5 Placeholder policy
`src/content/site.ts`: `name`, `email`, `phone`, `address`, `hours`, `responseTime` ("one business day"), `calLink` (from env), `social`. `metrics.ts`, `team.ts`, security commitments: all generic and obviously editable. Add a `docs/CONTENT_TODO.md` listing every placeholder with its file path.

---

## 12. Accessibility, Performance, SEO

### 12.1 Accessibility (WCAG 2.2 AA)
- Visible focus ring everywhere (defined in `globals.css`), skip link to `#main`, one `h1` per page, landmark elements (`header`, `nav`, `main`, `footer`).
- Palette, dialogs, sheets, tabs: focus trapped and restored; `Esc` closes; correct ARIA roles (cmdk and Radix handle most, verify).
- Chips that filter act as `tablist/tab` or `radiogroup` as appropriate; selected state exposed via `aria-selected`/`aria-checked`.
- Forms: associated `<label>`s, `aria-invalid`, errors linked with `aria-describedby`, error summary focus on submit failure.
- Decorative visuals `aria-hidden="true"`. Charts/diagrams have text equivalents (the air-gapped diagram's policy list is the text equivalent).
- Touch targets ≥ 44×44 px. Text on glass must pass 4.5:1; if not, raise the surface opacity.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency` (CSS above).

### 12.2 Performance
- Targets on a mid-range phone, 4G: LCP < 2.0 s, CLS < 0.05, INP < 200 ms; Home first-load JS ≤ 200 KB gzip.
- Server Components for all content sections; `"use client"` only where needed (hero, navbar, palette, tabs, wizard, simulators).
- `next/dynamic` for: command palette, estimator wizard parts, AI Lab simulators, Cal embed, GSAP. Fonts via `next/font` with `display: swap`.
- `next/image` for any image with explicit sizes. No video. No autoplaying media.
- Limit simultaneous `backdrop-filter` elements (Section 4.2). Avoid large blur on mobile (CSS already lowers blur at <768px).

### 12.3 Error and loading handling
- `loading.tsx` skeletons for `/services`, `/services/[slug]`, `/work`, `/work/[slug]`.
- `error.tsx` (client) with message from 11.4 and a "Try again" button calling `reset()`.
- Server fetch failures on content pages render the page shell with an inline error block rather than crashing, except detail pages, which use `error.tsx`.

### 12.4 SEO
- `metadata` per page (title template `%s · {siteConfig.name}`, description, Open Graph, Twitter card), canonical URLs from `NEXT_PUBLIC_SITE_URL`.
- Dynamic OG image via `next/og` for the home page and each case study.
- `sitemap.ts` including service and case-study slugs (fetched at build/revalidate); `robots.ts`.
- JSON-LD: `Organization` on all pages, `Service` on service pages. Server-rendered.

---

## 13. Reference Code (adapt, don't copy blindly)

These are corrected versions of the blueprint's samples. Differences from the blueprint: spotlight actually follows the cursor, the hero copy matches the engineering spec, fake metrics are removed, the config sample reflects software + hardware, motion respects reduced-motion, and the palette really navigates.

### 13.1 Hero (`src/components/home/hero.tsx`)

```tsx
"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Command, ArrowRight, Terminal, ShieldCheck } from "lucide-react";
import { usePaletteStore } from "@/lib/stores/palette-store";
import { copy } from "@/content/copy";

const ease = [0.16, 1, 0.3, 1] as const;

const codeLines = [
  [["const ", "kw"], ["project", "id"], [" = ", "pl"], ["defineProject", "fn"], ["({", "pl"]],
  [["  software: ", "pl"], ['["web", "erp", "ai"]', "str"], [",", "pl"]],
  [["  network: ", "pl"], ['"cabling + Wi-Fi"', "str"], [",", "pl"]],
  [["  compute: ", "pl"], ['"local GPU rack"', "str"], [",", "pl"]],
  [["  aiMode: ", "pl"], ['"air-gapped"', "str"]],
  [["});", "pl"]],
  [["await ", "kw"], ["project", "id"], [".", "pl"], ["deliver", "fn"], ["();", "pl"]],
] as const;

const tone: Record<string, string> = {
  kw: "text-accent-2", id: "text-text", fn: "text-cyan", str: "text-emerald", pl: "text-text-muted",
};

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const openPalette = usePaletteStore((s) => s.setOpen);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }

  const enter = (delay: number, y = 20) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease } };

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      aria-labelledby="hero-title"
      className="spotlight-card relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-28"
    >
      <div className="raycast-glow !opacity-100" aria-hidden />
      {/* one static ambient glow */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-accent/30 via-accent-2/20 to-pink-500/20 blur-[140px]" />
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />

      <motion.button
        {...enter(0)}
        onClick={() => openPalette(true)}
        className="relative mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs text-text-muted backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
      >
        <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee]" />
        <span>Software + infrastructure, one team</span>
        <span className="h-3 w-px bg-white/20" />
        <kbd className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/80">
          <Command size={10} /> K
        </kbd>
      </motion.button>

      <motion.h1
        id="hero-title"
        {...enter(0.1)}
        className="relative max-w-5xl bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-center text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.06] tracking-tight text-transparent"
      >
        {copy.hero.title}
      </motion.h1>

      <motion.p {...enter(0.2)} className="relative mt-6 max-w-2xl text-center text-lg leading-relaxed text-text-muted">
        {copy.hero.subtitle}
      </motion.p>

      <motion.div {...enter(0.3)} className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/estimator" className="group flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition hover:bg-neutral-200 active:scale-95">
          {copy.hero.primaryCta}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
        <Link href="/contact#book" className="liquid-glass flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition hover:bg-white/10 active:scale-95">
          <Terminal size={16} className="text-text-muted" />
          {copy.hero.secondaryCta}
        </Link>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease }}
        className="liquid-glass relative mt-16 w-full max-w-5xl overflow-hidden rounded-[28px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex gap-2" aria-hidden>
            {[0, 1, 2].map((i) => <span key={i} className="h-3 w-3 rounded-full border border-white/30 bg-white/20" />)}
          </div>
          <span className="font-mono text-xs tracking-wider text-text-muted">stack.config.ts</span>
          <ShieldCheck size={14} className="text-accent-2" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:p-8">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:col-span-2">
            <div className="mb-4 flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-2 text-emerald">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald" aria-hidden /> Delivery plan
              </span>
              <span className="text-text-faint">TypeScript</span>
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-6">
              <code>
                {codeLines.map((line, i) => (
                  <motion.span
                    key={i}
                    className="block"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 + i * 0.12, duration: 0.2 }}
                  >
                    {line.map(([t, k], j) => <span key={j} className={tone[k]}>{t}</span>)}
                  </motion.span>
                ))}
              </code>
            </pre>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI inference</span>
              <span className="rounded border border-cyan/20 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] text-cyan">VLAN 30</span>
            </div>
            <div className="my-4">
              <p className="text-sm text-text-muted">Outbound traffic: blocked</p>
              <div className="mt-3 flex gap-1.5" aria-hidden>
                {["bg-emerald","bg-emerald","bg-emerald","bg-emerald","bg-cyan animate-pulse","bg-white/15"].map((c, i) => (
                  <span key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
                ))}
              </div>
            </div>
            <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[64%] bg-cyan" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
```

`src/content/copy.ts` exports `copy.hero = { title, subtitle, primaryCta, secondaryCta }` using Section 11.1 verbatim. `palette-store.ts` is a tiny zustand store `{ open: boolean; setOpen(v: boolean): void }`.

### 13.2 Command palette (`src/components/shell/command-palette.tsx`)

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import { Search, Code2, Layers, Phone, Calculator, FlaskConical, Home, Info, Mail, Server } from "lucide-react";
import { usePaletteStore } from "@/lib/stores/palette-store";
import { search } from "@/lib/api/endpoints";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { siteConfig } from "@/content/site";

type Item = { id: string; label: string; hint: string; href?: string; run?: () => void; icon: React.ReactNode };

const iconClass = "text-accent";
const NAV: Item[] = [
  { id: "home", label: "Home", hint: "Page", href: "/", icon: <Home size={16} className={iconClass} /> },
  { id: "services", label: "Services", hint: "Page", href: "/services", icon: <Layers size={16} className={iconClass} /> },
  { id: "web", label: "Custom web apps", hint: "Service", href: "/services/web-apps", icon: <Code2 size={16} className={iconClass} /> },
  { id: "erp", label: "Enterprise ERP systems", hint: "Service", href: "/services/erp-systems", icon: <Layers size={16} className={iconClass} /> },
  { id: "ai", label: "AI tools and integration", hint: "Service", href: "/services/ai-solutions", icon: <FlaskConical size={16} className={iconClass} /> },
  { id: "infra", label: "Turnkey office and hardware", hint: "Service", href: "/services/infrastructure", icon: <Server size={16} className={iconClass} /> },
  { id: "work", label: "Case studies", hint: "Page", href: "/work", icon: <Layers size={16} className={iconClass} /> },
  { id: "lab", label: "AI Lab", hint: "Page", href: "/ai-lab", icon: <FlaskConical size={16} className={iconClass} /> },
  { id: "about", label: "About", hint: "Page", href: "/about", icon: <Info size={16} className={iconClass} /> },
  { id: "contact", label: "Contact", hint: "Page", href: "/contact", icon: <Mail size={16} className={iconClass} /> },
];

export default function CommandPalette() {
  const router = useRouter();
  const { open, setOpen } = usePaletteStore();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 200);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(!usePaletteStore.getState().open); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => { if (!open) setQ(""); }, [open]);

  const remote = useQuery({
    queryKey: ["search", dq],
    queryFn: () => search(dq),
    enabled: open && dq.length >= 2,
    staleTime: 30_000,
    retry: false,
  });

  const actions: Item[] = useMemo(() => [
    { id: "estimate", label: "Calculate Project Scope", hint: "Action", href: "/estimator", icon: <Calculator size={16} className="text-cyan" /> },
    { id: "book", label: "Book Discovery Call", hint: "Action", href: "/contact#book", icon: <Phone size={16} className="text-emerald" /> },
    { id: "copy", label: "Copy contact email", hint: "Action", run: () => navigator.clipboard?.writeText(siteConfig.email), icon: <Mail size={16} className="text-emerald" /> },
  ], []);

  function go(item: { href?: string; run?: () => void }) {
    setOpen(false);
    if (item.run) item.run();
    else if (item.href) router.push(item.href);
  }

  const row = "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-white/10";
  const group = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-faint";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search and commands"
      overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
      contentClassName="liquid-glass fixed left-1/2 top-[18vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[28px] text-text"
    >
      <div className="flex items-center border-b border-white/10 px-4 py-3">
        <Search size={18} className="mr-3 text-text-muted" aria-hidden />
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder="Search pages, services, or run an action…"
          className="w-full bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
        />
        <kbd className="rounded border border-white/10 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-text-muted">ESC</kbd>
      </div>

      <Command.List className="max-h-[320px] overflow-y-auto p-2">
        <Command.Empty className="p-4 text-center text-xs text-text-muted">
          No matches. Try “estimate”, “air-gapped”, or “ERP”.
        </Command.Empty>

        {remote.data?.results?.length ? (
          <Command.Group heading="Results" className={group}>
            {remote.data.results.map((r) => (
              <Command.Item key={`${r.type}:${r.href}`} value={`${r.title} ${r.subtitle ?? ""}`} onSelect={() => go({ href: r.href })} className={row}>
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
              {a.icon}<span className="flex-1">{a.label}</span><span className="text-xs text-text-faint">{a.hint}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Navigate" className={group}>
          {NAV.map((n) => (
            <Command.Item key={n.id} value={n.label} onSelect={() => go(n)} className={row}>
              {n.icon}<span className="flex-1">{n.label}</span><span className="text-xs text-text-faint">{n.hint}</span>
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
```

Note: `cmdk` filters by `value`; keep `value` equal to the visible label so typing matches what the person sees. Verify `Command.Dialog` accepts `overlayClassName`/`contentClassName` in the installed version; if not, wrap with Radix `Dialog` and put `Command` inside.

---

## 14. Do and Don't

**Do:** keep copy plain and specific; show real interactions (estimator, RAG, parser, diagram); keep glass rare and meaningful; test on mobile; keep bundles small; make every state (loading, empty, error, success) look designed.

**Don't:** add stock photos, brand logos, testimonials, awards, or any statistic that is not marked PLACEHOLDER; use light mode; put glass on every card; add a decorative animation to every section; use gradient text on anything but the hero h1; use all-caps eyebrow labels; write "cutting-edge", "revolutionary", "seamless", "unlock", "supercharge"; re-implement pricing logic in the frontend; use `dangerouslySetInnerHTML`; store personal data in localStorage (the estimator draft goes in `sessionStorage` only and is cleared on submit); hard-code the company name.

---

## 15. Phases and Acceptance Checklists

Copy this list into `PROGRESS.md` and tick as you go. **Stop after each phase and verify before continuing.**

### Phase 0: Scaffold and tokens
- [ ] App created with the Section 6 command; all Section 6 packages installed; shadcn initialized with the listed components
- [ ] `globals.css` from 4.1; fonts configured; `siteConfig` and content files created with PLACEHOLDER comments
- [ ] `cn()`, `format.ts` (+ unit tests), API client, endpoints, types, mocks, providers (React Query, Lenis)
- [ ] `pnpm typecheck && pnpm lint && pnpm build` pass

### Phase 1: Shell
- [ ] Navbar (desktop + mobile sheet), footer, skip link, `SpotlightCard`, `Button`, `Badge`, `Kbd`, `Section`, `Skeleton`
- [ ] Command palette works with `⌘K`, `Ctrl+K`, `/`; static items navigate; remote search merges in when the API is available
- [ ] `not-found.tsx` and `error.tsx` styled per 11.4

### Phase 2: Home
- [ ] Hero matches 8.1.1 (sequence plays once; reduced-motion shows final state; spotlight follows cursor)
- [ ] Metric ribbon, bento, tech switcher, featured work, estimator teaser, footer CTA
- [ ] Synergy stack with GSAP (desktop pinned; mobile/reduced-motion static; layers clickable)
- [ ] Lighthouse mobile performance ≥ 90 on `/` (run it; record the score)

### Phase 3: Services
- [ ] `/services` panels + delivery model; `/services/[slug]` with TOC scroll-spy, Markdown, related work
- [ ] 404 for unknown slugs; skeletons and error states

### Phase 4: Work
- [ ] Filter bar synced to URL; cards with hover/focus expand; touch fallback; skeleton/empty/error states
- [ ] `/work/[slug]` detail with metrics, architecture Markdown, specs

### Phase 5: Estimator
- [ ] Store with sessionStorage persistence; step skipping rules; validation messages
- [ ] Live summary panel (desktop sticky, mobile bottom bar → sheet); debounced, cancelable requests; number count-up
- [ ] Submit flow, error mapping (422/429/other), success screen, store cleared after success
- [ ] Home teaser links into the wizard with `?services=` preselection
- [ ] With the backend (or mocks), the A.4 golden request shows `$18,500 – $27,000` and `6–10 weeks`

### Phase 6: AI Lab
- [ ] Tabs with hash sync and lazy loading
- [ ] RAG simulator (pipeline animation, chunks, typed answer, mode badge, error states)
- [ ] Prompt parser (all result sections, presets)
- [ ] Air-gapped diagram (node highlight, policy panel, BOM accordion)

### Phase 7: About and Contact
- [ ] About page sections; Contact with Cal embed (lazy) or fallback card; form validation, honeypot, success/error states; location card

### Phase 8: Polish and verification
- [ ] SEO: metadata, OG images, sitemap, robots, JSON-LD
- [ ] Accessibility pass: keyboard-only walkthrough of palette, navbar, estimator, tabs, forms; screen-reader labels; contrast check on glass surfaces
- [ ] `prefers-reduced-motion` and `prefers-reduced-transparency` verified
- [ ] Playwright smoke: home loads; `⌘K` opens palette and navigates; estimator completes steps 1→4 with mocks; contact form shows validation errors
- [ ] `docs/CONTENT_TODO.md` lists every PLACEHOLDER; `README.md` explains setup, env vars, `gen:api`, mocking mode

### Final message to the user
Summarize each phase, list placeholders that need real content, list any decisions you made where the prompt was silent, and give the commands to run the site.

---

# Appendix A — API Contract v1 (shared source of truth)

> This appendix is **byte-identical** in the backend and frontend prompts. If anything elsewhere in your prompt conflicts with this appendix, **this appendix wins**. Do not change it unilaterally; if you believe it is wrong, record the issue in `docs/CONTRACT_ISSUES.md` (backend) or `PROGRESS.md` (frontend) and keep going with the contract as written.

## A.1 Conventions

- Base path `/api/v1`. JSON, UTF-8, `snake_case` keys, ISO-8601 UTC timestamps, UUID ids.
- Money is **integer whole US dollars** (never strings, never floats). Durations are **integer weeks**.
- Success envelope: `{ "success": true, ...payload }` (payload keys are listed per endpoint).
- Error envelope: `{ "success": false, "error": { "code": string, "message": string, "details"?: object } }`
- Error codes: `validation_error` (422), `not_found` (404), `rate_limited` (429, with `Retry-After` header and `details.retry_after_seconds`), `unauthorized` (401), `payload_too_large` (413), `ai_unavailable` (503), `internal_error` (500).
- Every response carries `X-Request-ID` (echoed from the request if present, else generated).
- Rate-limit responses also carry `X-RateLimit-Limit` and `X-RateLimit-Remaining`.
- Local dev base URL: `http://localhost:8000`. CORS allows the configured frontend origin(s) only.

## A.2 Endpoints

| Method | Path | Purpose | Rate limit (per IP) |
| :--- | :--- | :--- | :--- |
| GET | `/health` | Liveness: `{ success, status: "ok", version }` | none |
| GET | `/health/ready` | Readiness (DB + Redis): `{ success, status: "ready" \| "degraded", checks: { database: boolean, redis: boolean } }` | none |
| GET | `/services` | List services. Query: `category?` | 120/min |
| GET | `/services/{slug}` | One service with full Markdown content | 120/min |
| GET | `/case-studies` | List. Query: `filter?` (default `all`), `limit?` (default 12, max 50), `offset?` | 120/min |
| GET | `/case-studies/{slug}` | One case study, full detail | 120/min |
| GET | `/hardware-blueprints` | All infrastructure blueprints | 120/min |
| GET | `/hardware-blueprints/{code}` | One blueprint | 120/min |
| POST | `/estimate/calculate` | Stateless price + timeline estimate (nothing stored) | 30/min |
| POST | `/estimate/submit` | Recalculate server-side, store as a lead, trigger notifications | 5 per 10 min |
| POST | `/contact` | Quick contact form submission | 5 per 10 min |
| POST | `/playground/rag-simulation` | AI Lab: RAG demo | 10/min and 100/day |
| POST | `/playground/prompt-parse` | AI Lab: prompt parsing visualizer | 20/min |
| GET | `/search` | Command palette search. Query: `q` (min 2 chars), `limit?` (default 8, max 20) | 60/min |
| POST | `/webhooks/cal` | Backend-only. Cal.com booking webhook (HMAC verified) | none |
| GET / PATCH | `/admin/leads`, `/admin/leads/{id}` | Backend-only. Header `X-Admin-Key` | 60/min |

`filter` values for case studies: `all`, `web`, `erp`, `ai` (match `domains` contains), `hardware`, `hybrid` (match `service_category`).

## A.3 Types (TypeScript notation; the backend mirrors these with Pydantic v2 models)

```ts
type ServiceCategory   = 'web' | 'erp' | 'ai' | 'infrastructure';
type CaseStudyCategory = 'software' | 'hardware' | 'hybrid';
type CaseStudyFilter   = 'all' | 'web' | 'erp' | 'ai' | 'hardware' | 'hybrid';
type EstimatorService  = 'custom_web' | 'erp_custom' | 'ai_solutions'
                       | 'office_networking' | 'local_ai_server' | 'workstation_provisioning';
type AiDeploymentType  = 'cloud' | 'on_premise_airgapped' | 'hybrid' | 'none';
type LeadStatus        = 'new' | 'contacted' | 'discovery_booked' | 'closed';

interface ServiceSummary {
  id: string; slug: string; title: string; category: ServiceCategory;
  short_description: string; technologies_used: string[]; is_featured: boolean;
}
interface Service extends ServiceSummary {
  full_content: string;            // Markdown (GFM). Headings use ##/###. No raw HTML.
  created_at: string; updated_at: string;
}

interface MetricItem { key: string; label: string; value: string } // label = humanized key, e.g. "Latency reduction"
interface CaseStudySummary {
  id: string; slug: string; title: string; client_industry: string;
  service_category: CaseStudyCategory; domains: ServiceCategory[];
  headline_metrics: MetricItem[];  // first two metrics
  software_stack: string[]; cover_image_url: string | null;
}
interface CaseStudy extends CaseStudySummary {
  problem_statement: string;       // plain text / light Markdown
  solution_architecture: string;   // Markdown (GFM)
  metrics: MetricItem[];
  hardware_specs: Record<string, string>;
  created_at: string;
}

interface NetworkZone { id: string; name: string; vlan: number | null; purpose: string; egress: 'none' | 'restricted' | 'open' }
interface NetworkLink { from: string; to: string; policy: string }
interface BomItem     { item: string; quantity: number; notes?: string }
interface HardwareBlueprint {
  blueprint_code: string; tier_name: string;
  network_architecture: { zones: NetworkZone[]; links: NetworkLink[] };
  hardware_bom: BomItem[]; recommended_software_integrations: string[];
  base_estimated_cost: number;     // indicative "from" price, whole USD
}

interface Range { min: number; max: number }
interface EstimateRequest {
  selected_services: EstimatorService[];                 // 1..6, unique
  office_parameters?: {
    workstations: number;                                // 0..500
    floor_area_sqft: number;                             // 0..200000
    require_server_rack: boolean;
    air_gapped_security: boolean;
  };
  software_parameters?: {
    user_roles_count: number;                            // 0..50
    third_party_integrations: string[];                  // 0..10 items, lowercase slug, <=40 chars
  };
}
interface EstimateResult {
  cost_range_usd: Range;
  timeline_weeks: Range;
  breakdown: {                                           // a key is present only when its range is non-zero
    software_development?: Range;
    hardware_and_networking?: Range;
    on_prem_ai_setup?: Range;
  };
  recommended_blueprint: string | null;                  // e.g. "BLUEPRINT-AIRGAP-25"
  ai_deployment_type: AiDeploymentType;
  assumptions: string[];
  pricing_version: string;
}
// POST /estimate/calculate  ->  { success: true, estimate: EstimateResult }

interface LeadSubmitRequest {
  client_name: string;             // 2..120
  client_email: string;            // valid email
  company_name?: string; phone_number?: string; notes?: string; // notes <= 2000
  estimate_input: EstimateRequest;
  consent: true;                   // must be literally true
  website?: string;                // honeypot: real users leave it empty/absent
}
// POST /estimate/submit -> { success: true, lead_id: string, status: LeadStatus,
//                            estimate: EstimateResult, booking_url: string | null }

interface ContactRequest {
  name: string; email: string; company?: string;
  topic?: 'software' | 'erp' | 'ai' | 'infrastructure' | 'other';
  message: string;                 // 10..2000
  consent: true; website?: string; // honeypot
}
// POST /contact -> { success: true, submission_id: string }

interface RagRequest { query: string /* 3..300 chars */; top_k?: number /* 1..5, default 2 */ }
interface RagChunk   { source: string; score: number /* 0..1 */; chunk: string }
interface PipelineStage {
  stage: 'embed_query' | 'vector_search' | 'rerank' | 'prompt_assembly' | 'generation';
  duration_ms: number; detail: string;
}
interface RagResponse {
  success: true; retrieved_chunks: RagChunk[]; llm_response: string;
  pipeline: PipelineStage[]; total_ms: number;
  mode: 'live' | 'cached' | 'fallback';                  // fallback = lexical retrieval + extractive answer
}

interface PromptParseRequest { prompt: string /* 3..500 chars */ }
interface PromptParseResponse {
  success: true;
  tokens: { text: string; kind: 'word' | 'number' | 'symbol' | 'entity' | 'keyword' }[];
  intent: { label: string; confidence: number /* 0..1 */ };
  entities: { text: string; type: 'hardware' | 'network' | 'software' | 'compliance' | 'quantity' }[];
  guardrails: { rule: string; passed: boolean; note: string }[];
  routing: { target: 'local_air_gapped_model' | 'cloud_model' | 'blocked'; reason: string };
}

interface SearchResult {
  type: 'service' | 'case_study' | 'page' | 'action';
  title: string; subtitle: string | null; href: string;
}
// GET /search -> { success: true, results: SearchResult[] }

// List/detail payload keys
// GET /services              -> { success, services: ServiceSummary[] }
// GET /services/{slug}       -> { success, service: Service }
// GET /case-studies          -> { success, case_studies: CaseStudySummary[], total: number }
// GET /case-studies/{slug}   -> { success, case_study: CaseStudy }
// GET /hardware-blueprints   -> { success, blueprints: HardwareBlueprint[] }
// GET /hardware-blueprints/{code} -> { success, blueprint: HardwareBlueprint }
```

## A.4 Golden example (both sides must reproduce this exactly)

Request to `POST /estimate/calculate`:

```json
{
  "selected_services": ["custom_web", "erp_custom", "office_networking", "local_ai_server"],
  "office_parameters": { "workstations": 25, "floor_area_sqft": 3500, "require_server_rack": true, "air_gapped_security": true },
  "software_parameters": { "user_roles_count": 4, "third_party_integrations": ["stripe", "salesforce"] }
}
```

Response `estimate` (the `assumptions` wording may vary; every other field is exact):

```json
{
  "cost_range_usd": { "min": 18500, "max": 27000 },
  "timeline_weeks": { "min": 6, "max": 10 },
  "breakdown": {
    "software_development":    { "min": 12000, "max": 16000 },
    "hardware_and_networking": { "min": 4000,  "max": 6000 },
    "on_prem_ai_setup":        { "min": 2500,  "max": 5000 }
  },
  "recommended_blueprint": "BLUEPRINT-AIRGAP-25",
  "ai_deployment_type": "on_premise_airgapped",
  "pricing_version": "2026-10-v1"
}
```

