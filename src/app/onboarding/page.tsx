import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";

export const metadata = { title: "Configura tu tienda" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { store: { include: { whatsappSettings: true } } },
    orderBy: { invitedAt: "asc" },
  });

  if (!staff) redirect("/login");
  if (staff.store.onboarded) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-10">
      <OnboardingWizard
        initial={{
          name: staff.store.name,
          whatsappPhone: staff.store.whatsappSettings?.phone ?? "",
        }}
      />
    </div>
  );
}
