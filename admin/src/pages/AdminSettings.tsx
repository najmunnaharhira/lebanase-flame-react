import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { BusinessSettings, HolidayClosure, OpeningHour } from "@/types/settings";
import { AdminHeader } from "@/components/AdminHeader";

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

const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BusinessSettings>({
    openingHours: buildDefaultHours(),
    holidayClosures: [],
  });
  const [newHoliday, setNewHoliday] = useState<HolidayClosure>({ date: "", note: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/business`);
        if (!response.ok) {
          throw new Error("Failed to load settings");
        }
        const data = await response.json();
        setSettings({
          openingHours: data.openingHours?.length ? data.openingHours : buildDefaultHours(),
          holidayClosures: data.holidayClosures || [],
        });
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Unable to load settings");
      }
    };

    loadSettings();
  }, [navigate]);

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
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/settings/business`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save settings");
      }

      const data = await response.json();
      setSettings({
        openingHours: data.openingHours || buildDefaultHours(),
        holidayClosures: data.holidayClosures || [],
      });
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
        />

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
