import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OFFER_POPUP_SESSION_KEY = "lf_offer_popup_seen";

export const OfferPopup = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const canShowOnRoute = useMemo(() => {
    return !location.pathname.startsWith("/admin");
  }, [location.pathname]);

  useEffect(() => {
    if (!canShowOnRoute) return;

    const hasSeenPopup = sessionStorage.getItem(OFFER_POPUP_SESSION_KEY) === "true";
    if (hasSeenPopup) return;

    sessionStorage.setItem(OFFER_POPUP_SESSION_KEY, "true");
    setIsOpen(true);
  }, [canShowOnRoute]);

  if (!canShowOnRoute) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome Offer 🔥</DialogTitle>
          <DialogDescription>
            Get <span className="font-semibold text-foreground">10% OFF</span> your first order with code {" "}
            <span className="font-semibold text-foreground">WELCOME10</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Limited-time welcome deal. Apply the code at checkout.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Maybe later
          </Button>
          <Button asChild variant="flame" onClick={() => setIsOpen(false)}>
            <Link to="/menu">Order now</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferPopup;