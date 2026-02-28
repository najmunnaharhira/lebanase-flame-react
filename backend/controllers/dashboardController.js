import { getAdminDashboard } from "../services/adminDashboardService.js";

export const getDashboard = async (_req, res) => {
  const dashboard = await getAdminDashboard();
  res.json(dashboard);
};
