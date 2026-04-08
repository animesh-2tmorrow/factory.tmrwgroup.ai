"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Bot,
  Brain,
  CalendarClock,
  Cloud,
  CreditCard,
  Database,
  FolderKanban,
  GitBranch,
  Grid2x2,
  Layers,
  LogOut,
  Mic,
  Network,
  PlugZap,
  PlusCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useSubscription } from "@/hooks/useSubscription";

const ICONS: Record<string, LucideIcon> = {
  grid: Grid2x2,
  bot: Bot,
  layers: Layers,
  "git-branch": GitBranch,
  brain: Brain,
  cloud: Cloud,
  "credit-card": CreditCard,
  "plus-circle": PlusCircle,
  book: BookOpen,
  "folder-kanban": FolderKanban,
  sparkles: Sparkles,
  database: Database,
  "calendar-clock": CalendarClock,
  network: Network,
  "plug-zap": PlugZap,
  mic: Mic,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { hasPaidPlan, loading: subLoading } = useSubscription();
  const visibleNavItems = subLoading || hasPaidPlan
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.href === "/billing");

  return (
    <aside className="vf-sidebar">
      {/* Brand */}
      <div className="vf-sidebar-brand">
        <a href="/" style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--teal)", textDecoration: "none" }}>
          Venture Factory
        </a>
        <a href="https://tmrwgroup.ai/" target="_blank" rel="noopener noreferrer" className="vf-kicker" style={{ marginTop: 2, textDecoration: "none", color: "inherit" }}>
          TMRW Group
        </a>
      </div>

      {/* Nav */}
      <nav className="vf-sidebar-nav">
        {visibleNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`vf-sidebar-link ${active ? "active" : ""}`}
            >
              {active && (
                <motion.div
                  className="vf-sidebar-active-indicator"
                  layoutId="sidebar-active"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
              <motion.span
                className="vf-sidebar-link-icon"
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={14} />
              </motion.span>
              <span className="vf-sidebar-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="vf-sidebar-user">
          {session.user.image && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user.image}
                alt=""
                className="vf-sidebar-avatar"
              />
            </>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="vf-sidebar-username">
              {session.user.name}
            </div>
          </div>
          <motion.button
            onClick={() => signOut()}
            className="vf-sidebar-logout"
            title="Sign out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      )}
    </aside>
  );
}
