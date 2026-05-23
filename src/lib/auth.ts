// Auth utility functions

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  company: string;
  discountRate: number;
  phone: string;
  address: string;
  city: string;
}

/**
 * Role → UI Label
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case 'administrator':
      return 'Admin';

    case 'vip_bayi':
    case 'vip_dealer':
      return 'VIP Bayi';

    case 'premium_bayi':
    case 'premium_dealer':
      return 'Premium Bayi';

    case 'bayi':
    case 'dealer':
      return 'Bayi';

    default:
      return 'Kullanıcı';
  }
}

/**
 * Role → Badge Class (Tailwind / CSS)
 */
export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'administrator':
      return 'bg-red-100 text-red-800';

    case 'vip_bayi':
    case 'vip_dealer':
      return 'bg-purple-100 text-purple-800';

    case 'premium_bayi':
    case 'premium_dealer':
      return 'bg-blue-100 text-blue-800';

    case 'bayi':
    case 'dealer':
      return 'bg-green-100 text-green-800';

    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Admin kontrolü
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'administrator';
}

/**
 * Bayi kontrolü
 */
export function isDealer(user: User | null): boolean {
  if (!user) return false;

  const dealerRoles = [
    'bayi',
    'premium_bayi',
    'vip_bayi',
    'dealer',
    'premium_dealer',
    'vip_dealer'
  ];

  return dealerRoles.includes(user.role);
}

/**
 * VIP kontrolü (opsiyonel ama çok işe yarar)
 */
export function isVipDealer(user: User | null): boolean {
  if (!user) return false;

  const vipRoles = ['vip_bayi', 'vip_dealer'];

  return vipRoles.includes(user.role);
}

/**
 * Premium kontrolü
 */
export function isPremiumDealer(user: User | null): boolean {
  if (!user) return false;

  const premiumRoles = ['premium_bayi', 'premium_dealer'];

  return premiumRoles.includes(user.role);
}