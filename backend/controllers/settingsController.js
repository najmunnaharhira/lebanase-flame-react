import {
  getAppSettings,
  updateAppSettings,
} from "../services/settingsService.js";

export const getSettings = async (_req, res) => {
  const settings = await getAppSettings();
  res.json(settings);
};

export const putSettings = async (req, res) => {
  const settings = await updateAppSettings(req.body || {});
  res.json(settings);
};
