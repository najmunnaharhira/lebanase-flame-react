import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminMenu from "./pages/AdminMenu";
import AdminOrders from "./pages/AdminOrders";
import AdminSettings from "./pages/AdminSettings";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminPromotions from "./pages/AdminPromotions";
import AdminPayments from "./pages/AdminPayments";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/menu" element={<AdminMenu />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/promotions" element={<AdminPromotions />} />
      <Route path="*" element={<AdminLogin />} />
    </Routes>
  </BrowserRouter>
);

export default App;
