import type { PlanTier } from "@prisma/client";

export type FeatureKey =
  | "cardPayments"
  | "customDomain"
  | "removeBranding"
  | "coupons"
  | "variants"
  | "inventory"
  | "customers"
  | "reports"
  | "whatsappAutomation"
  | "cartRecovery"
  | "premiumTemplates"
  | "advancedSeo"
  | "multiStore"
  | "multiBranch"
  | "advancedRoles"
  | "api"
  | "webhooks"
  | "whatsappCloudApi"
  | "broadcasts"
  | "whiteLabel"
  | "advancedReports";

export interface PlanLimits {
  maxStores: number | null;
  maxProducts: number | null;
  maxImages: number | null;
  maxOrdersMonth: number | null;
  maxStaff: number | null;
  maxBranches: number | null;
}

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  limits: PlanLimits;
  features: Record<FeatureKey, boolean>;
  highlight?: boolean;
}

const noFeatures = (): Record<FeatureKey, boolean> => ({
  cardPayments: false,
  customDomain: false,
  removeBranding: false,
  coupons: false,
  variants: false,
  inventory: false,
  customers: false,
  reports: false,
  whatsappAutomation: false,
  cartRecovery: false,
  premiumTemplates: false,
  advancedSeo: false,
  multiStore: false,
  multiBranch: false,
  advancedRoles: false,
  api: false,
  webhooks: false,
  whatsappCloudApi: false,
  broadcasts: false,
  whiteLabel: false,
  advancedReports: false,
});

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
  BASIC: {
    tier: "BASIC",
    name: "Básico",
    description: "Para empezar a vender por WhatsApp gratis.",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "MXN",
    limits: {
      maxStores: 1,
      maxProducts: 20,
      maxImages: 20,
      maxOrdersMonth: 50,
      maxStaff: 1,
      maxBranches: 1,
    },
    features: noFeatures(),
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    description: "Para negocios que quieren crecer y profesionalizarse.",
    priceMonthly: 399,
    priceYearly: 3990,
    currency: "MXN",
    highlight: true,
    limits: {
      maxStores: 1,
      maxProducts: null,
      maxImages: null,
      maxOrdersMonth: null,
      maxStaff: 5,
      maxBranches: 1,
    },
    features: {
      ...noFeatures(),
      cardPayments: true,
      customDomain: true,
      removeBranding: true,
      coupons: true,
      variants: true,
      inventory: true,
      customers: true,
      reports: true,
      whatsappAutomation: true,
      cartRecovery: true,
      premiumTemplates: true,
      advancedSeo: true,
    },
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    description: "Multi-tienda, multi-sucursal y automatizaciones avanzadas.",
    priceMonthly: 1499,
    priceYearly: 14990,
    currency: "MXN",
    limits: {
      maxStores: null,
      maxProducts: null,
      maxImages: null,
      maxOrdersMonth: null,
      maxStaff: null,
      maxBranches: null,
    },
    features: {
      cardPayments: true,
      customDomain: true,
      removeBranding: true,
      coupons: true,
      variants: true,
      inventory: true,
      customers: true,
      reports: true,
      whatsappAutomation: true,
      cartRecovery: true,
      premiumTemplates: true,
      advancedSeo: true,
      multiStore: true,
      multiBranch: true,
      advancedRoles: true,
      api: true,
      webhooks: true,
      whatsappCloudApi: true,
      broadcasts: true,
      whiteLabel: true,
      advancedReports: true,
    },
  },
};

export const PLAN_ORDER: PlanTier[] = ["BASIC", "PRO", "ENTERPRISE"];
