"use client";

import { Bot, CreditCard, AlertTriangle, Activity } from "lucide-react";
import AnimatedCounter from "@/components/shared/AnimatedCounter";

interface RuntimePulseProps {
  running: number;
  queued: number;
  failed: number;
  plan: string;
  loading: boolean;
}

const STATS = [
  { key: "running", label: "Running", color: "var(--teal)", icon: Activity },
  { key: "queued", label: "Queued", color: "var(--gold)", icon: Bot },
  { key: "failed", label: "Failed", color: "var(--error)", icon: AlertTriangle },
  { key: "plan", label: "Plan", color: "var(--blue)", icon: CreditCard },
] as const;

export default function RuntimePulse({ running, queued, failed, plan, loading }: RuntimePulseProps) {
  const values: Record<string, number | string> = { running, queued, failed, plan };

  return (
    <div className="vf-dash-stats">
      {STATS.map((stat) => {
        const val = values[stat.key];
        const isNumber = typeof val === "number";

        return (
          <div
            key={stat.key}
            className="vf-dash-stat-card"
            style={{ "--accent": stat.color } as React.CSSProperties}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: stat.color,
              }}
            />
            <div className="vf-dash-stat-header">
              <span className="vf-dash-stat-label">{stat.label}</span>
              <span className="vf-dash-stat-icon" style={{ color: stat.color }}>
                <stat.icon size={15} />
              </span>
            </div>
            <div className="vf-dash-stat-value" style={{ color: stat.color }}>
              {loading ? (
                "..."
              ) : isNumber ? (
                <AnimatedCounter value={val as number} />
              ) : (
                String(val)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
