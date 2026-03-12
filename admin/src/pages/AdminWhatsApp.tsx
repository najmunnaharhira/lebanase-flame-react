import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearAdminSession, hasAdminSession } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/api";

interface WhatsAppTemplateResponse {
  success: boolean;
  sid: string;
  status?: string;
}

interface SendHistoryRow {
  id: string;
  sentAt: string;
  to: string;
  contentSid: string;
  sid: string;
  status: string;
  result: "success" | "error";
  errorMessage?: string;
}

const HISTORY_STORAGE_KEY = "lf_admin_whatsapp_history";

const AdminWhatsApp = () => {
    const [customUrl, setCustomUrl] = useState("https://example.com/demo");
  const navigate = useNavigate();
  const [to, setTo] = useState("+12345678901");
  const [contentSid, setContentSid] = useState("HX1234567890abcdef1234567890abcdef");
  const [contentVariablesText, setContentVariablesText] = useState(
    '{"1":"Demo Date","2":"Demo Time"}',
  );
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SendHistoryRow[]>([]);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SendHistoryRow[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, 20));
      }
    } catch {
    }
  }, []);

  const pushHistory = (row: SendHistoryRow) => {
    setHistory((prev) => {
      const next = [row, ...prev].slice(0, 20);
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");


    let parsedVariables: Record<string, string>;
    try {
      const parsed = JSON.parse(contentVariablesText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("contentVariables must be a JSON object");
      }
      parsedVariables = parsed as Record<string, string>;
      // Add customUrl to variables if provided
      if (customUrl.trim()) {
        parsedVariables.url = customUrl.trim();
      }
    } catch {
      setError("contentVariables must be valid JSON object text");
      return;
    }

    setIsSending(true);
    try {
      const payload: {
        to: string;
        contentVariables: Record<string, string>;
        contentSid?: string;
      } = {
        to,
        contentVariables: parsedVariables,
      };

      if (contentSid.trim()) {
        payload.contentSid = contentSid.trim();
      }

      const response = await apiRequest<WhatsAppTemplateResponse>(
        "/admin/notifications/whatsapp/template",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      setMessage(
        `Template sent successfully. SID: ${response.sid}${response.status ? ` (${response.status})` : ""}`,
      );

      pushHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sentAt: new Date().toISOString(),
        to: to.trim(),
        contentSid: payload.contentSid || "(env default)",
        sid: response.sid || "-",
        status: response.status || "queued",
        result: "success",
      });
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : "Failed to send WhatsApp template";

      setError(
        errorMessage,
      );

      pushHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sentAt: new Date().toISOString(),
        to: to.trim(),
        contentSid: contentSid.trim() || "(env default)",
        sid: "-",
        status: "failed",
        result: "error",
        errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="WhatsApp Notifications"
          subtitle="Send a Twilio WhatsApp template message from the admin panel."
          onLogout={handleLogout}
        />

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Send template message
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              This calls <code>/admin/notifications/whatsapp/template</code>.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSend}>
            <div className="space-y-2">
              <Label htmlFor="wa-custom-url">Custom URL (optional)</Label>
              <Input
                id="wa-custom-url"
                placeholder="https://example.com/demo"
                value={customUrl}
                onChange={(event) => setCustomUrl(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This URL will be added to the content variables as <code>url</code>.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-to">To (phone)</Label>
              <Input
                id="wa-to"
                placeholder="+8801761575642"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-content-sid">Content SID (optional)</Label>
              <Input
                id="wa-content-sid"
                placeholder="HXb5b62575e6e4ff6129ad7c8efe1f983e"
                value={contentSid}
                onChange={(event) => setContentSid(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use <code>TWILIO_WHATSAPP_CONTENT_SID</code> from server env.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-content-vars">Content Variables (JSON)</Label>
              <Textarea
                id="wa-content-vars"
                rows={6}
                value={contentVariablesText}
                onChange={(event) => setContentVariablesText(event.target.value)}
                required
              />
            </div>

            {message && <p className="text-sm text-emerald-600">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send WhatsApp Template"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Recent send history
            </h2>
            <Button type="button" variant="outline" onClick={clearHistory} disabled={history.length === 0}>
              Clear history
            </Button>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No send attempts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-4">Time</th>
                    <th className="text-left py-2 pr-4">To</th>
                    <th className="text-left py-2 pr-4">Content SID</th>
                    <th className="text-left py-2 pr-4">Message SID</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 last:border-0 align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">{new Date(row.sentAt).toLocaleString()}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{row.to}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{row.contentSid}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{row.sid}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{row.status}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.result === "success"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {row.result}
                        </span>
                        {row.errorMessage ? (
                          <p className="mt-1 text-xs text-destructive max-w-[320px] break-words">
                            {row.errorMessage}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminWhatsApp;
