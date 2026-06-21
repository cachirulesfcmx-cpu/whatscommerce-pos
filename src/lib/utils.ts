import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  amount: number | string,
  currency = "MXN",
  locale = "es-MX"
) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      Number.isFinite(value) ? value : 0
    );
  } catch {
    return `$${(Number.isFinite(value) ? value : 0).toFixed(2)}`;
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export function formatDate(date: Date | string, locale = "es-MX") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function currentPeriod(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Normalize a phone to E.164 digits (no +) for wa.me links. */
export function normalizePhone(phone: string, defaultCountry = "52") {
  let p = phone.replace(/[^0-9]/g, "");
  if (p.length === 10) p = defaultCountry + p; // assume local 10-digit
  return p;
}
