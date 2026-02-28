import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Address, OrderRecord, UserProfile } from "@/types/order";
import { Package } from "lucide-react";

const emptyAddress: Address = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "London",
  postcode: "",
};

const Profile = () => {
  const { user, isLoading, signOutUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn = !!user;
  const displayEmail = user?.email || "";

  const primaryAddress = useMemo(() => {
    if (profile?.addresses?.length) {
      return profile.addresses[0];
    }
    return null;
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const fetchedProfile = await apiRequest<UserProfile>(`/users/${user.uid}`);
        setProfile(fetchedProfile);
        if (fetchedProfile.addresses?.length) {
          setAddress(fetchedProfile.addresses[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile");
      }
    };

    const loadOrders = async () => {
      try {
        const fetchedOrders = await apiRequest<OrderRecord[]>(`/orders?userId=${user.uid}`);
        setOrders(fetchedOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders");
      }
    };

    loadProfile();
    loadOrders();
  }, [user]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    setIsSaving(true);
    setError("");

    try {
      const updatedProfile = await apiRequest<UserProfile>(`/users/${user.uid}`, {
        method: "PUT",
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          addresses: [address],
        }),
      });
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            Create an account to save your address and track orders.
          </p>
          <Button variant="flame" asChild>
            <Link to="/auth">Go to sign in</Link>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Your Profile</h1>
            <p className="text-muted-foreground">Signed in as {displayEmail}</p>
          </div>
          <Button variant="ghost" onClick={() => signOutUser()}>
            Sign out
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Saved Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={address.fullName}
                    onChange={(event) => handleAddressChange("fullName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={address.phone}
                    onChange={(event) => handleAddressChange("phone", event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="line1">Address line 1</Label>
                  <Input
                    id="line1"
                    value={address.line1}
                    onChange={(event) => handleAddressChange("line1", event.target.value)}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={address.postcode}
                    onChange={(event) => handleAddressChange("postcode", event.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <Button variant="flame" onClick={handleSaveAddress} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Address"}
                </Button>
                {primaryAddress && (
                  <span className="text-sm text-muted-foreground">
                    Last saved: {primaryAddress.postcode}
                  </span>
                )}
              </div>
              {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Order History
              </h2>
              {orders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-border rounded-xl p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center">
                            {order.items[0]?.menuItem?.image ? (
                              <img
                                src={order.items[0].menuItem.image}
                                alt={order.items[0].menuItem.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-body font-semibold text-foreground">
                              {order.items[0]?.menuItem?.name || `Order #${order._id.slice(-6)}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">• {order.status}</span>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/order-tracking/${order._id}`}>Track order</Link>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {order.items.slice(0, 2).map((item) => (
                          <span key={`${order._id}-${item.menuItem.id}-${item.quantity}`} className="block">
                            {item.menuItem.name} x {item.quantity}
                          </span>
                        ))}
                        {order.items.length > 2 && <span>+ {order.items.length - 2} more</span>}
                      </div>
                      <div className="mt-3 font-body font-semibold text-foreground">
                        Total £{order.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Quick links
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/menu" className="text-primary hover:underline">Browse menu</Link>
                <Link to="/cart" className="text-primary hover:underline">View basket</Link>
                <Link to="/contact" className="text-primary hover:underline">Contact us</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
