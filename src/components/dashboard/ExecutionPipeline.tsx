"use client";

import { CheckCircle2, CreditCard, Rocket, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface ExecutionPipelineProps {
  hasAuth: boolean;
  hasPlan: boolean;
  hasAgent: boolean;
}

export default function ExecutionPipeline({ hasAuth, hasPlan, hasAgent }: ExecutionPipelineProps) {
  const steps = [
    {
      icon: ShieldCheck,
      label: "Authenticate",
      state: hasAuth ? "complete" : "current",
    },
    {
      icon: CreditCard,
      label: "Choose Plan",
      state: hasPlan ? "complete" : hasAuth ? "current" : "pending",
    },
    {
      icon: Rocket,
      label: "Deploy Agent",
      state: hasAgent ? "complete" : hasPlan ? "current" : "pending",
    },
  ] as const;

  return (
    <div className="vf-pipeline">
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: "contents" }}>
          <motion.div
            className="vf-pipeline-step"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className={`vf-pipeline-node ${
                step.state === "complete"
                  ? "is-complete"
                  : step.state === "current"
                  ? "is-current"
                  : "is-pending"
              }`}
            >
              {step.state === "complete" ? (
                <CheckCircle2 size={18} />
              ) : (
                <step.icon size={18} />
              )}
            </div>
            <span
              className={`vf-pipeline-label ${
                step.state === "complete"
                  ? "is-complete"
                  : step.state === "current"
                  ? "is-current"
                  : "is-pending"
              }`}
            >
              {step.label}
            </span>
          </motion.div>
          {i < steps.length - 1 && (
            <div
              className={`vf-pipeline-connector ${step.state === "complete" ? "is-complete" : ""}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
