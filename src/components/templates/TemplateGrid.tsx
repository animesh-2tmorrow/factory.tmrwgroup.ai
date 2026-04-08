import TemplateCard from "@/components/templates/TemplateCard";
import type { Template } from "@/lib/templates";

interface TemplateGridProps {
  templates: Template[];
}

export default function TemplateGrid({ templates }: TemplateGridProps) {
  return (
    <div className="vf-grid-auto">
      {templates.map((t) => (
        <TemplateCard key={t.type} template={t} />
      ))}
    </div>
  );
}
