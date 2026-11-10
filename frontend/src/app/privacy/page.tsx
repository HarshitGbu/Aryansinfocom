import type { JSX } from "react";
import { baseMetadata } from "@/lib/seo";
import { siteConfig } from "@/content/site";

export const metadata = baseMetadata({
  title: "Privacy Policy",
  description:
    "How Aryans Infocom collects, uses, and protects your personal data on this website.",
  path: "/privacy",
});

interface SectionBody {
  key: number;
  el: JSX.Element;
}

interface Section {
  id: string;
  heading: string;
  body: SectionBody[];
}

let n = 0;
function b(el: JSX.Element): SectionBody {
  n += 1;
  return { key: n, el };
}

const sections: Section[] = [
  {
    id: "introduction",
    heading: "Introduction and scope",
    body: [
      b(
        <p>
          This policy describes how {siteConfig.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
          collects, uses, and protects personal data when you use this website and its related
          services: the contact form, discovery call booking, the cost estimator, and the AI
          Lab and RAG simulator demos.
        </p>
      ),
      b(<p>This Privacy Policy is effective as of 9 November 2026.</p>),
    ],
  },
  {
    id: "directly-collected",
    heading: "Information we collect directly from you",
    body: [
      b(<p>When you contact us, we receive the details you choose to share:</p>),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Company name</li>
          <li>Project details, such as scope, requirements, or notes</li>
        </ul>
      ),
      b(
        <p>
          We collect these through the contact form, discovery call booking, and the estimator.
          We do not collect information you do not provide.
        </p>
      ),
    ],
  },
  {
    id: "automatically-collected",
    heading: "Information collected automatically",
    body: [
      b(
        <p>
          When you visit the site, our hosting provider (Vercel) and any analytics we enable
          may automatically record standard server log and analytics data:
        </p>
      ),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Device type</li>
          <li>Pages visited and the pages you arrived from</li>
          <li>Date and time of each visit</li>
        </ul>
      ),
    ],
  },
  {
    id: "cookies",
    heading: "Cookies and similar technologies",
    body: [
      b(
        <p>
          The site may use cookies and similar technologies for three purposes: essential
          (required for the site to function), analytics (to understand aggregate usage), and
          preferences (to remember your settings).
        </p>
      ),
      b(
        <p>
          You can disable cookies in your browser settings. Disabling essential cookies may
          affect some features of the site.
        </p>
      ),
    ],
  },
  {
    id: "ai-lab-data",
    heading: "AI Lab and RAG simulator data",
    body: [
      b(
        <p>
          Prompts, queries, and files you submit to the AI Lab or RAG simulator demos run in
          your browser session and are not retained by us after you leave the page. Demo
          inputs are not stored, logged for our own purposes, or used to train models.
        </p>
      ),
      b(
        <p>
          Please do not enter confidential, proprietary, or personal data into the demos. The
          underlying AI models are provided by third-party API providers and are subject to
          their own privacy policies.
        </p>
      ),
    ],
  },
  {
    id: "estimator-inputs",
    heading: "Estimator inputs",
    body: [
      b(
        <p>
          The services you select and the project scope details you enter in the estimator are
          stored temporarily in your browser&rsquo;s session storage so the calculation
          survives a page refresh. They are not sent to us unless you complete the contact step
          and submit the form.
        </p>
      ),
      b(
        <p>
          If you submit the estimator form, the scope details are sent to us together with
          your contact details and are linked to that enquiry record, so we can follow up with
          an accurate quote.
        </p>
      ),
    ],
  },
  {
    id: "purposes",
    heading: "Purposes of processing",
    body: [
      b(<p>We use the data we collect to:</p>),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Respond to your enquiries and messages</li>
          <li>Schedule and conduct discovery calls</li>
          <li>Prepare estimates and quotes for your project</li>
          <li>Improve the website and its services</li>
          <li>Maintain security and prevent abuse</li>
          <li>Comply with legal and regulatory obligations</li>
        </ul>
      ),
    ],
  },
  {
    id: "legal-basis",
    heading: "Legal basis and consent",
    body: [
      b(
        <p>
          By submitting a form on this website, you give us consent to process the personal
          data you provide for the purposes stated in this policy. In addition, we rely on our
          legitimate interests in operating the website, responding to enquiries, and
          improving our services. You may withdraw your consent at any time by contacting us.
        </p>
      ),
    ],
  },
  {
    id: "client-project-data",
    heading: "Client project data",
    body: [
      b(
        <p>
          Data we handle during active client engagements (ERP implementations, AI projects,
          infrastructure builds) is governed by the separate service agreement or data
          processing agreement in place for that engagement, not by this website policy. This
          policy covers only data collected through this website.
        </p>
      ),
    ],
  },
  {
    id: "third-party-services",
    heading: "Third-party services and processors",
    body: [
      b(<p>We use the following third-party services to operate this website:</p>),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Vercel</strong> — website hosting and server logs
          </li>
          <li>
            <strong>Web3Forms</strong> — delivery of contact form submissions to us
          </li>
          <li>
            <strong>Cal.com</strong> — discovery call scheduling (used when booking is
            enabled)
          </li>
          <li>
            <strong>Cloud providers such as AWS or Cloudflare</strong> — supporting
            infrastructure where used
          </li>
        </ul>
      ),
      b(
        <p>
          Each provider processes data on our behalf under its own terms. We select providers
          that commit to protecting the personal data they handle for us.
        </p>
      ),
    ],
  },
  {
    id: "data-sharing",
    heading: "Data sharing and disclosure",
    body: [
      b(
        <p>
          We do not sell your personal data. We share personal data only with:
        </p>
      ),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The service providers listed above, to the extent needed to operate the site</li>
          <li>Legal authorities where required by law or a valid legal process</li>
          <li>A successor in the event of a business transfer, subject to applicable law</li>
        </ul>
      ),
    ],
  },
  {
    id: "international-transfers",
    heading: "International data transfers",
    body: [
      b(
        <p>
          This website is hosted on Vercel, whose infrastructure may process data on servers
          located outside India. Where personal data is transferred internationally, we rely
          on the transfer safeguards made available by our providers, such as standard
          contractual clauses or equivalent contractual protections, in line with applicable
          data protection law.
        </p>
      ),
    ],
  },
  {
    id: "retention",
    heading: "Data retention",
    body: [
      b(
        <p>
          We keep enquiry and call-booking records for as long as needed to respond to you and
          provide the services you requested, and for a reasonable period thereafter for
          record-keeping and legal compliance. Server log data is retained only as long as
          required by our hosting provider&rsquo;s standard retention settings. We delete
          personal data when it is no longer needed for the purposes described in this policy.
        </p>
      ),
    ],
  },
  {
    id: "security",
    heading: "Data security measures",
    body: [
      b(
        <p>
          We protect personal data with encryption in transit (HTTPS), access controls that
          restrict who can view or manage your data, and secure hosting on an established
          platform.
        </p>
      ),
      b(
        <p>
          No system is completely secure. We cannot guarantee absolute security, but we apply
          reasonable technical and organizational measures to protect your data.
        </p>
      ),
    ],
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: [
      b(
        <p>
          Under the Digital Personal Data Protection Act, 2023, and where applicable under the
          EU GDPR, you have the right to:
        </p>
      ),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request erasure of your data</li>
          <li>Withdraw consent at any time</li>
          <li>Make a nomination to exercise your rights after your death</li>
          <li>
            Raise a grievance with our Grievance Officer, or with the Data Protection Board of
            India or the relevant EU supervisory authority
          </li>
        </ul>
      ),
      b(
        <p>
          To exercise any of these rights, contact us using the details in the section below.
          We will respond within the timeframes required by applicable law.
        </p>
      ),
    ],
  },
  {
    id: "childrens-privacy",
    heading: "Children's privacy",
    body: [
      b(
        <p>
          This website is not directed at individuals under the age of 18. We do not knowingly
          collect personal data from anyone under 18. If you believe a child has submitted data
          to us, please contact us and we will delete it.
        </p>
      ),
    ],
  },
  {
    id: "third-party-links",
    heading: "Third-party links",
    body: [
      b(
        <p>
          This website may contain links to external sites. We are not responsible for the
          privacy practices or content of those sites. We encourage you to read their privacy
          policies before providing any personal data.
        </p>
      ),
    ],
  },
  {
    id: "marketing",
    heading: "Marketing communications",
    body: [
      b(
        <p>
          We send marketing or promotional communications only when you have opted in, such as
          when you agree to be contacted through a form on this site. You can unsubscribe at
          any time by replying to any marketing email or contacting us at{" "}
          <a className="underline" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
          .
        </p>
      ),
    ],
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: [
      b(
        <p>
          We may update this policy from time to time. When we do, we will update the
          &ldquo;Last updated&rdquo; date at the top of this page, and material changes will
          be posted here. We encourage you to review this policy periodically.
        </p>
      ),
    ],
  },
  {
    id: "contact",
    heading: "Contact and grievance officer",
    body: [
      b(
        <p>
          Questions about this policy, or any data protection concern, can be directed to:
        </p>
      ),
      b(
        <address>
          <a className="underline" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
          <br />
          <a className="underline" href={`tel:+91${siteConfig.phone.replace(/\s/g, "")}`}>
            +91 {siteConfig.phone}
          </a>
          <br />
          Grievance Officer, {siteConfig.name}
        </address>
      ),
    ],
  },
];

export default function PrivacyPage(): React.JSX.Element {
  return (
    <main className="pt-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <article>
          <header>
            <h1 className="text-4xl font-semibold">Privacy Policy</h1>
            <p className="mt-3 text-text-muted">Last updated: 9 November 2026</p>
          </header>

          <nav aria-label="Table of contents" className="mt-10 max-w-[65ch]">
            <ol className="grid gap-y-1.5 text-sm md:grid-cols-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-text-muted underline decoration-white/30 underline-offset-4 hover:text-text"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((s) => (
            <section key={s.id} aria-labelledby={s.id} className="mt-14 max-w-[65ch]">
              <h2 id={s.id} className="text-2xl font-semibold">
                {s.heading}
              </h2>
              <div className="mt-4 space-y-4 text-text-muted">
                {s.body.map(({ key, el }) => (
                  <div key={key}>{el}</div>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
