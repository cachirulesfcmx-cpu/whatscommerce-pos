"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun, ExternalLink, LogOut, BadgeCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  storeSlug,
  planName,
  userName,
  isSuperAdmin,
}: {
  storeSlug: string;
  planName: string;
  userName?: string | null;
  isSuperAdmin?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="success" className="gap-1">
          <BadgeCheck className="h-3.5 w-3.5" /> Plan {planName}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {isSuperAdmin && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin"><ShieldCheck className="h-3.5 w-3.5" /> Admin</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href={`/store/${storeSlug}`} target="_blank">
            Ver tienda <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Cambiar tema"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
