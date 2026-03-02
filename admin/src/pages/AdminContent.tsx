import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAdminSession, hasAdminSession } from "@/lib/adminAuth";
import { demoContent, demoReports } from "@/lib/adminDemoData";
import { apiRequest } from "@/lib/api";

interface ContentRow {
  id: number;
  title: string;
  description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "archived";
  created_at: string;
  created_by_name?: string;
}

interface ReportRow {
  id: number;
  content_id: number;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "rejected";
  content_title?: string;
  reported_by_email?: string;
  created_at: string;
}

const AdminContent = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  const loadData = async () => {
    try {
      const [contentData, reportsData] = await Promise.all([
        apiRequest<ContentRow[]>("/admin/content"),
        apiRequest<ReportRow[]>("/admin/reports"),
      ]);
      setContent(contentData);
      setReports(reportsData);
      setIsDemoMode(false);
    } catch (err) {
      setContent(demoContent as ContentRow[]);
      setReports(demoReports as ReportRow[]);
      setIsDemoMode(true);
      setError("API unavailable. Showing demo moderation data.");
    }
  };

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  const handleCreate = async () => {
    if (isDemoMode) {
      if (!title.trim()) {
        setError("Title is required.");
        return;
      }
      setContent((prev) => [
        {
          id: Date.now(),
          title: title.trim(),
          description: description.trim(),
          status: "pending_review",
          created_at: new Date().toISOString(),
          created_by_name: "Demo Admin",
        },
        ...prev,
      ]);
      setTitle("");
      setDescription("");
      return;
    }

    try {
      await apiRequest("/admin/content", {
        method: "POST",
        body: JSON.stringify({ title, description, status: "pending_review" }),
      });
      setTitle("");
      setDescription("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create content");
    }
  };

  const updateStatus = async (contentId: number, status: ContentRow["status"]) => {
    if (isDemoMode) {
      setContent((prev) => prev.map((item) => (item.id === contentId ? { ...item, status } : item)));
      return;
    }

    try {
      await apiRequest(`/admin/content/${contentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setContent((prev) => prev.map((item) => (item.id === contentId ? { ...item, status } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update content status");
    }
  };

  const updateReportStatus = async (reportId: number, status: ReportRow["status"]) => {
    if (isDemoMode) {
      setReports((prev) => prev.map((item) => (item.id === reportId ? { ...item, status } : item)));
      return;
    }

    try {
      await apiRequest(`/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReports((prev) => prev.map((item) => (item.id === reportId ? { ...item, status } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update report status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Content moderation"
          subtitle="Create content, approve/reject submissions, and manage reports."
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">New content</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          </div>
          <Button variant="flame" onClick={handleCreate}>Submit content</Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-x-auto">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Content queue</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4">Title</th>
                <th className="text-left py-2 pr-4">Author</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4">{item.title}</td>
                  <td className="py-2 pr-4">{item.created_by_name || "System"}</td>
                  <td className="py-2 pr-4 capitalize">{item.status.replace("_", " ")}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => updateStatus(item.id, "approved")}>Approve</Button>
                      <Button variant="outline" onClick={() => updateStatus(item.id, "rejected")}>Reject</Button>
                      <Button variant="outline" onClick={() => updateStatus(item.id, "pending_review")}>Review</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-x-auto">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Reports</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4">Content</th>
                <th className="text-left py-2 pr-4">Reporter</th>
                <th className="text-left py-2 pr-4">Reason</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4">{item.content_title || `#${item.content_id}`}</td>
                  <td className="py-2 pr-4">{item.reported_by_email || "Guest"}</td>
                  <td className="py-2 pr-4">{item.reason}</td>
                  <td className="py-2 pr-4 capitalize">{item.status}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => updateReportStatus(item.id, "reviewing")}>Reviewing</Button>
                      <Button variant="outline" onClick={() => updateReportStatus(item.id, "resolved")}>Resolve</Button>
                      <Button variant="outline" onClick={() => updateReportStatus(item.id, "rejected")}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default AdminContent;
