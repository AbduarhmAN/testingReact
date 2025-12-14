/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#8E8E93',
    background: '#F2F2F7', // iOS Grouped Background
    card: '#FFFFFF',
    tint: '#007AFF',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#007AFF',
    separator: '#C6C6C8',
    // Buddy specific accents
    expense: '#FF3B30', // System Red
    income: '#34C759', // System Green
    budget: '#5856D6', // System Indigo (often used in Buddy)
    // Categories
    cat1: '#FF9500', // Orange
    cat2: '#AF52DE', // Purple
    cat3: '#5AC8FA', // Teal
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    background: '#000000',
    card: '#1C1C1E', // iOS Dark Mode Card
    tint: '#0A84FF',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0A84FF',
    separator: '#38383A',
    // Buddy specific accents
    expense: '#FF453A',
    income: '#32D74B',
    budget: '#5E5CE6',
    // Categories
    cat1: '#FF9F0A',
    cat2: '#BF5AF2',
    cat3: '#64D2FF',
  },
};

export const Shadows = {
  light: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dark: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * 30 Curated Category Colors - Sorted by Spectrum (Red → Purple)
 * These are vibrant, high-contrast colors designed for pie charts.
 * White icons/text are readable on all of these.
 */
export const CATEGORY_COLORS = [
  // Reds & Warmth (1-6)
  '#FF3B30', // Vibrant Red
  '#E74C3C', // Cinnabar
  '#C0392B', // Deep Crimson
  '#D35400', // Pumpkin
  '#E67E22', // Carrot Orange
  '#F39C12', // Orange Peel
  // Yellows & Olives (7-12)
  '#F1C40F', // Sunflower
  '#D4AC0D', // Dark Sunflower
  '#AFB42B', // Olive
  '#8D6E63', // Cocoa
  '#A1887F', // Mocha
  '#CD6155', // Terracotta
  // Greens & Teals (13-18)
  '#2ECC71', // Emerald
  '#27AE60', // Nephritis
  '#16A085', // Green Sea
  '#1ABC9C', // Turquoise
  '#009688', // Teal
  '#006266', // Deep Teal
  // Blues (19-24)
  '#2980B9', // Belize Hole
  '#3498DB', // Peter River
  '#0984E3', // Electron Blue
  '#1E3799', // Royal Blue
  '#2C3E50', // Midnight Blue
  '#607D8B', // Blue Grey
  // Purples & Pinks (25-30)
  '#6C5CE7', // Exodus Purple
  '#8E44AD', // Wisteria
  '#9B59B6', // Amethyst
  '#BE2EDD', // Helios Purple
  '#E84393', // Prunus Rose
  '#C44569', // Dark Rose
];

/**
 * Get a category color using the "Prime Stride" strategy.
 * This ensures high contrast between consecutively created categories.
 * @param index - The category index (0-based, order of creation)
 * @returns A hex color string from CATEGORY_COLORS
 */
export function getCategoryColor(index: number): string {
  const STRIDE = 7; // Prime number for maximum distribution
  const colorIndex = (index * STRIDE) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[colorIndex];
}
