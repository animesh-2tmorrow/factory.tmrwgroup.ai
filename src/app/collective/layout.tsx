import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TMRW Collective — Hire Agentic Builders",
  description:
    "Hire fractional consultants powered by AI agent swarms. One person, one swarm, 10x output. From $1,000/month.",
  openGraph: {
    title: "TMRW Collective — Hire Agentic Builders",
    description:
      "Hire fractional consultants powered by AI agent swarms. One person, one swarm, 10x output.",
    url: "https://factory.tmrwgroup.ai/collective",
  },
};

export default function CollectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body {
          background: #FAFAF7 !important;
          background-image: none !important;
          margin: 0;
        }
        body::before { display: none !important; }

        .coll-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .coll-sans  { font-family: 'DM Sans', system-ui, sans-serif; }

        .coll-page {
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #1A1814;
          background: #FAFAF7;
          min-height: 100vh;
        }

        /* Nav */
        .coll-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px; max-width: 1200px; margin: 0 auto;
          border-bottom: 1px solid #E8E4DE;
        }
        .coll-nav-logo {
          font-family: 'DM Sans', sans-serif; font-weight: 700;
          font-size: 18px; color: #1A1814; text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }
        .coll-nav-logo .dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #FF6B35; display: inline-block;
        }
        .coll-nav-links { display: flex; align-items: center; gap: 32px; }
        .coll-nav-link {
          font-size: 14px; color: #6B6560; text-decoration: none;
          font-weight: 500; transition: color .15s;
        }
        .coll-nav-link:hover { color: #1A1814; }
        .coll-nav-cta {
          font-size: 14px; font-weight: 500; padding: 10px 24px;
          background: #1A1814; color: #fff; border-radius: 100px;
          text-decoration: none; transition: background .15s;
        }
        .coll-nav-cta:hover { background: #333; }

        /* Mobile nav */
        .coll-nav-menu-btn {
          display: none; background: none; border: none; cursor: pointer;
          padding: 8px; color: #1A1814;
        }
        .coll-mobile-menu {
          display: none; flex-direction: column; gap: 16px;
          padding: 20px 32px; border-bottom: 1px solid #E8E4DE;
        }
        .coll-mobile-menu.open { display: flex; }
        .coll-mobile-menu a {
          font-size: 16px; color: #1A1814; text-decoration: none;
          font-weight: 500; padding: 8px 0;
        }
        @media (max-width: 640px) {
          .coll-nav { padding: 14px 20px; }
          .coll-nav-links { display: none; }
          .coll-nav-menu-btn { display: block; }
        }

        /* Footer */
        .coll-footer {
          border-top: 1px solid #E8E4DE; padding: 32px;
          text-align: center; color: #6B6560; font-size: 13px;
          max-width: 1200px; margin: 0 auto;
        }
      `}</style>
      <div className="coll-page">
        {children}
      </div>
    </>
  );
}
