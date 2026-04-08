"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Check, Rocket, Zap } from "lucide-react";
import { PUBLIC_RUNTIME_LABEL } from "@/lib/runtime-brand";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "$49",
    period: "/mo",
    icon: Rocket,
    color: "var(--teal)",
    features: [
      "Up to 3 active agents",
      "Cloud Agent runtime (ECS)",
      PUBLIC_RUNTIME_LABEL,
      "Chat interface with tools",
      "Basic usage analytics",
    ],
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "$199",
    period: "/mo",
    icon: Zap,
    color: "var(--blue)",
    features: [
      "Up to 20 active agents",
      "Priority provisioning",
      "All models available",
      "Advanced runtime controls",
      "Team collaboration",
      "Custom instructions templates",
    ],
  },
];

export default function PlanModal({ isOpen, onClose }: PlanModalProps) {
  const [busyPlan, setBusyPlan] = useState<"STARTER" | "PRO" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(plan: "STARTER" | "PRO") {
    setBusyPlan(plan);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const body = await response.json();

      if (!body.success) {
        throw new Error(body.error || "Failed to create checkout session");
      }

      if (!body.data?.checkoutUrl) {
        throw new Error("Checkout URL missing from response");
      }

      window.location.href = body.data.checkoutUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusyPlan(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      backdrop="blur"
      classNames={{
        base: "bg-[var(--bg-card)] border border-[var(--border)]",
        header: "border-b border-[var(--border)]",
        body: "py-6",
        footer: "border-t border-[var(--border)]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}>
            Choose Your Plan
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", fontWeight: 400 }}>
            Select a plan to start deploying AI agents on cloud infrastructure
          </p>
        </ModalHeader>

        <ModalBody>
          {error && (
            <div
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--vf-radius-sm)",
                background: "color-mix(in srgb, var(--error) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
                color: "var(--error)",
                fontSize: "var(--text-sm)",
                marginBottom: "var(--space-4)",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className="vf-card vf-card-pad"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                  borderColor: busyPlan === plan.key
                    ? plan.color
                    : "var(--border)",
                  transition: "border-color 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Accent bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: plan.color,
                  }}
                />

                {/* Plan header */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `color-mix(in srgb, ${plan.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${plan.color} 30%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: plan.color,
                    }}
                  >
                    <plan.icon size={16} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-primary)" }}>
                      {plan.name}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: plan.color }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                    {plan.period}
                  </span>
                </div>

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <Check size={14} style={{ color: plan.color, flexShrink: 0 }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className="vf-button-primary"
                  style={{
                    marginTop: "auto",
                    width: "100%",
                    background: plan.color,
                    borderColor: plan.color,
                  }}
                  onClick={() => void handleSelect(plan.key)}
                  disabled={busyPlan !== null}
                >
                  {busyPlan === plan.key ? "Redirecting to Stripe..." : `Select ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </ModalBody>

        <ModalFooter>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", width: "100%" }}>
            Powered by Stripe. You can cancel anytime from your account settings.
          </p>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
