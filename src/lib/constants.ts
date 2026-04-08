export const NAV_ITEMS = [
  { label: "Billing", href: "/billing", icon: "credit-card" },
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Agents", href: "/agents", icon: "bot" },
  { label: "New Agent", href: "/create", icon: "plus-circle" },
  { label: "Projects", href: "/projects", icon: "folder-kanban" },
  { label: "Skills", href: "/skills", icon: "sparkles" },
  { label: "Memory", href: "/memory", icon: "database" },
  { label: "Scheduler", href: "/scheduler", icon: "calendar-clock" },
  { label: "Multi-Agent", href: "/multi-agent", icon: "network" },
  { label: "Integrations", href: "/integrations", icon: "plug-zap" },
  { label: "Voice", href: "/voice", icon: "mic" },
  { label: "Docs", href: "/docs", icon: "book" },
] as const;

export const TEAM_ROLES = [
  { id: "STRATEGY", label: "Strategy", name: "Edward", color: "var(--gold)" },
  { id: "INFRA", label: "Infrastructure", name: "Animesh", color: "var(--teal)" },
  { id: "GTM", label: "GTM / Design", name: "Ronnie", color: "var(--orange)" },
  { id: "TOOLING", label: "Engineering", name: "Zach", color: "var(--blue)" },
] as const;

export const PHASE_COLORS = {
  ideate: "var(--gold)",
  scaffold: "var(--teal)",
  build: "var(--pink)",
  launch: "var(--blue)",
} as const;

export const TEMPLATE_CATEGORIES = [
  { id: "ventures", label: "TMRW Ventures" },
  { id: "projects", label: "General Projects" },
] as const;
