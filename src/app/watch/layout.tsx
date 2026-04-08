import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch — The Autonomous Agent Factory | TMRW Group",
  description:
    "How TMRW Group built an autonomous agentic factory in one week. Jobs go in, agents execute, results come back.",
  openGraph: {
    title: "The Autonomous Agent Factory — TMRW Group",
    description:
      "How TMRW Group built an autonomous agentic factory in one week.",
    url: "https://factory.tmrwgroup.ai/watch",
  },
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body {
          background: #FAFAF7 !important;
          background-image: none !important;
          margin: 0;
        }
        body::before { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
