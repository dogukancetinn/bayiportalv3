// BayiPortal - Fiyatlandirma Motoru
// Bayi indirim orani uzerinden hesaplama yapar

export interface PriceResult {
  finalPrice: number;
  regularPrice: number;
  savings: number;
  discountPercent: number;
}

// Bayi fiyati hesaplama
export function getDealerPrice(regularPriceStr: string, discountRate: number): number {
  const price = parseFloat(regularPriceStr);
  if (isNaN(price)) return 0;
  return price * (1 - discountRate / 100);
}

// Detayli fiyat hesaplama
export function calculateDealerPrice(
  regularPriceStr: string,
  discountRate: number
): PriceResult {
  const regularPrice = parseFloat(regularPriceStr);
  if (isNaN(regularPrice) || regularPrice === 0) {
    return { finalPrice: 0, regularPrice: 0, savings: 0, discountPercent: 0 };
  }

  const finalPrice = regularPrice * (1 - discountRate / 100);
  const savings = regularPrice - finalPrice;
  
  return { 
    finalPrice, 
    regularPrice, 
    savings, 
    discountPercent: discountRate 
  };
}

// Fiyat formatlama
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}
