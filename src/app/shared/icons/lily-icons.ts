// ============================================
// 🌸 Lily — Centralized Lucide Icon Registry
// ============================================
// All Lucide icon imports in one place for tree-shaking
// Usage: <svg lucideUtensils [size]="18"></svg>

// ── Navigation ──
export {
  LucideLayoutDashboard,
  LucideCreditCard,
  LucideChartLine,
  LucideTarget,
  LucideTrophy,
  LucideSettings,
  LucideFlower2,
} from '@lucide/angular';

// ── Categories ──
export {
  LucideUtensilsCrossed,
  LucideCar,
  LucideClapperboard,
  LucideShoppingBag,
  LucideLightbulb,
  LucideHeartPulse,
  LucideGraduationCap,
  LucideCarrot,
  LucideSmartphone,
  LucideSparkles,
  LucideWallet,
  LucideLaptop,
  LucideTrendingUp,
  LucideGift,
  LucidePackage,
} from '@lucide/angular';

// ── Actions ──
export {
  LucidePlus,
  LucideMinus,
  LucideCheck,
  LucideX,
  LucidePencil,
  LucideTrash2,
  LucideSearch,
  LucideFilter,
  LucideDownload,
  LucideUpload,
  LucideChevronRight,
  LucideChevronDown,
  LucideChevronLeft,
  LucideArrowLeft,
  LucideArrowRight,
  LucideEye,
  LucideCopy,
} from '@lucide/angular';

// ── Status / Info ──
export {
  LucideInfo,
  LucideTriangleAlert,
  LucideCircleCheck,
  LucideCircleX,
  LucideBell,
  LucideCircleDollarSign,
  LucideCalendar,
  LucideClock,
  LucideZap,
  LucideFlame,
} from '@lucide/angular';

// ── Dashboard / Analytics ──
export {
  LucideBarChart3,
  LucidePieChart,
  LucideActivity,
  LucideArrowUpRight,
  LucideArrowDownRight,
  LucideBadgeDollarSign,
  LucideReceipt,
  LucideHandCoins,
} from '@lucide/angular';

// ── Settings / Misc ──
export {
  LucidePalette,
  LucideDatabase,
  LucideSun,
  LucideMoon,
  LucideMonitor,
  LucidePlane,
  LucideHouse,
  LucidePartyPopper,
  LucideThumbsUp,
} from '@lucide/angular';

// ── Convenience array for bulk imports ──
import {
  LucideLayoutDashboard, LucideCreditCard, LucideChartLine, LucideTarget,
  LucideTrophy, LucideSettings, LucideFlower2,
  LucideUtensilsCrossed, LucideCar, LucideClapperboard, LucideShoppingBag,
  LucideLightbulb, LucideHeartPulse, LucideGraduationCap, LucideCarrot,
  LucideSmartphone, LucideSparkles, LucideWallet, LucideLaptop,
  LucideTrendingUp, LucideGift, LucidePackage,
  LucidePlus, LucideMinus, LucideCheck, LucideX, LucidePencil, LucideTrash2,
  LucideSearch, LucideFilter, LucideDownload, LucideUpload,
  LucideChevronRight, LucideChevronDown, LucideChevronLeft,
  LucideArrowLeft, LucideArrowRight, LucideEye, LucideCopy,
  LucideInfo, LucideTriangleAlert, LucideCircleCheck, LucideCircleX,
  LucideBell, LucideCircleDollarSign, LucideCalendar, LucideClock,
  LucideZap, LucideFlame,
  LucideBarChart3, LucidePieChart, LucideActivity,
  LucideArrowUpRight, LucideArrowDownRight,
  LucideBadgeDollarSign, LucideReceipt, LucideHandCoins,
  LucidePalette, LucideDatabase, LucideSun, LucideMoon, LucideMonitor,
  LucidePlane, LucideHouse, LucidePartyPopper, LucideThumbsUp,
} from '@lucide/angular';

/** All Lily icons for convenient module-level imports */
export const LILY_ICONS = [
  LucideLayoutDashboard, LucideCreditCard, LucideChartLine, LucideTarget,
  LucideTrophy, LucideSettings, LucideFlower2,
  LucideUtensilsCrossed, LucideCar, LucideClapperboard, LucideShoppingBag,
  LucideLightbulb, LucideHeartPulse, LucideGraduationCap, LucideCarrot,
  LucideSmartphone, LucideSparkles, LucideWallet, LucideLaptop,
  LucideTrendingUp, LucideGift, LucidePackage,
  LucidePlus, LucideMinus, LucideCheck, LucideX, LucidePencil, LucideTrash2,
  LucideSearch, LucideFilter, LucideDownload, LucideUpload,
  LucideChevronRight, LucideChevronDown, LucideChevronLeft,
  LucideArrowLeft, LucideArrowRight, LucideEye, LucideCopy,
  LucideInfo, LucideTriangleAlert, LucideCircleCheck, LucideCircleX,
  LucideBell, LucideCircleDollarSign, LucideCalendar, LucideClock,
  LucideZap, LucideFlame,
  LucideBarChart3, LucidePieChart, LucideActivity,
  LucideArrowUpRight, LucideArrowDownRight,
  LucideBadgeDollarSign, LucideReceipt, LucideHandCoins,
  LucidePalette, LucideDatabase, LucideSun, LucideMoon, LucideMonitor,
  LucidePlane, LucideHouse, LucidePartyPopper, LucideThumbsUp,
] as const;

/**
 * Map category IDs to Lucide icon directive selectors.
 * Used by components that render category icons dynamically.
 */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  food: 'utensils-crossed',
  transport: 'car',
  entertainment: 'clapperboard',
  shopping: 'shopping-bag',
  bills: 'lightbulb',
  health: 'heart-pulse',
  education: 'graduation-cap',
  groceries: 'carrot',
  subscriptions: 'smartphone',
  personal: 'sparkles',
  salary: 'wallet',
  freelance: 'laptop',
  investments: 'trending-up',
  gifts: 'gift',
  other: 'package',
};

/** Nav icon map for sidebar/bottom-nav */
export const NAV_ICON_MAP: Record<string, string> = {
  '/dashboard': 'layout-dashboard',
  '/transactions': 'credit-card',
  '/analytics': 'chart-line',
  '/budgets': 'target',
  '/goals': 'trophy',
  '/settings': 'settings',
};
