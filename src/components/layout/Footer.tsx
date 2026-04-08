import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Webster", href: "/webster" },
  { label: "District", href: "/district" },
  { label: "Collective", href: "/collective" },
  { label: "Watch", href: "/watch" },
];

const PLATFORM_LINKS = [
  { label: "Dashboard", href: "/login" },
  { label: "Documentation", href: "/docs" },
  { label: "Download Webster", href: "/download/webster" },
];

const COMPANY_LINKS = [
  { label: "TMRW Group", href: "https://tmrwgroup.ai/", external: true },
  { label: "Products", href: "https://tmrwgroup.ai/products", external: true },
  { label: "Team", href: "https://tmrwgroup.ai/team", external: true },
  { label: "Contact", href: "mailto:contact@tmrwgroup.ai", external: true },
];

export default function Footer() {
  return (
    <footer className="vf-site-footer">
      <div className="vf-site-footer-inner">
        <div className="vf-site-footer-grid">
          {/* Brand */}
          <div className="vf-site-footer-brand">
            <Link href="/" className="vf-site-footer-logo">
              <span>Venture Factory</span>
              <small>by TMRW Group</small>
            </Link>
            <p className="vf-site-footer-tagline">
              The agentic AI platform. Build, deploy, and operate AI agents that
              execute real work inside your tools.
            </p>
          </div>

          {/* Products */}
          <div className="vf-site-footer-col">
            <h4>Products</h4>
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Platform */}
          <div className="vf-site-footer-col">
            <h4>Platform</h4>
            {PLATFORM_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div className="vf-site-footer-col">
            <h4>Company</h4>
            {COMPANY_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="vf-site-footer-bottom">
          <p>&copy; {new Date().getFullYear()} TMRW Group. All rights reserved.</p>
          <p>
            <a
              href="https://tmrwgroup.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              tmrwgroup.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
