import type { JSX } from "react";
import { baseMetadata } from "@/lib/seo";
import { siteConfig } from "@/content/site";

export const metadata = baseMetadata({
  title: "Terms and Conditions",
  description:
    "The terms that govern use of the Aryans Infocom website and its services, including the estimator and client engagements.",
  path: "/terms",
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
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: [
      b(
        <p>
          By accessing or using this website, and by engaging {siteConfig.name} (the{" "}
          &ldquo;Company&rdquo;) for any services, you agree to be bound by these Terms and
          Conditions. If you do not agree with them, do not use the website or our services.
        </p>
      ),
      b(
        <p>
          These Terms apply to every visitor and user of the website, including anyone who
          submits the contact form, books a discovery call, or uses the estimator.
        </p>
      ),
    ],
  },
  {
    id: "definitions",
    heading: "Definitions",
    body: [
      b(<p>The following terms have the meanings given here throughout these Terms:</p>),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Company</strong> — {siteConfig.name}, the business that operates the
            Website and provides the Services.
          </li>
          <li>
            <strong>User</strong> — any individual who visits or uses the Website.
          </li>
          <li>
            <strong>Client</strong> — a User or organization that enters into a written
            agreement with the Company for Services.
          </li>
          <li>
            <strong>Services</strong> — the professional and technical services offered by
            the Company, including web applications, ERP systems, AI tools, and
            infrastructure and hardware services.
          </li>
          <li>
            <strong>Website</strong> — this website, including all of its pages, tools, and
            demos.
          </li>
        </ul>
      ),
    ],
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: [
      b(
        <p>
          You must be at least 18 years old and legally capable of entering into a binding
          contract to use the Website or to engage the Company&rsquo;s Services. By using the
          Website you represent that this is the case. If you use the Website on behalf of an
          organization, you also represent that you are authorized to bind that organization
          to these Terms.
        </p>
      ),
    ],
  },
  {
    id: "services",
    heading: "Description of services",
    body: [
      b(
        <p>
          The Company provides four families of services: web application development; ERP
          and business systems; AI tools and integrations; and IT infrastructure and hardware
          services, including network design, installation, and support.
        </p>
      ),
      b(
        <p>
          We may add, modify, or discontinue services from time to time, and we may change
          how a service is delivered, without notice.
        </p>
      ),
    ],
  },
  {
    id: "no-contract-by-browsing",
    heading: "No contract by browsing",
    body: [
      b(
        <p>
          Browsing the Website, viewing service pages and case studies, or using the
          estimator does not create a service agreement, offer, or binding commitment on
          either side. The website content is informational only.
        </p>
      ),
      b(
        <p>
          A service agreement exists only when a written proposal or Statement of Work
          (&ldquo;SOW&rdquo;) has been agreed and signed by both parties.
        </p>
      ),
    ],
  },
  {
    id: "estimator",
    heading: "Estimator disclaimer",
    body: [
      b(
        <p>
          Cost and timeline figures produced by the estimator are indicative planning ranges
          based on typical projects of a similar scope. They are not quotes, cost estimates,
          or commitments to deliver anything.
        </p>
      ),
      b(
        <p>
          Final pricing and schedules are always set in a written proposal or SOW, after we
          have discussed your specific requirements.
        </p>
      ),
    ],
  },
  {
    id: "engagement",
    heading: "Engagement process",
    body: [
      b(
        <p>
          Engagements follow a standard process: a discovery call to understand your goals
          and constraints; a written proposal covering scope, approach, and indicative cost;
          a Statement of Work that fixes scope, milestones, and price; and the signing of the
          SOW and any applicable agreement.
        </p>
      ),
      b(<p>No work begins until the SOW and agreement are signed by both parties.</p>),
    ],
  },
  {
    id: "payment",
    heading: "Payment terms",
    body: [
      b(
        <p>
          Fees are set out in the applicable SOW. Payment is typically made in milestones,
          with an advance payment due on signing and the balance invoiced as milestones are
          completed.
        </p>
      ),
      b(
        <p>
          Invoices are payable within 30 days of receipt. Overdue amounts accrue late fees at
          18% per annum. All prices are exclusive of taxes, and goods and services tax
          (GST) is charged at the prevailing rate where applicable.
        </p>
      ),
      b(
        <p>
          Refunds are available only for unused advance or milestone amounts where no work
          has started on that portion, net of amounts for work already performed. Cancellation
          terms for any engagement are set out in the applicable SOW or agreement.
        </p>
      ),
    ],
  },
  {
    id: "client-responsibilities",
    heading: "Client responsibilities",
    body: [
      b(
        <p>
          To complete an engagement on schedule, the Client will: provide timely access to
          systems, environments, and personnel; supply the content, data, and materials we
          need; give approvals in a timely manner; and provide requirements that are
          accurate to the best of its knowledge.
        </p>
      ),
      b(
        <p>
          Delays caused by late access, content, approvals, or requirements on the
          Client&rsquo;s side may shift the project timeline accordingly.
        </p>
      ),
    ],
  },
  {
    id: "scope-changes",
    heading: "Scope changes",
    body: [
      b(
        <p>
          Changes to the agreed scope — additions, removals, or modifications — must be
          requested in writing and are accepted through a change order that records the effect
          on cost and schedule. We are not bound by verbal change requests.
        </p>
      ),
      b(
        <p>
          An approved change order may affect the project&rsquo;s cost, timeline, or both.
        </p>
      ),
    ],
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    body: [
      b(
        <p>
          Upon receipt of full payment for a deliverable, ownership of that deliverable passes
          to the Client, subject to any license terms in the applicable agreement.
        </p>
      ),
      b(
        <p>
          The Company retains ownership of its pre-existing tools, frameworks, and know-how,
          and of anything created for other engagements. Where pre-existing material is used
          in a deliverable, the Client receives a non-exclusive license to use it as part of
          that deliverable. Third-party and open-source components are covered by their own
          licences, as described below.
        </p>
      ),
    ],
  },
  {
    id: "third-party-components",
    heading: "Third-party and open-source components",
    body: [
      b(
        <p>
          Our services and deliverables may include third-party and open-source components,
          including frameworks and tools such as Next.js, PostgreSQL, and vLLM. These
          components are licensed by their respective owners, and their published licence
          terms apply in full.
        </p>
      ),
      b(
        <p>
          Where a component&rsquo;s licence imposes obligations (for example, source
          availability or attribution), those terms are disclosed in the applicable
          documentation and prevail over any conflicting term in these Terms.
        </p>
      ),
    ],
  },
  {
    id: "confidentiality",
    heading: "Confidentiality",
    body: [
      b(
        <p>
          Each party agrees to protect the other&rsquo;s non-public information disclosed in
          connection with an engagement — business plans, technical details, data, and
          pricing — and to use it only for the purposes of that engagement. This does not
          apply to information that is public, already known, independently developed, or
          required to be disclosed by law.
        </p>
      ),
      b(
        <p>
          If you require a more detailed confidentiality commitment before a discovery call
          or proposal, a mutual non-disclosure agreement (NDA) is available on request.
        </p>
      ),
    ],
  },
  {
    id: "hardware",
    heading: "Hardware and infrastructure terms",
    body: [
      b(
        <p>
          For infrastructure and hardware services, the Client will provide safe site access
          and complete any site survey we request before work is scheduled. Installation
          responsibilities — mounting, cabling, power, and similar — are set out in the
          applicable proposal or SOW.
        </p>
      ),
      b(
        <p>
          Equipment ownership follows the terms of the order, and manufacturer warranty
          terms (for example, those of Cisco or Ubiquiti) apply as published by the
          respective manufacturers. Risk of loss passes in line with the delivery terms of
          the applicable order, and we recommend that the Client insure equipment from
          delivery.
        </p>
      ),
    ],
  },
  {
    id: "ai-disclaimers",
    heading: "AI-specific disclaimers",
    body: [
      b(
        <p>
          AI systems can produce outputs that are inaccurate, incomplete, or out of date.
          Model outputs — including any produced by the Company&rsquo;s AI tools or by the
          demos on the Website — are not professional, legal, or business advice, and should
          be treated as a starting point rather than a final answer.
        </p>
      ),
      b(
        <p>
          The Client is responsible for reviewing and validating AI outputs before relying
          on them in production or in decision-making. We do not guarantee the performance or
          accuracy of any AI component or model, and we are not liable for losses arising
          from uncritical reliance on model outputs.
        </p>
      ),
    ],
  },
  {
    id: "support",
    heading: "Support, maintenance and service levels",
    body: [
      b(
        <p>
          Support, maintenance, and service-level commitments — including warranty periods,
          support scope, and response times — are defined in the individual contract or SOW
          for each engagement.
        </p>
      ),
      b(
        <p>
          Where a service-level agreement (SLA) applies, its terms, measurement method, and
          remedies govern. General website features, such as the estimator, are provided on a
          best-effort basis without an SLA.
        </p>
      ),
    ],
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: [
      b(<p>When using the Website, you agree not to:</p>),
      b(
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Use it for any unlawful purpose</li>
          <li>
            Attempt to breach the security of the Website, its systems, or its data
          </li>
          <li>
            Scrape, harvest, or reverse-engineer the Website, its content, or its tools
          </li>
          <li>
            Abuse the estimator or any other Website feature, including through
            automated or excessive use that degrades service for others
          </li>
          <li>
            Use it to transmit malware or to infringe the rights of others
          </li>
        </ul>
      ),
      b(<p>We may restrict or terminate access for use that violates this section.</p>),
    ],
  },
  {
    id: "availability",
    heading: "Website availability",
    body: [
      b(
        <p>
          We work to keep the Website available, but we do not guarantee uninterrupted,
          error-free, or timely access. Parts of the Website may be unavailable for
          maintenance or upgrades, with or without notice.
        </p>
      ),
    ],
  },
  {
    id: "warranty-disclaimer",
    heading: "Disclaimer of warranties",
    body: [
      b(
        <p>
          To the maximum extent permitted by law, the Website, its content, and all demos are
          provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of
          any kind, whether express or implied, including merchantability, fitness for a
          particular purpose, or non-infringement.
        </p>
      ),
    ],
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: [
      b(
        <p>
          To the maximum extent permitted by law, neither party will be liable to the other
          for indirect, incidental, special, or consequential damages, or for lost profits,
          revenue, data, or goodwill, even if advised of the possibility of such damages.
        </p>
      ),
      b(
        <p>
          Our aggregate liability arising out of or relating to an engagement will not exceed
          the total fees you paid or are required to pay us for the services to which the
          claim relates.
        </p>
      ),
    ],
  },
  {
    id: "indemnification",
    heading: "Indemnification",
    body: [
      b(
        <p>
          You, as a User, or your organization, as a Client, will indemnify and hold the
          Company harmless from claims, losses, and reasonable legal costs arising from your
          misuse of the Website, from content you submit to us, or from your breach of these
          Terms.
        </p>
      ),
    ],
  },
  {
    id: "force-majeure",
    heading: "Force majeure",
    body: [
      b(
        <p>
          Neither party is liable for delay or failure to perform caused by events beyond its
          reasonable control, including natural disasters, power or internet failures, war,
          sanctions, government action, and supply-chain delays affecting hardware
          availability.
        </p>
      ),
      b(
        <p>
          The affected party will notify the other promptly and resume performance when the
          cause is resolved. If a force majeure event continues for more than 60 days, either
          party may terminate the affected engagement by written notice, with payment for
          work already completed.
        </p>
      ),
    ],
  },
  {
    id: "termination",
    heading: "Termination",
    body: [
      b(
        <p>
          Either party may terminate an engagement for material breach that is not remedied
          within 30 days of written notice, or for convenience on 30 days&rsquo; written
          notice, subject to the payment terms below.
        </p>
      ),
      b(
        <p>
          On termination, the Client pays for all work completed and non-cancellable
          commitments up to the effective date of termination, and the Company hands over
          deliverables for which full payment has been received. Sections that should survive
          by their nature — intellectual property, confidentiality, indemnification,
          limitation of liability, and dispute resolution — survive termination.
        </p>
      ),
    ],
  },
  {
    id: "third-party-links",
    heading: "Third-party links and services",
    body: [
      b(
        <p>
          The Website and our communications may include links to, or integrations with,
          third-party sites and services. We do not control and are not responsible for the
          content, availability, or practices of those external sites or services, and their
          use is at your own risk.
        </p>
      ),
    ],
  },
  {
    id: "portfolio",
    heading: "Portfolio and publicity",
    body: [
      b(
        <p>
          We may reference a Client&rsquo;s name, logo, and project in case studies,
          portfolios, and marketing materials. If you do not want your name or project used
          in this way, please tell us in writing before or during the engagement, and we will
          respect that objection.
        </p>
      ),
    ],
  },
  {
    id: "governing-law",
    heading: "Governing law and jurisdiction",
    body: [
      b(
        <p>
          These Terms and any engagement are governed by the laws of India, without regard to
          conflict-of-law rules. The courts at New Delhi, India have jurisdiction over
          disputes that the parties have not referred to arbitration.
        </p>
      ),
      b(
        <p>
          Any dispute arising out of or in connection with an engagement may, at the written
          request of either party, be referred to and finally settled by a sole arbitrator
          appointed by mutual agreement of the parties, with the seat of arbitration at New
          Delhi, India.
        </p>
      ),
    ],
  },
  {
    id: "disputes",
    heading: "Dispute resolution",
    body: [
      b(
        <p>
          The parties will first attempt to resolve any dispute through good-faith
          negotiation between senior representatives.
        </p>
      ),
      b(
        <p>
          If negotiation does not resolve the dispute within 30 days, either party may
          initiate mediation or refer the dispute to arbitration under the Arbitration and
          Conciliation Act, 1996, at New Delhi. Arbitration is the exclusive remedy except
          for urgent interim relief, or for matters the parties have agreed to litigate.
        </p>
      ),
    ],
  },
  {
    id: "general",
    heading: "Severability, entire agreement and waiver",
    body: [
      b(
        <p>
          If any provision of these Terms is held unenforceable, the remaining provisions
          stay in full force and effect, and the parties will replace the unenforceable
          provision with a valid one that most closely reflects the original intent.
        </p>
      ),
      b(
        <p>
          These Terms, together with any applicable SOW or agreement, form the entire
          agreement between the parties on their subject matter and supersede earlier
          discussions. A waiver of any term is effective only if in writing, and a waiver
          does not waive any later breach.
        </p>
      ),
    ],
  },
  {
    id: "amendments",
    heading: "Amendments",
    body: [
      b(
        <p>
          The Company may modify these Terms from time to time. The effective date shown at
          the top of this page reflects the current version. If a modification is material
          for an ongoing engagement, the Company will notify the Client in writing.
        </p>
      ),
    ],
  },
  {
    id: "contact",
    heading: "Contact information",
    body: [
      b(<p>Questions about these Terms can be directed to:</p>),
      b(
        <address>
          {siteConfig.name}
          <br />
          {siteConfig.address}
          <br />
          <a className="underline" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
          <br />
          <a className="underline" href={`tel:+91${siteConfig.phone.replace(/\s/g, "")}`}>
            +91 {siteConfig.phone}
          </a>
        </address>
      ),
    ],
  },
];

export default function TermsPage(): React.JSX.Element {
  return (
    <main className="pt-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <article>
          <header>
            <h1 className="text-4xl font-semibold">Terms and Conditions</h1>
            <p className="mt-3 text-text-muted">Effective date: 11 November 2026</p>
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
