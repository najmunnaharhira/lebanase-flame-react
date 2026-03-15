import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession } from "@/lib/adminAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import { API_BASE_URL } from "@/lib/api";

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

interface Section {
  id: number;
  section_key: string;
  title: string;
  content: string;
  settings: any;
  is_active: boolean;
  sort_order: number;
}

export default function AdminSocialLinksSections() {
  const navigate = useNavigate();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Social link form state
  const [newSocial, setNewSocial] = useState<Partial<SocialLink>>({});
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);

  // Section form state
  const [newSection, setNewSection] = useState<Partial<Section>>({});
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/admin/social-links`, { headers: getAdminAuthHeaders() }),
      fetch(`${API_BASE_URL}/admin/sections`, { headers: getAdminAuthHeaders() })
    ])
      .then(async ([linksRes, sectionsRes]) => {
        if (!linksRes.ok || !sectionsRes.ok) throw new Error("Failed to load data");
        setSocialLinks(await linksRes.json());
        setSections(await sectionsRes.json());
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load admin data");
        setLoading(false);
      });
  }, []);

  // Social Links CRUD
  const handleSaveSocial = async () => {
    const method = editingSocial ? "PUT" : "POST";
    const url = editingSocial
      ? `${API_BASE_URL}/admin/social-links/${editingSocial.id}`
      : `${API_BASE_URL}/admin/social-links`;
    const body = JSON.stringify(editingSocial || newSocial);
    const res = await fetch(url, {
      method,
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      const updated = await res.json();
      setSocialLinks((prev) => {
        if (editingSocial) {
          return prev.map((l) => (l.id === updated.id ? updated : l));
        } else {
          return [...prev, updated];
        }
      });
      setEditingSocial(null);
      setNewSocial({});
    }
  };
  const handleDeleteSocial = async (id: number) => {
    if (!window.confirm("Delete this social link?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/social-links/${id}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });
    if (res.ok) setSocialLinks((prev) => prev.filter((l) => l.id !== id));
  };

  // Sections CRUD
  const handleSaveSection = async () => {
    const method = editingSection ? "PUT" : "POST";
    const url = editingSection
      ? `${API_BASE_URL}/admin/sections/${editingSection.id}`
      : `${API_BASE_URL}/admin/sections`;
    const body = JSON.stringify(editingSection || newSection);
    const res = await fetch(url, {
      method,
      headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      const updated = await res.json();
      setSections((prev) => {
        if (editingSection) {
          return prev.map((s) => (s.id === updated.id ? updated : s));
        } else {
          return [...prev, updated];
        }
      });
      setEditingSection(null);
      setNewSection({});
    }
  };
  const handleDeleteSection = async (id: number) => {
    if (!window.confirm("Delete this section?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/sections/${id}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });
    if (res.ok) setSections((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  return (
    <div>
      <AdminHeader
        title="Social Links & Sections"
        subtitle="Manage footer social links and frontend sections."
        onLogout={handleLogout}
      />
      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-4">Social Links</h2>
        <div className="mb-6">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSaveSocial();
            }}
            className="flex gap-2 items-end"
          >
            <div>
              <Label>Platform</Label>
              <Input
                value={editingSocial ? editingSocial.platform : newSocial.platform || ""}
                onChange={e => (editingSocial ? setEditingSocial({ ...editingSocial, platform: e.target.value }) : setNewSocial({ ...newSocial, platform: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={editingSocial ? editingSocial.url : newSocial.url || ""}
                onChange={e => (editingSocial ? setEditingSocial({ ...editingSocial, url: e.target.value }) : setNewSocial({ ...newSocial, url: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Input
                value={editingSocial ? editingSocial.icon : newSocial.icon || ""}
                onChange={e => (editingSocial ? setEditingSocial({ ...editingSocial, icon: e.target.value }) : setNewSocial({ ...newSocial, icon: e.target.value }))}
                placeholder="e.g. fab fa-facebook"
              />
            </div>
            <div>
              <Label>Active</Label>
              <Input
                type="checkbox"
                checked={editingSocial ? editingSocial.is_active : newSocial.is_active || false}
                onChange={e => (editingSocial ? setEditingSocial({ ...editingSocial, is_active: e.target.checked }) : setNewSocial({ ...newSocial, is_active: e.target.checked }))}
              />
            </div>
            <Button type="submit">{editingSocial ? "Update" : "Add"}</Button>
            {editingSocial && <Button type="button" variant="secondary" onClick={() => setEditingSocial(null)}>Cancel</Button>}
          </form>
        </div>
        <table className="w-full mb-8">
          <thead>
            <tr>
              <th>Platform</th>
              <th>URL</th>
              <th>Icon</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {socialLinks.map(link => (
              <tr key={link.id}>
                <td>{link.platform}</td>
                <td>{link.url}</td>
                <td>{link.icon}</td>
                <td>{link.is_active ? "Yes" : "No"}</td>
                <td>
                  <Button size="sm" onClick={() => setEditingSocial(link)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSocial(link.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-2xl font-bold mb-4">Frontend Sections</h2>
        <div className="mb-6">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSaveSection();
            }}
            className="flex gap-2 items-end"
          >
            <div>
              <Label>Section Key</Label>
              <Input
                value={editingSection ? editingSection.section_key : newSection.section_key || ""}
                onChange={e => (editingSection ? setEditingSection({ ...editingSection, section_key: e.target.value }) : setNewSection({ ...newSection, section_key: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={editingSection ? editingSection.title : newSection.title || ""}
                onChange={e => (editingSection ? setEditingSection({ ...editingSection, title: e.target.value }) : setNewSection({ ...newSection, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Content</Label>
              <Input
                value={editingSection ? editingSection.content : newSection.content || ""}
                onChange={e => (editingSection ? setEditingSection({ ...editingSection, content: e.target.value }) : setNewSection({ ...newSection, content: e.target.value }))}
              />
            </div>
            <div>
              <Label>Active</Label>
              <Input
                type="checkbox"
                checked={editingSection ? editingSection.is_active : newSection.is_active || false}
                onChange={e => (editingSection ? setEditingSection({ ...editingSection, is_active: e.target.checked }) : setNewSection({ ...newSection, is_active: e.target.checked }))}
              />
            </div>
            <Button type="submit">{editingSection ? "Update" : "Add"}</Button>
            {editingSection && <Button type="button" variant="secondary" onClick={() => setEditingSection(null)}>Cancel</Button>}
          </form>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th>Key</th>
              <th>Title</th>
              <th>Content</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(section => (
              <tr key={section.id}>
                <td>{section.section_key}</td>
                <td>{section.title}</td>
                <td>{section.content}</td>
                <td>{section.is_active ? "Yes" : "No"}</td>
                <td>
                  <Button size="sm" onClick={() => setEditingSection(section)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSection(section.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
