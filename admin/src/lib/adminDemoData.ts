import { BusinessSettings } from "@/types/settings";

export const demoOrders = [
  {
    _id: "demo-order-1",
    userId: "demo-user-1",
    email: "sarah.demo@example.com",
    deliveryMode: "delivery",
    address: {
      fullName: "Sarah Ahmed",
      phone: "+44 7700 900001",
      line1: "221B Baker Street",
      line2: "Flat 2",
      city: "London",
      postcode: "NW1 6XE",
    },
    items: [
      {
        menuItem: {
          id: "menu-1",
          name: "Chicken Shawarma Wrap",
          description: "Grilled chicken with garlic sauce",
          price: 9.5,
          image: "",
          category: "wraps",
        },
        quantity: 2,
        customizations: [],
        totalPrice: 19,
      },
      {
        menuItem: {
          id: "menu-2",
          name: "Fries",
          description: "Crispy fries",
          price: 3.5,
          image: "",
          category: "sides",
        },
        quantity: 1,
        customizations: [],
        totalPrice: 3.5,
      },
    ],
    subtotal: 22.5,
    deliveryFee: 2.5,
    loyaltyDiscount: 0,
    promoDiscount: 2,
    total: 23,
    paymentMethod: "card",
    paymentStatus: "paid",
    status: "Food Processing",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    _id: "demo-order-2",
    userId: "demo-user-2",
    email: "ibrahim.demo@example.com",
    deliveryMode: "collection",
    items: [
      {
        menuItem: {
          id: "menu-3",
          name: "Mixed Grill Platter",
          description: "Assorted grilled meats",
          price: 18,
          image: "",
          category: "grills",
        },
        quantity: 1,
        customizations: [],
        totalPrice: 18,
      },
    ],
    subtotal: 18,
    deliveryFee: 0,
    loyaltyDiscount: 1,
    promoDiscount: 0,
    total: 17,
    paymentMethod: "cash",
    paymentStatus: "cash_on_collection",
    status: "Out for delivery",
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
];

export const demoCategories = [
  { id: "cold-starters", name: "Cold Starters", icon: "🥗", sortOrder: 1 },
  { id: "hot-starters", name: "Hot Starters", icon: "🔥", sortOrder: 2 },
  { id: "main-courses", name: "Main Courses", icon: "🍗", sortOrder: 3 },
  { id: "wraps-burgers", name: "Wraps & Burgers", icon: "🌯", sortOrder: 4 },
  { id: "sides-extras", name: "Sides & Extras", icon: "🍟", sortOrder: 5 },
  { id: "hand-crafted-dips", name: "Hand Crafted Dips", icon: "🍯", sortOrder: 6 },
  { id: "family-platters", name: "Family Platters", icon: "👨‍👩‍👧", sortOrder: 7 },
  { id: "desserts", name: "Desserts", icon: "🍰", sortOrder: 8 },
  { id: "drinks", name: "Drinks", icon: "🥤", sortOrder: 9 },
  { id: "lunch-deals", name: "Lunch Deals", icon: "🕒", sortOrder: 10 },
];

export const demoMenuItems = [
  {
    id: "menu-1",
    name: "Chicken Shawarma Wrap",
    description: "Grilled chicken with garlic sauce",
    price: 9.5,
    image: "",
    category: "wraps",
    isAvailable: true,
    isPopular: true,
    isVegetarian: false,
    isVegan: false,
    isSpicy: false,
  },
  {
    id: "menu-2",
    name: "Falafel Bowl",
    description: "Falafel, salad, tahini and rice",
    price: 11,
    image: "",
    category: "sides",
    isAvailable: true,
    isPopular: false,
    isVegetarian: true,
    isVegan: true,
    isSpicy: false,
  },
  {
    id: "menu-3",
    name: "Lamb Kofta Grill",
    description: "Chargrilled lamb kofta skewers",
    price: 16,
    image: "",
    category: "grills",
    isAvailable: true,
    isPopular: true,
    isVegetarian: false,
    isVegan: false,
    isSpicy: true,
  },
];

export const demoBusinessSettings: BusinessSettings = {
  businessName: "Lebanese Flames",
  logoUrl: "",
  openingHours: [
    { day: "Monday", open: "12:00", close: "23:00", closed: false },
    { day: "Tuesday", open: "12:00", close: "23:00", closed: false },
    { day: "Wednesday", open: "12:00", close: "23:00", closed: false },
    { day: "Thursday", open: "12:00", close: "23:00", closed: false },
    { day: "Friday", open: "12:00", close: "23:59", closed: false },
    { day: "Saturday", open: "12:00", close: "23:59", closed: false },
    { day: "Sunday", open: "13:00", close: "22:00", closed: false },
  ],
  holidayClosures: [{ date: "2026-12-25", note: "Christmas Day" }],
  paymentSettings: {
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    cloverEnabled: false,
    cloverAccessToken: "",
    cloverPrivateKey: "",
    cloverMerchantId: "",
    cloverApiBaseUrl: "https://scl-sandbox.dev.clover.com",
    cloverDefaultCurrency: "gbp",
  },
  aboutChef: {
    sectionTitle: "Meet Our Chef",
    chefName: "Chef Ahmad Khoury",
    bio: "Born in Beirut and trained in the finest Lebanese kitchens, Chef Ahmad brings over two decades of culinary expertise to Eltham. Every dish is crafted with love, using traditional family recipes passed down through generations.",
    imageUrl: "",
    experienceText: "20+ Years Experience",
  },
  contactInfo: {
    phone: "07466 305 669",
    email: "hello@lebaneseflames.co.uk",
    address: "381 Footscray Road, New Eltham, London SE9 2DR",
    whatsapp: "447466305669",
  },
  offerPopup: {
    enabled: true,
    title: "Welcome Offer 🔥",
    description: "Get 10% OFF your first order with code WELCOME10.",
    promoCode: "WELCOME10",
    ctaText: "Order now",
    ctaLink: "/menu",
    cashbackAmount: 0,
  },
};

export const demoAnalytics = {
  totalOrders: 128,
  totalRevenue: 3240.5,
  peakHour: 19,
  topItems: [
    { name: "Chicken Shawarma Wrap", count: 45 },
    { name: "Lamb Kofta Grill", count: 33 },
    { name: "Falafel Bowl", count: 24 },
  ],
  repeatCustomers: 31,
  promoPerformance: [
    { code: "WELCOME10", orders: 22, revenue: 420, discount: 58 },
    { code: "FLAMES5", orders: 14, revenue: 268, discount: 35 },
  ],
  hourlyOrders: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hour >= 18 && hour <= 21 ? 12 - Math.abs(19 - hour) * 3 : Math.max(0, 3 - Math.abs(13 - hour)),
  })),
  weekdayOrders: [
    { day: "Sun", count: 14, revenue: 340 },
    { day: "Mon", count: 16, revenue: 390 },
    { day: "Tue", count: 18, revenue: 445 },
    { day: "Wed", count: 19, revenue: 472 },
    { day: "Thu", count: 20, revenue: 501 },
    { day: "Fri", count: 21, revenue: 548 },
    { day: "Sat", count: 20, revenue: 544.5 },
  ],
  dailyOrders: Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      date: date.toISOString().slice(0, 10),
      count: 14 + index,
      revenue: 310 + index * 42,
    };
  }),
  peakWindow: { label: "6-9 PM", orders: 47, revenue: 1224 },
  cashbackSummary: {
    today: 18,
    week: 96,
    month: 348,
  },
  cashbackDaily: Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      date: date.toISOString().slice(0, 10),
      amount: [8, 10, 12, 14, 16, 18, 18][index],
    };
  }),
};

export const demoPromotions = [
  {
    _id: "promo-1",
    code: "WELCOME10",
    description: "10% off first order",
    discountType: "percent",
    value: 10,
    minSubtotal: 15,
    maxDiscount: 8,
    active: true,
    firstOrderOnly: true,
  },
  {
    _id: "promo-2",
    code: "FLAMES5",
    description: "£5 off orders above £30",
    discountType: "amount",
    value: 5,
    minSubtotal: 30,
    maxDiscount: 5,
    active: false,
  },
];

export const demoInactiveCustomers = [
  { email: "nora.demo@example.com", lastOrderAt: "2026-01-12T18:00:00.000Z" },
  { email: "adil.demo@example.com", lastOrderAt: "2026-01-08T20:15:00.000Z" },
];

export const demoPayments = [
  {
    id: 101,
    transaction_id: "txn_demo_101",
    amount: 24,
    payment_method: "bkash",
    status: "success",
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    user_email: "sarah.demo@example.com",
  },
  {
    id: 102,
    transaction_id: "txn_demo_102",
    amount: 17,
    payment_method: "nagad",
    status: "pending",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    user_email: "ibrahim.demo@example.com",
  },
  {
    id: 103,
    transaction_id: "txn_demo_103",
    amount: 32,
    payment_method: "stripe",
    status: "failed",
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    user_email: "guest@example.com",
  },
];

export const demoPaymentSummary = {
  overview: {
    totalCount: 3,
    successCount: 1,
    failedCount: 1,
    pendingCount: 1,
    totalRevenue: 24,
  },
  byMethod: [
    { payment_method: "bkash", count: 1, total: 24 },
    { payment_method: "nagad", count: 1, total: 17 },
    { payment_method: "stripe", count: 1, total: 32 },
  ],
};

export const demoUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    isActive: true,
  },
  {
    id: 2,
    name: "Maya Editor",
    email: "editor@example.com",
    role: "editor",
    isActive: true,
  },
  {
    id: 3,
    name: "Rafi Moderator",
    email: "moderator@example.com",
    role: "moderator",
    isActive: true,
  },
  {
    id: 4,
    name: "Client Demo",
    email: "user@example.com",
    role: "user",
    isActive: false,
  },
];

export const demoContent = [
  {
    id: 401,
    title: "Ramadan Combo Offer",
    description: "Family meal offer for Ramadan season",
    status: "pending_review",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    created_by_name: "Maya Editor",
  },
  {
    id: 402,
    title: "Weekend Grill Festival",
    description: "Live grill showcase campaign",
    status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    created_by_name: "Admin User",
  },
];

export const demoReports = [
  {
    id: 501,
    content_id: 401,
    reason: "Need typo correction before publish",
    status: "reviewing",
    content_title: "Ramadan Combo Offer",
    reported_by_email: "moderator@example.com",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 502,
    content_id: 402,
    reason: "Expired campaign date",
    status: "open",
    content_title: "Weekend Grill Festival",
    reported_by_email: "admin@example.com",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export const demoActivityLogs = [
  {
    id: 901,
    action: "admin_login",
    entity_type: "user",
    entity_id: "1",
    user_email: "admin@example.com",
    user_role: "admin",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 902,
    action: "content_update",
    entity_type: "content",
    entity_id: "401",
    user_email: "moderator@example.com",
    user_role: "moderator",
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 903,
    action: "admin_user_role_update",
    entity_type: "user",
    entity_id: "4",
    user_email: "admin@example.com",
    user_role: "admin",
    created_at: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
  },
];
