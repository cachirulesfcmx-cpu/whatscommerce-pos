import { getTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

/** Mini storefront mock that reflects a template's real config (dark/accent/cols/radius). */
export function ThemePreview({ templateKey, className }: { templateKey: string; className?: string }) {
  const t = getTemplate(templateKey);
  const cols = t.columns >= 4 ? 4 : 3;
  const cards = Array.from({ length: cols });
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        t.dark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white",
        className
      )}
    >
      {/* hero */}
      <div
        className="h-7 w-full"
        style={{
          background:
            t.hero === "minimal"
              ? t.accent + "22"
              : `linear-gradient(135deg, ${t.accent}, #0ea5e9)`,
        }}
      />
      {/* heading line */}
      <div className="px-2 pt-1.5">
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: t.accent }} />
      </div>
      {/* product grid */}
      <div className={cn("grid gap-1 p-2", cols === 4 ? "grid-cols-4" : "grid-cols-3")}>
        {cards.map((_, i) => (
          <div key={i}>
            <div
              className={cn(
                t.cardRadius === "rounded-none" ? "rounded-none" : "rounded-md",
                t.dark ? "bg-white/10" : "bg-slate-100"
              )}
              style={{ aspectRatio: "1 / 1" }}
            />
            <div className={cn("mt-1 h-1 w-3/4 rounded-full", t.dark ? "bg-white/20" : "bg-slate-200")} />
            <div className="mt-0.5 h-1 w-1/2 rounded-full" style={{ background: t.accent + (t.dark ? "" : "99") }} />
          </div>
        ))}
      </div>
    </div>
  );
}
