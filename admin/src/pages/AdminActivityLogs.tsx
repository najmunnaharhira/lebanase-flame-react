import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession, hasAdminSession } from "@/lib/adminAuth";
import { demoActivityLogs } from "@/lib/adminDemoData";
import { apiRequest } from "@/lib/api";

interface ActivityLog {
  id: number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  user_email?: string;
  user_role?: string;
  created_at: string;
}

const AdminActivityLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin/login");
      return;
    }

    const loadLogs = async () => {
      try {
        const data = await apiRequest<ActivityLog[]>("/admin/activity-logs?limit=300");
        setLogs(data);
        setIsDemoMode(false);
      } catch (err) {
        setLogs(demoActivityLogs as ActivityLog[]);
        setIsDemoMode(true);
        setError("API unavailable. Showing demo activity logs.");
      }
    };

    loadLogs();
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Activity logs"
          subtitle="Audit security and admin operations."
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4">Time</th>
                <th className="text-left py-2 pr-4">User</th>
                <th className="text-left py-2 pr-4">Role</th>
                <th className="text-left py-2 pr-4">Action</th>
                <th className="text-left py-2">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{log.user_email || "System"}</td>
                  <td className="py-2 pr-4">{log.user_role || "-"}</td>
                  <td className="py-2 pr-4">{log.action}</td>
                  <td className="py-2">{log.entity_type || "-"} {log.entity_id ? `#${log.entity_id}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminActivityLogs;
