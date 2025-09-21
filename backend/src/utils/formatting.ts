// Formatting utilities used across routes

/**
 * Calculate efficiency (value per GP)
 */
export function calculateEfficiency(value: number | null, price: number | null): number | null {
  return price && price > 0 && value && value > 0 
    ? Math.round((value / price) * 1000000) / 1000000 
    : null;
}

/**
 * Format price for display
 */
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseInt(price) : price;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M gp`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K gp`;
  }
  return `${num.toLocaleString()} gp`;
}

/**
 * Format efficiency values
 */
export function formatEfficiency(efficiency: number | null): string {
  if (efficiency === null || efficiency === 0) return "N/A";
  if (efficiency < 0.001) return efficiency.toExponential(2);
  return efficiency.toFixed(6);
}
