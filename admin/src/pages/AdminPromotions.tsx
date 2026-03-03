import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { demoInactiveCustomers, demoPromotions } from "@/lib/adminDemoData";
import { apiRequest, DEFAULT_BUSINESS_NAME, fetchBusinessBranding } from "@/lib/api";
import { Promotion } from "@/types/promotion";

const defaultForm = {
  code: "",
  description: "",
  discountType: "percent" as Promotion["discountType"],
  value: 10,
  minSubtotal: 0,
  maxDiscount: 0,
  startsAt: "",
  endsAt: "",
  firstOrderOnly: false,
  minCompletedOrders: 0,
  active: true,
};

const AdminPromotions = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [inactiveCustomers, setInactiveCustomers] = useState<{ email: string; lastOrderAt: string }[]>([]);
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);
  const [campaignSubject, setCampaignSubject] = useState(`We miss you at ${DEFAULT_BUSINESS_NAME}`);
  const [campaignMessage, setCampaignMessage] = useState(
    "It’s been a while! Enjoy a special offer on your next order."
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadPromotions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await apiRequest<Promotion[]>("/promotions", {
          headers: getAdminAuthHeaders(),
        });
        setPromotions(data);
        setIsDemoMode(false);
      } catch (err) {
        setPromotions(demoPromotions as Promotion[]);
        setInactiveCustomers(demoInactiveCustomers);
        setIsDemoMode(true);
        setError("API unavailable. Showing demo promotions.");
      } finally {
        setIsLoading(false);
      }
    };

    const loadBranding = async () => {
      try {
        const branding = await fetchBusinessBranding();
        const resolvedName = branding.businessName || DEFAULT_BUSINESS_NAME;
        setBusinessName(resolvedName);
        setCampaignSubject((prev) =>
          prev === `We miss you at ${DEFAULT_BUSINESS_NAME}`
            ? `We miss you at ${resolvedName}`
            : prev,
        );
      } catch {
      }
    };

    loadPromotions();
    loadBranding();
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const handleCreate = async () => {
    if (isDemoMode) {
      const created: Promotion = {
        _id: `promo-demo-${Date.now()}`,
        code: form.code.trim().toUpperCase() || `DEMO${Math.floor(Math.random() * 100)}`,
        description: form.description,
        discountType: form.discountType,
        value: form.value,
        minSubtotal: form.minSubtotal,
        maxDiscount: form.maxDiscount,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        firstOrderOnly: form.firstOrderOnly,
        minCompletedOrders: form.minCompletedOrders,
        active: form.active,
      };
      setPromotions((prev) => [created, ...prev]);
      setForm(defaultForm);
      return;
    }

    try {
      setError("");
      const created = await apiRequest<Promotion>("/promotions", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase(),
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        }),
      });
      setPromotions((prev) => [created, ...prev]);
      setForm(defaultForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create promotion");
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    if (isDemoMode) {
      setPromotions((prev) =>
        prev.map((item) => (item._id === promo._id ? { ...item, active: !promo.active } : item))
      );
      return;
    }

    try {
      const updated = await apiRequest<Promotion>(`/promotions/${promo._id}`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ active: !promo.active }),
      });
      setPromotions((prev) => prev.map((item) => (item._id === promo._id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update promotion");
    }
  };

  const handleLoadInactive = async () => {
    if (isDemoMode) {
      setInactiveCustomers(demoInactiveCustomers);
      return;
    }

    try {
      const data = await apiRequest<{ email: string; lastOrderAt: string }[]>(
        "/admin/marketing/inactive?days=30",
        {
          headers: getAdminAuthHeaders(),
        }
      );
      setInactiveCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load inactive customers");
    }
  };

  const handleSendCampaign = async () => {
    if (inactiveCustomers.length === 0) {
      setError("No inactive customers to send.");
      return;
    }
    if (isDemoMode) {
      setError("Demo mode: campaign simulated successfully.");
      return;
    }
    try {
      setError("");
      await apiRequest<{ sent: number; skipped: number }>("/admin/marketing/campaigns/send", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          subject: campaignSubject,
          message: campaignMessage,
          recipients: inactiveCustomers.map((customer) => customer.email),
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send campaign");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Promotions"
          subtitle={`Create promo codes, first-order deals, and limited-time offers for ${businessName}.`}
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-foreground">New promotion</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="FLAMES10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-value">Value</Label>
                <Input
                  id="promo-value"
                  type="number"
                  value={form.value}
                  onChange={(event) => setForm((prev) => ({ ...prev, value: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-type">Discount type</Label>
                <select
                  id="promo-type"
                  aria-label="Promotion discount type"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.discountType}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, discountType: event.target.value as Promotion["discountType"] }))
                  }
                >
                  <option value="percent">Percent</option>
                  <option value="amount">Amount (£)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-min">Minimum subtotal</Label>
                <Input
                  id="promo-min"
                  type="number"
                  value={form.minSubtotal}
                  onChange={(event) => setForm((prev) => ({ ...prev, minSubtotal: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-max">Max discount</Label>
                <Input
                  id="promo-max"
                  type="number"
                  value={form.maxDiscount}
                  onChange={(event) => setForm((prev) => ({ ...prev, maxDiscount: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-min-orders">Min completed orders</Label>
                <Input
                  id="promo-min-orders"
                  type="number"
                  value={form.minCompletedOrders}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, minCompletedOrders: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-start">Starts</Label>
                <Input
                  id="promo-start"
                  type="date"
                  value={form.startsAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-end">Ends</Label>
                <Input
                  id="promo-end"
                  type="date"
                  value={form.endsAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="promo-description">Description</Label>
                <Input
                  id="promo-description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="10% off first order"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.firstOrderOnly}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstOrderOnly: event.target.checked }))}
                />
                First-order only
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                />
                Active
              </label>
            </div>
            <Button type="button" variant="flame" onClick={handleCreate}>
              Create promotion
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Active promotions</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading promotions...</p>
            ) : promotions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No promotions yet.</p>
            ) : (
              <div className="space-y-3">
                {promotions.map((promo) => (
                  <div key={promo._id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{promo.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {promo.discountType === "percent"
                            ? `${promo.value}% off`
                            : `£${promo.value.toFixed(2)} off`}{" "}
                          · {promo.active ? "Active" : "Paused"}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleToggleActive(promo)}>
                        {promo.active ? "Pause" : "Activate"}
                      </Button>
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-2">{promo.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Inactive customers</h2>
              <p className="text-sm text-muted-foreground">
                Target customers who have not ordered in the last 30 days.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleLoadInactive}>
              Load inactive list
            </Button>
          </div>

          {inactiveCustomers.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-subject">Email subject</Label>
                <Input
                  id="campaign-subject"
                  value={campaignSubject}
                  onChange={(event) => setCampaignSubject(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-message">Message</Label>
                <Input
                  id="campaign-message"
                  value={campaignMessage}
                  onChange={(event) => setCampaignMessage(event.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{inactiveCustomers.length} inactive customers loaded</span>
                <Button type="button" variant="flame" onClick={handleSendCampaign}>
                  Send campaign
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPromotions;
