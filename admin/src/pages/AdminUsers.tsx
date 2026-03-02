import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAdminSession, hasAdminSession } from "@/lib/adminAuth";
import { demoUsers } from "@/lib/adminDemoData";
import { apiRequest } from "@/lib/api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "moderator" | "editor" | "user";
  isActive: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("user");
  const [isDemoMode, setIsDemoMode] = useState(false);

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
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
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
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4">{user.name}</td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        aria-label={`Role for ${user.email}`}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={user.role}
                        onChange={(event) => handleRoleChange(user.id, event.target.value as AdminUser["role"])}
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      {user.isActive ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="outline"
                        disabled={!user.isActive}
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
