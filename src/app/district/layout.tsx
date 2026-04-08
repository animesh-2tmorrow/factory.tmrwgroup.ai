import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Factory District | TMRW Group",
  description: "Agentic Factory District — shared coordination layer for TMRW agent swarms.",
};

export default function DistrictLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        /* district page reset — override venture-factory globals */
        body {
          background: #FAFAF7 !important;
          background-image: none !important;
        }
        body::before {
          display: none !important;
        }

        /* responsive: metric cards 2x2 on mobile */
        @media (max-width: 640px) {
          [data-metric-grid] { grid-template-columns: repeat(2, 1fr) !important; }
          [data-block-grid] { grid-template-columns: repeat(2, 1fr) !important; }
          [data-table-wrap] { display: none !important; }
          [data-mobile-cards] { display: block !important; }
        }
        @media (min-width: 641px) {
          [data-mobile-cards] { display: none !important; }
        }
      `}</style>
      {children}
    </>
  );
}
