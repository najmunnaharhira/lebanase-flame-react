import { AppSettings } from "../models/AppSettings.js";

const defaultOpeningHours = [
  { day: "Monday", open: "12:00", close: "23:00", closed: false },
  { day: "Tuesday", open: "12:00", close: "23:00", closed: false },
  { day: "Wednesday", open: "12:00", close: "23:00", closed: false },
  { day: "Thursday", open: "12:00", close: "23:00", closed: false },
  { day: "Friday", open: "12:00", close: "23:00", closed: false },
  { day: "Saturday", open: "12:00", close: "23:00", closed: false },
  { day: "Sunday", open: "12:00", close: "23:00", closed: false },
];

export const getAppSettings = async () => {
  let settings = await AppSettings.findOne().lean();
  if (!settings) {
    settings = await AppSettings.create({ openingHours: defaultOpeningHours });
    return settings.toObject();
  }
  return settings;
};

export const updateAppSettings = async (payload) => {
  const current = await getAppSettings();
  const next = {
    deliveryFee: Number(payload.deliveryFee ?? current.deliveryFee ?? 2.5),
    minimumOrder: Number(payload.minimumOrder ?? current.minimumOrder ?? 12),
    freeDeliveryThreshold: Number(
      payload.freeDeliveryThreshold ?? current.freeDeliveryThreshold ?? 25,
    ),
    collectionEnabled:
      typeof payload.collectionEnabled === "boolean"
        ? payload.collectionEnabled
        : current.collectionEnabled,
    deliveryEnabled:
      typeof payload.deliveryEnabled === "boolean"
        ? payload.deliveryEnabled
        : current.deliveryEnabled,
    estimatedDeliveryTime:
      payload.estimatedDeliveryTime ||
      current.estimatedDeliveryTime ||
      "25-35 min",
    restaurantOpen:
      typeof payload.restaurantOpen === "boolean"
        ? payload.restaurantOpen
        : current.restaurantOpen,
    openingHours: Array.isArray(payload.openingHours)
      ? payload.openingHours
      : current.openingHours || defaultOpeningHours,
  };

  const updated = await AppSettings.findByIdAndUpdate(current._id, next, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();

  return updated;
};
