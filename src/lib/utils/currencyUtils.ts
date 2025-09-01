// Utility for currency formatting with display multiplier
// This allows showing large amounts (millions) while actually processing small amounts (thousands)

// Display multiplier - change this to adjust how amounts are displayed
// 1000 means: actual amount 5000 will be displayed as 5,000,000
export const DISPLAY_MULTIPLIER = 10000;

// Environment variable to control multiplier (optional)
const getDisplayMultiplier = (): number => {
  if (typeof window !== 'undefined') {
    const envMultiplier = process.env.NEXT_PUBLIC_DISPLAY_MULTIPLIER;
    if (envMultiplier) {
      return parseInt(envMultiplier);
    }
  }
  return DISPLAY_MULTIPLIER;
};

/**
 * Convert actual amount to display amount
 * @param actualAmount - The real amount in database
 * @returns Display amount (multiplied by DISPLAY_MULTIPLIER)
 */
export const toDisplayAmount = (actualAmount: number): number => {
  return actualAmount * getDisplayMultiplier();
};

/**
 * Convert display amount to actual amount
 * @param displayAmount - The displayed amount
 * @returns Actual amount (divided by DISPLAY_MULTIPLIER)
 */
export const toActualAmount = (displayAmount: number): number => {
  return displayAmount / getDisplayMultiplier();
};

/**
 * Format currency for display with multiplier
 * @param actualAmount - The real amount from database
 * @returns Formatted currency string
 */
export const formatDisplayCurrency = (actualAmount: number): string => {
  const displayAmount = toDisplayAmount(actualAmount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(displayAmount).replace('₫', 'VNĐ');
};

/**
 * Format currency for actual amount (without multiplier)
 * @param actualAmount - The real amount from database
 * @returns Formatted currency string
 */
export const formatActualCurrency = (actualAmount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(actualAmount).replace('₫', 'VNĐ');
};

/**
 * Format currency with custom multiplier
 * @param amount - The amount to format
 * @param multiplier - Custom multiplier
 * @returns Formatted currency string
 */
export const formatCurrencyWithMultiplier = (amount: number, multiplier: number = 1): string => {
  const displayAmount = amount * multiplier;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(displayAmount).replace('₫', 'VNĐ');
};

/**
 * Get display multiplier info for debugging
 */
export const getMultiplierInfo = () => {
  return {
    multiplier: getDisplayMultiplier(),
    example: {
      actual: 5000,
      display: toDisplayAmount(5000),
      formatted: formatDisplayCurrency(5000)
    }
  };
};

/**
 * Check if display multiplier is enabled
 */
export const isDisplayMultiplierEnabled = (): boolean => {
  return getDisplayMultiplier() > 1;
};
