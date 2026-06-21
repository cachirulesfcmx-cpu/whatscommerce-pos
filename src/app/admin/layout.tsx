import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Super Admin · WhatsCommerce" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background"><ShieldCheck className="h-5 w-5" /></span>
          WhatsCommerce · Super Admin
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> Mi tienda</Link>
        </Button>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
