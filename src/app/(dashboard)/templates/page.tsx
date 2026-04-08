"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import CategoryTabs from "@/components/shared/CategoryTabs";
import TemplateGrid from "@/components/templates/TemplateGrid";
import { templates } from "@/lib/templates";

export default function TemplatesPage() {
  const [category, setCategory] = useState("ventures");

  const filtered = templates.filter((t) => t.category === category);

  return (
    <>
      <Header title="Templates" description="Browse venture and project templates" />
      <div className="page-container">
        <CategoryTabs active={category} onChange={setCategory} />
        <TemplateGrid templates={filtered} />
      </div>
    </>
  );
}
