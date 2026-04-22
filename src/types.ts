export interface City {
  id: string;
  name: string;
  isFeatured: boolean;
  city_img?: string;
}

export interface Hotel {
  id: string;
  name: string;
  Hotel_img: string[];
  cityId?: string;
  المرافق: string[];
  الإطلالة: string;
  description: string;
  freeCancellation: boolean;
  rating?: number;
  reviewsCount?: number;
  mapUrl?: string;
}

export interface Room {
  id: string;
  Room_name: string;
  Room_img: string[];
  السعر: string;
  الإطلالة: string;
  المرافق: string[];
  hotelId?: string;
  cityId?: string;
  rating?: number;
  reviewsCount?: number;
  isSmokingAllowed?: boolean;
  size?: string;
  bed?: string;
}

export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  hotelName?: string;
  roomTitle?: string;
  roomPrice?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role?: 'admin' | 'user';
}

export interface Article {
  id: string;
  'عنوان المقالة': string;
  'محتوى المقالة': string;
  'صورة المقالة': string;
  'تاريخ المقالة': string;
  'الكاتب': string;
  'التصنيفات'?: string[];
  createdAt?: any;
  // Legacy English fields (for backward compat)
  title?: string;
  content?: string;
  image?: string;
  author?: string;
}

export interface Coupon {
  id: string;
  code: string;
  title?: string;
  description?: string;
  discountPercentage: number;
  expiryDate: string;
  isActive: boolean;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}
