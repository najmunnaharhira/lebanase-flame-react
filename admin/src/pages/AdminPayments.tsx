import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession, hasAdminSession } from "@/lib/adminAuth";

interface PaymentRow {
  id: number;
  transaction_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  user_email?: string;
}

interface PaymentsSummary {
  overview: {
    totalCount: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    totalRevenue: number;
  };
  byMethod: { payment_method: string; count: number; total: number }[];
}

const AdminPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [paymentsRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/payments`),
          fetch(`${API_BASE_URL}/admin/payments/summary`),
        ]);

        if (!paymentsRes.ok || !summaryRes.ok) {
          throw new Error("Failed to load payments data");
        }

        const paymentsJson = await paymentsRes.json();
        const summaryJson = await summaryRes.json();
        setPayments(paymentsJson);
        setSummary(summaryJson);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load payments");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Payments"
          subtitle="View recent transactions and payment performance."
          onLogout={handleLogout}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading payments...
          </div>
        ) : (
          <>
            {summary && (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total payments
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.overview.totalCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Successful
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.overview.successCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Failed
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.overview.failedCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Revenue (success)
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    £{Number(summary.overview.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card overflow-x-auto">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Recent transactions
              </h2>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">User</th>
                      <th className="text-left py-2 pr-4">Method</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-right py-2 pl-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-4">
                          {new Date(payment.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          {payment.user_email || <span className="text-muted-foreground">Guest</span>}
                        </td>
                        <td className="py-2 pr-4 capitalize">
                          {payment.payment_method}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              payment.status === "success"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : payment.status === "pending"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-2 pl-4 text-right">
                          £{Number(payment.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPayments;

