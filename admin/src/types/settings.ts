export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface HolidayClosure {
  date: string;
  note: string;
}

export interface PaymentSettings {
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  cloverEnabled: boolean;
  cloverAccessToken: string;
  cloverPrivateKey: string;
  cloverMerchantId: string;
  cloverApiBaseUrl: string;
  cloverDefaultCurrency: string;
}

export interface AboutChefSettings {
  sectionTitle: string;
  chefName: string;
  bio: string;
  imageUrl: string;
  experienceText: string;
}

export interface ContactInfoSettings {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
}

export interface OfferPopupSettings {
  enabled: boolean;
  title: string;
  description: string;
  promoCode: string;
  ctaText: string;
  ctaLink: string;
  cashbackAmount: number;
}

export interface BusinessSettings {
<<<<<<< Updated upstream
  businessName?: string;
=======
>>>>>>> Stashed changes
  logoUrl?: string;
  openingHours: OpeningHour[];
  holidayClosures: HolidayClosure[];
  paymentSettings: PaymentSettings;
  aboutChef: AboutChefSettings;
  contactInfo: ContactInfoSettings;
  offerPopup: OfferPopupSettings;
}
