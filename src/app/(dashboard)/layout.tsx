import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Providers from "@/components/layout/Providers";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { isPaidPlanActive } from "@/lib/billing";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/billing");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const search = (await headers()).get("x-search") ?? "";
  const isBillingPage = pathname === "/billing";

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
    },
  });

  if (!isBillingPage && !isPaidPlanActive(subscription)) {
    redirect(`/billing${search}`);
  }

  return (
    <Providers>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          {children}
          <Footer />
        </div>
      </div>
    </Providers>
  );
}
