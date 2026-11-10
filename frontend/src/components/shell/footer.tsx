import Link from "next/link";
import { siteConfig } from "@/content/site";

export function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div>
          <h2 className="mb-4 text-sm font-semibold">Services</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/services/web-apps" className="hover:text-text">Web apps</Link></li>
            <li><Link href="/services/erp-systems" className="hover:text-text">ERP systems</Link></li>
            <li><Link href="/services/ai-solutions" className="hover:text-text">AI solutions</Link></li>
            <li><Link href="/services/infrastructure" className="hover:text-text">Infrastructure</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold">Company</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/about" className="hover:text-text">About</Link></li>
            <li><Link href="/work" className="hover:text-text">Work</Link></li>
            <li><Link href="/contact" className="hover:text-text">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold">Tools</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/estimator" className="hover:text-text">Estimator</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold">Contact</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><a href={`mailto:${siteConfig.email}`} className="hover:text-text">{siteConfig.email}</a></li>
            <li><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="hover:text-text">{siteConfig.phone}</a></li>
            <li><Link href="/contact#book" className="hover:text-text">Book Discovery Call</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-text-faint md:flex-row md:items-center md:justify-between md:px-8">
          <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-text">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text">Terms &amp; Conditions</Link>
            <span>Press ⌘K to search</span>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
