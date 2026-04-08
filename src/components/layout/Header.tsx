"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  title: string;
  description?: string;
}

const HEADER_LINKS = [
  { label: "Webster", href: "/webster", openInNewTab: true },
  { label: "Collective", href: "/collective", openInNewTab: true },
  { label: "District", href: "/district", openInNewTab: true },
  { label: "Watch", href: "/watch", openInNewTab: true },
  { label: "TMRW Home", href: "https://tmrwgroup.ai/", openInNewTab: true },
] as const;

export default function Header({ title, description }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="vf-header">
      <div>
        <h1 className="vf-title">{title}</h1>
        {description && (
          <p className="vf-kicker" style={{ marginTop: 4 }}>
            {description}
          </p>
        )}
      </div>

      {/* Quick links */}
      <div className="vf-row" style={{ gap: "var(--space-1)" }}>
        {HEADER_LINKS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="vf-button-ghost"
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
            style={{
              padding: "0.35rem 0.6rem",
              fontSize: "var(--text-xs)",
              borderRadius: "var(--vf-radius-xs)",
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              background: isActive
                ? "color-mix(in srgb, var(--teal) 10%, var(--bg-card))"
                : "transparent",
              border: isActive
                ? "1px solid color-mix(in srgb, var(--teal) 26%, var(--border))"
                : "1px solid transparent",
              fontWeight: isActive ? 600 : 400,
            }}
          >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
