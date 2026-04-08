import { cn } from "@/lib/classnames";

const COLOR_MAP: Record<string, string> = {
  "Next.js": "teal",
  TailwindCSS: "blue",
  Prisma: "pink",
  Stripe: "gold",
  "Stripe Connect": "gold",
  "Stripe Billing": "gold",
  SES: "orange",
  "AWS SES": "orange",
  "ECS Fargate": "teal",
  "ECS Fargate (API)": "teal",
  Redis: "pink",
  NextAuth: "blue",
  React: "blue",
  "React Native": "blue",
  FastAPI: "lime",
  Go: "blue",
  PostgreSQL: "blue",
  Docker: "blue",
  Prometheus: "orange",
  TypeScript: "blue",
  Expo: "gold",
  "Firebase/Supabase": "orange",
  Python: "gold",
  "Airflow/Prefect": "orange",
  PyTorch: "pink",
  DVC: "teal",
  MLflow: "blue",
  S3: "orange",
};

interface BadgeProps {
  label: string;
  color?: string;
}

export default function Badge({ label, color }: BadgeProps) {
  const c = color ?? COLOR_MAP[label] ?? "blue";
  return (
    <span className={cn("vf-badge", `vf-badge--${c}`)}>
      {label}
    </span>
  );
}
