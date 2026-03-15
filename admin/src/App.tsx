import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminContent from "./pages/AdminContent";
import AdminLogin from "./pages/AdminLogin";
import AdminMenu from "./pages/AdminMenu";
import AdminOrders from "./pages/AdminOrders";
import AdminPayments from "./pages/AdminPayments";
import AdminPromotions from "./pages/AdminPromotions";
import AdminSettings from "./pages/AdminSettings";
import AdminSocialLinksSections from "./pages/AdminSocialLinksSections";
import AdminUsers from "./pages/AdminUsers";
import AdminWhatsApp from "./pages/AdminWhatsApp";
import EditorDashboard from "./pages/EditorDashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLogin />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedAdminRoute roles={["editor"]} />}>
        <Route path="/editor" element={<EditorDashboard />} />
        <Route path="/admin/social" element={<AdminSocialLinksSections />} />
      </Route>
      <Route element={<ProtectedAdminRoute roles={["moderator"]} />}>
        <Route path="/lmoderstor" element={<ModeratorDashboard />} />
      </Route>

      <Route element={<ProtectedAdminRoute roles={["admin", "manager", "moderator", "editor"]} />}>
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/menu" element={<AdminMenu />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/content" element={<AdminContent />} />
      </Route>

      <Route element={<ProtectedAdminRoute roles={["admin", "manager"]} />}>
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      <Route element={<ProtectedAdminRoute roles={["admin"]} />}>
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/promotions" element={<AdminPromotions />} />
        <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
        <Route path="/admin/logs" element={<AdminActivityLogs />} />
      </Route>

      <Route path="*" element={<AdminLogin />} />
    </Routes>
  </BrowserRouter>
);

export default App;
