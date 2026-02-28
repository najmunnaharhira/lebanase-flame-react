import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Address, OrderInput, UserProfile } from "@/types/order";

const emptyAddress: Address = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "London",
  postcode: "",
};

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const CheckoutContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    subtotal,
    deliveryFee,
    deliveryMode,
    setDeliveryMode,
    postcode,
    setPostcode,
    isValidPostcode,
    loyaltyDiscount,
    clearCart,
  } = useCart();
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [cardName, setCardName] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const stripe = useStripe();
  const elements = useElements();
  const isStripeConfigured = Boolean(stripePublishableKey);

  useEffect(() => {
    if (!isStripeConfigured) {
      setPaymentMethod("cash");
    }
  }, [isStripeConfigured]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee - loyaltyDiscount);
  }, [subtotal, deliveryFee, loyaltyDiscount]);

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const profile = await apiRequest<UserProfile>(`/users/${user.uid}`);
        if (profile.addresses?.length) {
          const primary = profile.addresses[0];
          setAddress(primary);
          setPostcode(primary.postcode || "");
        }
      } catch {
        // Silent: user can still enter address manually.
      }
    };
    loadProfile();
  }, [user, setPostcode]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (field === "postcode") {
      setPostcode(value);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (paymentMethod === "card") {
        if (!isStripeConfigured || !stripe || !elements) {
          setError("Card payments are not configured yet.");
          setIsSubmitting(false);
          return;
        }

        if (!cardName.trim() || !billingPostcode.trim()) {
          setError("Please complete all card details to continue.");
          setIsSubmitting(false);
          return;
        }
      }

      const order: OrderInput = {
        userId: user?.uid,
        email,
        deliveryMode,
        address: deliveryMode === "delivery" ? address : undefined,
        items,
        subtotal,
        deliveryFee,
        loyaltyDiscount,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "cash_on_collection" : "pending",
        notes,
      };

      if (paymentMethod === "card") {
        const paymentIntent = await apiRequest<{ clientSecret: string; paymentIntentId: string }>(
          `/payments/intent`,
          {
            method: "POST",
            body: JSON.stringify({
              email,
              items,
              deliveryFee,
              loyaltyDiscount,
              total,
            }),
          }
        );

        const cardElement = elements?.getElement(CardElement);
        if (!cardElement) {
          setError("Card payments are not available.");
          setIsSubmitting(false);
          return;
        }

        const confirmation = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardName.trim(),
              email,
              address: {
                postal_code: billingPostcode.trim(),
              },
            },
          },
        });

        if (confirmation.error) {
          setError(confirmation.error.message || "Payment failed.");
          setIsSubmitting(false);
          return;
        }

        if (confirmation.paymentIntent?.status !== "succeeded") {
          setError("Payment did not complete.");
          setIsSubmitting(false);
          return;
        }

        order.paymentStatus = "paid";
        order.paymentIntentId = paymentIntent.paymentIntentId;
      }

      const createdOrder = await apiRequest<{ _id: string }>(`/orders`, {
        method: "POST",
        body: JSON.stringify(order),
      });

      clearCart();
      navigate(`/order-confirmation/${createdOrder._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Your basket is empty
          </h1>
          <Button variant="flame" asChild>
            <Link to="/menu">Browse menu</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Checkout
              </h1>
              <p className="text-sm text-muted-foreground">
                Confirm your details and place your order.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-card p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Contact email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={deliveryMode === "delivery" ? "flame" : "outline"}
                  onClick={() => setDeliveryMode("delivery")}
                >
                  Delivery
                </Button>
                <Button
                  type="button"
                  variant={deliveryMode === "collection" ? "flame" : "outline"}
                  onClick={() => setDeliveryMode("collection")}
                >
                  Collection
                </Button>
              </div>

              {deliveryMode === "delivery" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={address.fullName}
                      onChange={(event) => handleAddressChange("fullName", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={address.phone}
                      onChange={(event) => handleAddressChange("phone", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="line1">Address line 1</Label>
                    <Input
                      id="line1"
                      value={address.line1}
                      onChange={(event) => handleAddressChange("line1", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="line2">Address line 2</Label>
                    <Input
                      id="line2"
                      value={address.line2 || ""}
                      onChange={(event) => handleAddressChange("line2", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(event) => handleAddressChange("city", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={address.postcode}
                      onChange={(event) => handleAddressChange("postcode", event.target.value)}
                      required
                    />
                    {!isValidPostcode && postcode && (
                      <p className="text-xs text-destructive">Postcode is outside delivery area.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Order notes (optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Payment method</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => isStripeConfigured && setPaymentMethod("card")}
                    disabled={!isStripeConfigured}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    } ${!isStripeConfigured ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <p className="font-medium text-foreground">Card (UK)</p>
                    <p className="text-xs text-muted-foreground">
                      Visa, Mastercard, Maestro, Amex
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <p className="font-medium text-foreground">Cash on collection</p>
                    <p className="text-xs text-muted-foreground">
                      Pay when you collect your order
                    </p>
                  </button>
                </div>
                {!isStripeConfigured && (
                  <p className="text-xs text-muted-foreground">
                    Card payments are offline. Add `VITE_STRIPE_PUBLISHABLE_KEY` to enable them.
                  </p>
                )}
              </div>

              {paymentMethod === "card" && isStripeConfigured && (
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-2 py-1">Visa</span>
                    <span className="rounded-full border border-border px-2 py-1">Mastercard</span>
                    <span className="rounded-full border border-border px-2 py-1">Maestro</span>
                    <span className="rounded-full border border-border px-2 py-1">Amex</span>
                    <span className="rounded-full border border-border px-2 py-1">UK cards only</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported cards: Visa, Mastercard, Maestro, Amex (UK).
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Cardholder name</Label>
                    <Input
                      id="card-name"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Card details</Label>
                    <div className="rounded-md border border-input bg-background px-3 py-3">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              color: "#1f1f1f",
                              fontSize: "16px",
                              "::placeholder": { color: "#9ca3af" },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-postcode">Billing postcode</Label>
                    <Input
                      id="billing-postcode"
                      value={billingPostcode}
                      onChange={(event) => setBillingPostcode(event.target.value)}
                      placeholder="e.g. E1 6AN"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Card details are used to process your payment and are not stored.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                variant="flame"
                className="w-full"
                disabled={isSubmitting || (deliveryMode === "delivery" && !isValidPostcode)}
              >
                {isSubmitting ? "Placing order..." : "Place order"}
              </Button>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE" : `£${deliveryFee.toFixed(2)}`}</span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-olive">
                    <span>Loyalty discount</span>
                    <span>-£{loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Checkout = () => (
  <Elements stripe={stripePromise}>
    <CheckoutContent />
  </Elements>
);

export default Checkout;
