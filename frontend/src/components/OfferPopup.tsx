import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OFFER_POPUP_SESSION_KEY = "lf_offer_popup_seen";

const defaultOfferPopup = {
  enabled: true,
  title: "Welcome Offer 🔥",
  description: "Get 10% OFF your first order with code WELCOME10.",
  promoCode: "WELCOME10",
  ctaText: "Order now",
  ctaLink: "/menu",
  cashbackAmount: 0,
};

export const OfferPopup = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [offerConfig, setOfferConfig] = useState(defaultOfferPopup);

  const canShowOnRoute = useMemo(() => {
    return !location.pathname.startsWith("/admin");
  }, [location.pathname]);

  useEffect(() => {
    if (!canShowOnRoute) return;

    let isMounted = true;
    const loadOfferSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/business`);
        if (!response.ok) {
          throw new Error("Failed to load offer popup settings");
        }
        const data = await response.json();
        const offerPopup = data?.offerPopup || {};
        const resolved = {
          enabled:
            typeof offerPopup.enabled === "boolean"
              ? offerPopup.enabled
              : defaultOfferPopup.enabled,
          title: String(offerPopup.title || defaultOfferPopup.title).trim(),
          description: String(
            offerPopup.description || defaultOfferPopup.description,
          ).trim(),
          promoCode: String(offerPopup.promoCode || defaultOfferPopup.promoCode)
            .trim()
            .toUpperCase(),
          ctaText: String(offerPopup.ctaText || defaultOfferPopup.ctaText).trim(),
          ctaLink: String(offerPopup.ctaLink || defaultOfferPopup.ctaLink).trim(),
          cashbackAmount: Math.max(0, Number(offerPopup.cashbackAmount || 0)),
        };
        if (!isMounted) return;
        setOfferConfig(resolved);

        if (!resolved.enabled) return;
        const hasSeenPopup = localStorage.getItem(OFFER_POPUP_SESSION_KEY) === "true";
        if (hasSeenPopup) return;

        localStorage.setItem(OFFER_POPUP_SESSION_KEY, "true");
        setIsOpen(true);
      } catch {
        if (!isMounted) return;
        const hasSeenPopup = localStorage.getItem(OFFER_POPUP_SESSION_KEY) === "true";
        if (hasSeenPopup) return;
        localStorage.setItem(OFFER_POPUP_SESSION_KEY, "true");
        setOfferConfig(defaultOfferPopup);
        setIsOpen(true);
      }
    };

    loadOfferSettings();
    return () => {
      isMounted = false;
    };
  }, [canShowOnRoute]);

  if (!canShowOnRoute) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{offerConfig.title}</DialogTitle>
          <DialogDescription>
            {offerConfig.description}{" "}
            {offerConfig.promoCode ? (
              <span>
                Use code{" "}
                <span className="font-semibold text-foreground">{offerConfig.promoCode}</span>.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {offerConfig.cashbackAmount > 0
            ? `Cashback £${offerConfig.cashbackAmount.toFixed(2)} is added to each successful order.`
            : "Limited-time welcome deal. Apply the code at checkout."}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Maybe later
          </Button>
          <Button asChild variant="flame" onClick={() => setIsOpen(false)}>
            <Link to={offerConfig.ctaLink || "/menu"}>{offerConfig.ctaText || "Order now"}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferPopup;