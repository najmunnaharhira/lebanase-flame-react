import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { demoBusinessSettings } from "@/lib/adminDemoData";
import { API_BASE_URL, resolveAssetUrl } from "@/lib/api";
import { BusinessSettings, HolidayClosure, OpeningHour } from "@/types/settings";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const buildDefaultHours = (): OpeningHour[] =>
  WEEK_DAYS.map((day) => ({
    day,
    open: "12:00",
    close: "23:00",
    closed: false,
  }));

const defaultPaymentSettings = {
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  cloverEnabled: false,
  cloverAccessToken: "",
  cloverPrivateKey: "",
  cloverMerchantId: "",
  cloverApiBaseUrl: "https://scl-sandbox.dev.clover.com",
  cloverDefaultCurrency: "gbp",
};

const defaultAboutChef = {
  sectionTitle: "Meet Our Chef",
  chefName: "Chef Ahmad Khoury",
  bio: "Born in Beirut and trained in the finest Lebanese kitchens, Chef Ahmad brings over two decades of culinary expertise to Eltham. Every dish is crafted with love, using traditional family recipes passed down through generations.",
  imageUrl: "",
  experienceText: "20+ Years Experience",
};

const defaultContactInfo = {
  phone: "07466 305 669",
  email: "hello@lebaneseflames.co.uk",
  address: "381 Footscray Road, New Eltham, London SE9 2DR",
  whatsapp: "447466305669",
};

const defaultOfferPopup = {
  enabled: true,
  title: "Welcome Offer 🔥",
  description: "Get 10% OFF your first order with code WELCOME10.",
  promoCode: "WELCOME10",
  ctaText: "Order now",
  ctaLink: "/menu",
  cashbackAmount: 0,
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BusinessSettings>({
<<<<<<< Updated upstream
    businessName: "Lebanese Flames",
=======
>>>>>>> Stashed changes
    logoUrl: "",
    openingHours: buildDefaultHours(),
    holidayClosures: [],
    paymentSettings: defaultPaymentSettings,
    aboutChef: defaultAboutChef,
    contactInfo: defaultContactInfo,
    offerPopup: defaultOfferPopup,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [newHoliday, setNewHoliday] = useState<HolidayClosure>({ date: "", note: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/business/admin`, {
          headers: getAdminAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Failed to load settings");
        }
        const data = await response.json();
        setSettings({
<<<<<<< Updated upstream
          businessName: data.businessName || "Lebanese Flames",
=======
>>>>>>> Stashed changes
          logoUrl: data.logoUrl || "",
          openingHours: data.openingHours?.length ? data.openingHours : buildDefaultHours(),
          holidayClosures: data.holidayClosures || [],
          paymentSettings: {
            ...defaultPaymentSettings,
            ...(data.paymentSettings || {}),
          },
          aboutChef: {
            ...defaultAboutChef,
            ...(data.aboutChef || {}),
          },
          contactInfo: {
            ...defaultContactInfo,
            ...(data.contactInfo || {}),
          },
          offerPopup: {
            ...defaultOfferPopup,
            ...(data.offerPopup || {}),
          },
        });
        setIsDemoMode(false);
      } catch (err) {
        setSettings(demoBusinessSettings);
        setIsDemoMode(true);
        setMessage("API unavailable. Showing demo business settings.");
      }
    };

    loadSettings();
  }, [navigate]);

  useEffect(() => {
    if (logoFile) {
      const objectUrl = URL.createObjectURL(logoFile);
      setLogoPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

<<<<<<< Updated upstream
    setLogoPreview(resolveAssetUrl(settings.logoUrl || ""));
=======
    setLogoPreview((settings.logoUrl || "").trim());
>>>>>>> Stashed changes
  }, [logoFile, settings.logoUrl]);

  const handleHourChange = (index: number, field: keyof OpeningHour, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((hour, i) =>
        i === index ? { ...hour, [field]: value } : hour
      ),
    }));
  };

  const handleAddHoliday = () => {
    if (!newHoliday.date) return;
    setSettings((prev) => ({
      ...prev,
      holidayClosures: [...prev.holidayClosures, newHoliday],
    }));
    setNewHoliday({ date: "", note: "" });
  };

  const handleRemoveHoliday = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      holidayClosures: prev.holidayClosures.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (isDemoMode) {
      setMessage("Demo mode: settings saved locally for preview.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      let resolvedLogoUrl = (settings.logoUrl || "").trim();

      if (logoFile) {
        const formData = new FormData();
        formData.append("image", logoFile);

        const uploadResponse = await fetch(`${API_BASE_URL}/menu/upload`, {
          method: "POST",
          headers: getAdminAuthHeaders(),
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(errorText || "Failed to upload logo image");
        }

        const uploadResult = await uploadResponse.json();
        resolvedLogoUrl = String(uploadResult.url || "").trim();
      }

      const response = await fetch(`${API_BASE_URL}/settings/business`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          ...settings,
<<<<<<< Updated upstream
          businessName: (settings.businessName || "").trim() || "Lebanese Flames",
          logoUrl: resolvedLogoUrl,
          paymentSettings: {
            ...settings.paymentSettings,
            stripePublishableKey: (settings.paymentSettings?.stripePublishableKey || "").trim(),
            stripeSecretKey: (settings.paymentSettings?.stripeSecretKey || "").trim(),
            stripeWebhookSecret: (settings.paymentSettings?.stripeWebhookSecret || "").trim(),
            cloverAccessToken: (settings.paymentSettings?.cloverAccessToken || "").trim(),
            cloverPrivateKey: (settings.paymentSettings?.cloverPrivateKey || "").trim(),
            cloverMerchantId: (settings.paymentSettings?.cloverMerchantId || "").trim(),
            cloverApiBaseUrl: (settings.paymentSettings?.cloverApiBaseUrl || "").trim(),
            cloverDefaultCurrency:
              (settings.paymentSettings?.cloverDefaultCurrency || "gbp").trim().toLowerCase(),
          },
          aboutChef: {
            sectionTitle: (settings.aboutChef?.sectionTitle || "").trim(),
            chefName: (settings.aboutChef?.chefName || "").trim(),
            bio: (settings.aboutChef?.bio || "").trim(),
            imageUrl: (settings.aboutChef?.imageUrl || "").trim(),
            experienceText: (settings.aboutChef?.experienceText || "").trim(),
          },
          contactInfo: {
            phone: (settings.contactInfo?.phone || "").trim(),
            email: (settings.contactInfo?.email || "").trim(),
            address: (settings.contactInfo?.address || "").trim(),
            whatsapp: (settings.contactInfo?.whatsapp || "").trim(),
          },
          offerPopup: {
            enabled: Boolean(settings.offerPopup?.enabled),
            title: (settings.offerPopup?.title || "").trim(),
            description: (settings.offerPopup?.description || "").trim(),
            promoCode: (settings.offerPopup?.promoCode || "").trim().toUpperCase(),
            ctaText: (settings.offerPopup?.ctaText || "").trim(),
            ctaLink: (settings.offerPopup?.ctaLink || "/menu").trim(),
            cashbackAmount: Math.max(0, Number(settings.offerPopup?.cashbackAmount || 0)),
          },
=======
          logoUrl: resolvedLogoUrl,
>>>>>>> Stashed changes
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save settings");
      }

      const data = await response.json();
      setSettings({
<<<<<<< Updated upstream
        businessName: data.businessName || "Lebanese Flames",
=======
>>>>>>> Stashed changes
        logoUrl: data.logoUrl || "",
        openingHours: data.openingHours || buildDefaultHours(),
        holidayClosures: data.holidayClosures || [],
        paymentSettings: {
          ...defaultPaymentSettings,
          ...(data.paymentSettings || {}),
        },
        aboutChef: {
          ...defaultAboutChef,
          ...(data.aboutChef || {}),
        },
        contactInfo: {
          ...defaultContactInfo,
          ...(data.contactInfo || {}),
        },
        offerPopup: {
          ...defaultOfferPopup,
          ...(data.offerPopup || {}),
        },
      });
      setLogoFile(null);
      setMessage("Business settings saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const sortedHolidays = useMemo(
    () => [...settings.holidayClosures].sort((a, b) => a.date.localeCompare(b.date)),
    [settings.holidayClosures]
  );

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Business hours"
          subtitle="Set opening hours and holiday closures."
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        <div className="bg-card rounded-2xl shadow-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Branding</h2>
          <div className="grid gap-3 md:grid-cols-2">
<<<<<<< Updated upstream
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                placeholder="Lebanese Flames"
                value={settings.businessName || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    businessName: event.target.value,
                  }))
                }
              />
            </div>
=======
>>>>>>> Stashed changes
            <div className="space-y-2">
              <Label htmlFor="logo-url">Website logo URL</Label>
              <Input
                id="logo-url"
                placeholder="https://..."
                value={settings.logoUrl || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    logoUrl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-file">Or upload logo image</Label>
              <Input
                id="logo-file"
                type="file"
                accept="image/*"
                onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
              />
            </div>
          </div>
          {logoPreview && (
            <div className="mt-3 flex items-center gap-3">
              <img src={logoPreview} alt="Website logo preview" className="h-14 w-auto rounded border border-border" />
              <span className="text-xs text-muted-foreground">Logo preview</span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Opening hours</h2>
          <div className="grid gap-4">
            {settings.openingHours.map((hour, index) => (
              <div key={hour.day} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] items-center">
                <span className="text-sm font-medium text-foreground">{hour.day}</span>
                <Input
                  type="time"
                  value={hour.open}
                  onChange={(event) => handleHourChange(index, "open", event.target.value)}
                  disabled={hour.closed}
                />
                <Input
                  type="time"
                  value={hour.close}
                  onChange={(event) => handleHourChange(index, "close", event.target.value)}
                  disabled={hour.closed}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={hour.closed}
                    onChange={(event) => handleHourChange(index, "closed", event.target.checked)}
                  />
                  Closed
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Card payment settings</h2>
          <p className="text-xs text-muted-foreground">
            Save Stripe/Clover credentials here so backend and frontend use the same live config.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="stripe-publishable">Stripe publishable key</Label>
              <Input
                id="stripe-publishable"
                placeholder="pk_test_..."
                value={settings.paymentSettings?.stripePublishableKey || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      stripePublishableKey: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-secret">Stripe secret key</Label>
              <Input
                id="stripe-secret"
                type="password"
                placeholder="sk_test_..."
                value={settings.paymentSettings?.stripeSecretKey || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      stripeSecretKey: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-webhook">Stripe webhook secret</Label>
              <Input
                id="stripe-webhook"
                type="password"
                placeholder="whsec_..."
                value={settings.paymentSettings?.stripeWebhookSecret || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      stripeWebhookSecret: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                id="clover-enabled"
                type="checkbox"
                checked={Boolean(settings.paymentSettings?.cloverEnabled)}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      cloverEnabled: event.target.checked,
                    },
                  }))
                }
              />
              <Label htmlFor="clover-enabled">Enable Clover card checkout fallback</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clover-access">Clover access token</Label>
              <Input
                id="clover-access"
                type="password"
                value={settings.paymentSettings?.cloverAccessToken || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      cloverAccessToken: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clover-private">Clover private key</Label>
              <Input
                id="clover-private"
                type="password"
                value={settings.paymentSettings?.cloverPrivateKey || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      cloverPrivateKey: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clover-merchant">Clover merchant ID</Label>
              <Input
                id="clover-merchant"
                value={settings.paymentSettings?.cloverMerchantId || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      cloverMerchantId: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clover-api">Clover API base URL</Label>
              <Input
                id="clover-api"
                placeholder="https://scl-sandbox.dev.clover.com"
                value={settings.paymentSettings?.cloverApiBaseUrl || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      cloverApiBaseUrl: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clover-currency">Clover default currency</Label>
              <Input
                id="clover-currency"
                maxLength={3}
                value={settings.paymentSettings?.cloverDefaultCurrency || "gbp"}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    paymentSettings: {
                      ...prev.paymentSettings,
                      cloverDefaultCurrency: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">About Chef section</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chef-section-title">Section title</Label>
              <Input
                id="chef-section-title"
                value={settings.aboutChef?.sectionTitle || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutChef: {
                      ...prev.aboutChef,
                      sectionTitle: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chef-name">Chef name</Label>
              <Input
                id="chef-name"
                value={settings.aboutChef?.chefName || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutChef: {
                      ...prev.aboutChef,
                      chefName: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chef-bio">Chef bio</Label>
              <Textarea
                id="chef-bio"
                className="min-h-[120px]"
                value={settings.aboutChef?.bio || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutChef: {
                      ...prev.aboutChef,
                      bio: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chef-image">Chef image URL</Label>
              <Input
                id="chef-image"
                placeholder="https://... or /uploads/..."
                value={settings.aboutChef?.imageUrl || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutChef: {
                      ...prev.aboutChef,
                      imageUrl: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chef-experience">Experience badge text</Label>
              <Input
                id="chef-experience"
                value={settings.aboutChef?.experienceText || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutChef: {
                      ...prev.aboutChef,
                      experienceText: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Contact section</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={settings.contactInfo?.phone || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      phone: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={settings.contactInfo?.email || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      email: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact-address">Address</Label>
              <Input
                id="contact-address"
                value={settings.contactInfo?.address || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      address: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-whatsapp">WhatsApp number (digits)</Label>
              <Input
                id="contact-whatsapp"
                value={settings.contactInfo?.whatsapp || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      whatsapp: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Offer popup & cashback</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                id="offer-enabled"
                type="checkbox"
                checked={Boolean(settings.offerPopup?.enabled)}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      enabled: event.target.checked,
                    },
                  }))
                }
              />
              <Label htmlFor="offer-enabled">Show popup to first-time visitors</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-title">Popup title</Label>
              <Input
                id="offer-title"
                value={settings.offerPopup?.title || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      title: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-promo-code">Promo code</Label>
              <Input
                id="offer-promo-code"
                value={settings.offerPopup?.promoCode || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      promoCode: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="offer-description">Popup description</Label>
              <Textarea
                id="offer-description"
                className="min-h-[100px]"
                value={settings.offerPopup?.description || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      description: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-cta-text">CTA text</Label>
              <Input
                id="offer-cta-text"
                value={settings.offerPopup?.ctaText || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      ctaText: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-cta-link">CTA link</Label>
              <Input
                id="offer-cta-link"
                placeholder="/menu"
                value={settings.offerPopup?.ctaLink || "/menu"}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      ctaLink: event.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-cashback">Cashback per order (£)</Label>
              <Input
                id="offer-cashback"
                type="number"
                min={0}
                step="0.5"
                value={Number(settings.offerPopup?.cashbackAmount || 0)}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerPopup: {
                      ...prev.offerPopup,
                      cashbackAmount: Math.max(0, Number(event.target.value || 0)),
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Holiday closures</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newHoliday.date}
                onChange={(event) => setNewHoliday((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>
            <div>
              <Label>Note</Label>
              <Input
                value={newHoliday.note}
                onChange={(event) => setNewHoliday((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="e.g. Christmas Day"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={handleAddHoliday}>
                Add
              </Button>
            </div>
          </div>

          {sortedHolidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holiday closures added.</p>
          ) : (
            <div className="space-y-2">
              {sortedHolidays.map((holiday, index) => (
                <div key={`${holiday.date}-${index}`} className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {holiday.date} {holiday.note ? `· ${holiday.note}` : ""}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveHoliday(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="flame" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
          {message && <span className="text-sm text-muted-foreground">{message}</span>}
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
