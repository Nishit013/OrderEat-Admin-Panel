
export interface Variant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  category: string;
  rating?: number;
  votes?: number;
  variants?: Variant[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  selectedVariant?: Variant;
}

export interface Address {
  id: string;
  type: string;
  houseNo: string;
  area: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
  imageUrl: string;
  menu: Record<string, MenuItem>;
  address: string;
  discount?: string;
  promoted?: boolean;
  isApproved?: boolean; // Admin Field (Platform Listing)
  isOnline?: boolean;   // Restaurant Field (Operational Status)
  lat?: number;
  lng?: number;
  // Financial Overrides
  customTaxRate?: number;
  customDeliveryFee?: number;
  commissionRate?: number;
  // Financial Details
  upiId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  addresses?: Address[];
  phone?: string;
  createdAt?: number;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  email?: string;
  phone: string;
  vehicleType: 'Bike' | 'Scooter' | 'Car' | 'Cycle' | 'Electric';
  vehicleNumber: string;
  licenseNumber?: string;
  imageUrl?: string;
  rating: number;
  isApproved: boolean; 
  isOnline: boolean;        // Live Status
  dailyActiveMs?: number;   // Total active time in ms for today
  lastOnlineAt?: number;
  joinedAt: number;
  upiId?: string; 
}

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus | string;
  createdAt: number;
  deliveryAddress: string;
  paymentMethod: 'COD' | 'ONLINE';
  paymentId?: string;
  customerLat?: number;
  customerLng?: number;
  
  // Delivery Specifics
  deliveryPartnerId?: string;
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    imageUrl?: string;
  };
  partnerPayout?: number; // Calculated amount for partner per order
  
  ratings?: {
    restaurant: number;
    delivery?: number;
  };
}

export interface Coupon {
  id?: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrder: number;
  maxDiscount?: number; // Cap for percentage discount
  validForFirstOrder?: boolean; // New criterion
  restaurantId?: string; // Optional: Only valid for this restaurant
  category?: string;     // Optional: Only valid for items in this category
}

export interface GlobalOffer {
  id?: string;
  isActive: boolean;
  text: string;
  subText?: string;
  gradientStart?: string; // e.g. from-purple-600
  gradientEnd?: string;   // e.g. to-blue-600
  actionText?: string;    // e.g. "Order Now"
  textColor?: string;
}

export interface InspirationItem {
  id: string;
  name: string;
  image: string;
}

export interface AdminSettings {
  taxRate: number; // Global GST %
  deliveryBaseFee: number; // Base fee
  deliveryPerKm: number; // Additional per km
  platformCommission: number; // Default % taken from restaurant
  freeDeliveryOrderValue?: number; // Minimum order value for free delivery
}

export interface FilterState {
  sortBy: 'Relevance' | 'Rating' | 'DeliveryTime' | 'CostLow' | 'CostHigh';
  rating: number | null;
  isVeg: boolean;
  hasOffers: boolean;
  costRange: [number, number] | null;
  cuisines: string[];
  deliveryTimeMax?: number;
}

export interface PayoutLog {
  id: string;
  partnerId?: string; // Delivery Partner ID
  restaurantId?: string; // Restaurant ID
  amount: number;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED';
}
