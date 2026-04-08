import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { TeamRoleProvider } from "@/hooks/useTeamRole";
import "./globals.css";

const ibmPlexMonoDisplay = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMonoCode = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Venture Factory | TMRW Group",
  description: "Internal venture creation and template management tool for Tomorrow Inc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${ibmPlexMonoDisplay.variable} ${ibmPlexMonoCode.variable}`}>
      <body>
        <SessionProvider>
          <TeamRoleProvider>
            {children}
          </TeamRoleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
