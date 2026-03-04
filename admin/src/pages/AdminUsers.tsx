import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAdminSession, getAdminRole, hasAdminSession } from "@/lib/adminAuth";
import { demoUsers } from "@/lib/adminDemoData";
import { apiRequest } from "@/lib/api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "moderator" | "editor" | "user";
  isActive: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const currentRole = getAdminRole();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("user");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const STAFF_ROLES: AdminUser["role"][] = ["admin", "manager", "moderator", "editor"];

  const getLoginUrl = (userRole: AdminUser["role"]) => {
    if (STAFF_ROLES.includes(userRole)) {
      return `${window.location.origin}/admin/login`;
    }
    return null;
  };

  const handleCopyUrl = (userId: number, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const canAssignRole = (nextRole: AdminUser["role"]) => {
    if (currentRole === "admin") return true;
    if (currentRole === "manager") {
      return ["editor", "user"].includes(nextRole);
    }
    return false;
  };

  const canManageUser = (target: AdminUser) => {
    if (currentRole === "admin") return true;
    if (currentRole === "manager") {
      return ["editor", "user"].includes(target.role);
    }
    return false;
  };

  const creatableRoleOptions: AdminUser["role"][] =
    currentRole === "manager"
      ? ["user", "editor"]
      : ["user", "editor", "manager", "moderator", "admin"];

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AdminUser[]>("/admin/users");
      setUsers(data);
      setIsDemoMode(false);
    } catch (err) {
      setUsers(demoUsers as AdminUser[]);
      setIsDemoMode(true);
      setError("API unavailable. Showing demo users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin/login");
      return;
    }
    loadUsers();
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  const handleCreateUser = async () => {
    if (!canAssignRole(role)) {
      setError("You do not have permission to assign this role.");
      return;
    }

    if (isDemoMode) {
      if (!name.trim() || !email.trim()) {
        setError("Name and email are required.");
        return;
      }
      setUsers((prev) => [
        {
          id: Date.now(),
          name: name.trim(),
          email: email.trim(),
          role,
          isActive: true,
        },
        ...prev,
      ]);
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setError("Demo mode: user created locally.");
      return;
    }

    try {
      setError("");
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    }
  };

  const handleRoleChange = async (userId: number, nextRole: AdminUser["role"]) => {
    const target = users.find((entry) => entry.id === userId);
    if (!target || !canManageUser(target) || !canAssignRole(nextRole)) {
      setError("You do not have permission to change this role.");
      return;
    }

    if (isDemoMode) {
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: nextRole } : user)));
      return;
    }

    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: nextRole } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role");
    }
  };

  const handleDeactivate = async (userId: number) => {
    const target = users.find((entry) => entry.id === userId);
    if (!target || !canManageUser(target)) {
      setError("You do not have permission to deactivate this user.");
      return;
    }

    if (isDemoMode) {
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isActive: false } : user)));
      return;
    }

    try {
      await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isActive: false } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to deactivate user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="User management"
          subtitle="Create users, assign roles, and manage access."
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        {currentRole === "manager" && (
          <p className="text-sm text-muted-foreground">
            Manager scope: you can create and manage only Editor and User accounts.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">Create user</h2>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                aria-label="New user role"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={role}
                onChange={(event) => setRole(event.target.value as AdminUser["role"])}
              >
                {creatableRoleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="flame" onClick={handleCreateUser}>Create user</Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-x-auto">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Users</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Role</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Login URL</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4">{user.name}</td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">
                      {canManageUser(user) ? (
                        <select
                          aria-label={`Role for ${user.email}`}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={user.role}
                          onChange={(event) => handleRoleChange(user.id, event.target.value as AdminUser["role"])}
                        >
                          {creatableRoleOptions.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize text-muted-foreground">{user.role}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {user.isActive ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {(() => {
                        const url = getLoginUrl(user.role);
                        if (!url) return <span className="text-muted-foreground">—</span>;
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]" title={url}>
                              {url}
                            </span>
                            <button
                              type="button"
                              title={copiedId === user.id ? "Copied!" : "Copy login URL"}
                              onClick={() => handleCopyUrl(user.id, url)}
                              className="shrink-0 h-6 w-6 flex items-center justify-center rounded border border-input bg-background hover:bg-muted transition-colors"
                            >
                              {copiedId === user.id
                                ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                                : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="outline"
                        disabled={!user.isActive || !canManageUser(user)}
                        onClick={() => handleDeactivate(user.id)}
                      >
                        Deactivate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;
