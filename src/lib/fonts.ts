import { Inter, Poppins, Playfair_Display, Montserrat, Sora, DM_Sans } from "next/font/google";

// Fonts available to storefront templates (loaded at build time by next/font).
const inter = Inter({ subsets: ["latin"], display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700", "800"], display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const dmsans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

export type FontKey = "inter" | "poppins" | "playfair" | "montserrat" | "sora" | "dmsans";

export const FONTS: Record<FontKey, { className: string }> = {
  inter, poppins, playfair, montserrat, sora, dmsans,
};
