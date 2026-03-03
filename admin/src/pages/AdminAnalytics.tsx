import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { demoAnalytics } from "@/lib/adminDemoData";
import { API_BASE_URL } from "@/lib/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

interface AnalyticsResponse {
  totalOrders: number;
  totalRevenue: number;
  peakHour: number;
  topItems: { name: string; count: number }[];
  repeatCustomers: number;
  hourlyOrders: { hour: number; count: number }[];
  weekdayOrders: { day: string; count: number; revenue: number }[];
  dailyOrders: { date: string; count: number; revenue: number }[];
  peakWindow: { label: string; orders: number; revenue: number };
  promoPerformance?: { code: string; orders: number; revenue: number; discount: number }[];
  cashbackSummary?: { today: number; week: number; month: number };
  cashbackDaily?: { date: string; amount: number }[];
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
          headers: getAdminAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Failed to load analytics");
        }
        const result = await response.json();
        setData(result);
        setIsDemoMode(false);
      } catch (err) {
        setData(demoAnalytics as AnalyticsResponse);
        setIsDemoMode(true);
        setError("API unavailable. Showing demo analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const dailyChartData = useMemo(() => {
    if (!data) return [];
    return data.dailyOrders.map((entry) => ({
      ...entry,
      label: new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  }, [data]);

  const cashbackChartData = useMemo(() => {
    if (!data?.cashbackDaily) return [];
    return data.cashbackDaily.map((entry) => ({
      ...entry,
      label: new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Business analytics"
          subtitle="Track performance and peak ordering times."
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading analytics...
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Total orders</p>
                <p className="text-2xl font-semibold text-foreground">{data.totalOrders}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Total revenue</p>
                <p className="text-2xl font-semibold text-foreground">
                  £{data.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Peak hour</p>
                <p className="text-2xl font-semibold text-foreground">
                  {data.peakHour}:00
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Orders (last 7 days)
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#ef5b2a" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Orders by weekday
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weekdayOrders}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Top items</h2>
              {data.topItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales data yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topItems}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Promo performance
              </h2>
              {!data.promoPerformance || data.promoPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No promo redemptions yet.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  {data.promoPerformance.map((promo) => (
                    <div key={promo.code} className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{promo.code}</span>
                      <span className="text-muted-foreground">
                        {promo.orders} orders · £{promo.revenue.toFixed(2)} revenue · £
                        {promo.discount.toFixed(2)} discount
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Repeat customers</p>
                <p className="text-2xl font-semibold text-foreground">{data.repeatCustomers}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Peak window (6–9 PM)</p>
                <p className="text-2xl font-semibold text-foreground">{data.peakWindow.orders} orders</p>
                <p className="text-sm text-muted-foreground">£{data.peakWindow.revenue.toFixed(2)} revenue</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Cashback summary
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-semibold text-foreground">
                    £{Number(data.cashbackSummary?.today || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last 7 days</p>
                  <p className="text-2xl font-semibold text-foreground">
                    £{Number(data.cashbackSummary?.week || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                  <p className="text-2xl font-semibold text-foreground">
                    £{Number(data.cashbackSummary?.month || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Cashback per day (last 7 days)</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashbackChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(value: number | string) => [`£${Number(value).toFixed(2)}`, "Cashback"]} />
                      <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Hourly order trend
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default AdminAnalytics;
