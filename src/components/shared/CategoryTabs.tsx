"use client";

import { TEMPLATE_CATEGORIES } from "@/lib/constants";

interface CategoryTabsProps {
  active: string;
  onChange: (id: string) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="vf-tabs">
      {TEMPLATE_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`vf-button-ghost vf-tab-button ${active === cat.id ? "active" : ""}`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
