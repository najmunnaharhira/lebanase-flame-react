import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { API_BASE_URL } from "@/lib/api";
import { Category, MenuItem } from "@/types/menu";

const AdminMenu = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomTitle, setZoomTitle] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<MenuItem>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryDraft, setEditingCategoryDraft] = useState<Partial<Category>>({});

  const normalizeImageUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("drive.google.com")) {
      const fileIdMatch = trimmed.match(/\/file\/d\/([^/]+)/);
      const openIdMatch = trimmed.match(/[?&]id=([^&]+)/);
      const fileId = fileIdMatch?.[1] || openIdMatch?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    return trimmed;
  };

  const openImageZoom = (src: string, title: string) => {
    if (!src) return;
    setZoomImage(src);
    setZoomTitle(title);
  };

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    const normalized = normalizeImageUrl(imageUrl);
    setPreviewUrl(normalized);
  }, [imageFile, imageUrl]);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    const loadMenuItems = async () => {
      setIsLoadingMenu(true);
      try {
        const [menuResponse, categoryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/menu/all`, {
            headers: getAdminAuthHeaders(),
          }),
          fetch(`${API_BASE_URL}/categories/all`, {
            headers: getAdminAuthHeaders(),
          }),
        ]);

        if (!menuResponse.ok) {
          throw new Error("Failed to load menu items");
        }

        if (!categoryResponse.ok) {
          throw new Error("Failed to load categories");
        }

        const [menuData, categoryData] = await Promise.all([
          menuResponse.json(),
          categoryResponse.json(),
        ]);
        setMenuItems(menuData);
        setCategories(categoryData);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load menu items");
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadMenuItems();
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const filteredMenu = useMemo(() => {
    if (!search.trim()) return menuItems;
    const term = search.toLowerCase();
    return menuItems.filter((item) =>
      `${item.name} ${item.category}`.toLowerCase().includes(term)
    );
  }, [menuItems, search]);

  const handleEditItem = (item: MenuItem) => {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
    });
  };

  const handleUpdateItem = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(editDraft),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update item");
      }
      const updated = await response.json();
      setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      setEditDraft({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update item");
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (!response.ok) {
        throw new Error("Failed to update availability");
      }
      const updated = await response.json();
      setMenuItems((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update availability");
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${item.id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      setMenuItems((prev) => prev.filter((entry) => entry.id !== item.id));
      setMessage("Menu item deleted successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete item");
    }
  };

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      setMessage("Category name is required.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          icon: categoryIcon.trim() || "🍽️",
          sortOrder: categories.length + 1,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create category");
      }
      const created = await response.json();
      setCategories((prev) => [...prev, created]);
      setCategoryName("");
      setCategoryIcon("");
      setMessage("Category created successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create category");
    }
  };

  const handleUpdateCategory = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(editingCategoryDraft),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update category");
      }
      const updated = await response.json();
      setCategories((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
      setEditingCategoryId(null);
      setEditingCategoryDraft({});
      setMessage("Category updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete category");
      }
      setCategories((prev) => prev.filter((entry) => entry.id !== categoryId));
      setMessage("Category deleted successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete category");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (!name.trim() || !price || !category.trim()) {
      setMessage("Name, price, and category are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      let image = "";
      const normalizedImageUrl = normalizeImageUrl(imageUrl);

      if (normalizedImageUrl) {
        image = normalizedImageUrl;
      } else if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await fetch(`${API_BASE_URL}/menu/upload`, {
          method: "POST",
          headers: getAdminAuthHeaders(),
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(errorText || "Failed to upload image");
        }

        const uploadResult = await uploadResponse.json();
        image = uploadResult.url || "";
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category: category.trim(),
        image,
        isAvailable,
        isPopular,
        isVegetarian,
        isVegan,
        isSpicy,
      };

      const response = await fetch(`${API_BASE_URL}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create menu item");
      }

      setMessage("Menu item created successfully.");
      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImageFile(null);
      setImageUrl("");
      setIsAvailable(true);
      setIsPopular(false);
      setIsVegetarian(false);
      setIsVegan(false);
      setIsSpicy(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16">
        <AdminHeader
          title="Menu management"
          subtitle="Add, edit, and disable items in real time."
          onLogout={handleLogout}
        />

        <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 mb-8">
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Category management</h2>
              <p className="text-sm text-muted-foreground">
                Create, edit, and safely delete categories.
              </p>
            </div>

            <form onSubmit={handleCreateCategory} className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Category name"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                required
              />
              <Input
                placeholder="Icon (optional)"
                value={categoryIcon}
                onChange={(event) => setCategoryIcon(event.target.value)}
              />
              <div className="md:col-span-2">
                <Button type="submit" variant="flame">Create category</Button>
              </div>
            </form>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories found.</p>
              ) : (
                categories.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {editingCategoryId === entry.id ? (
                      <div className="flex flex-1 flex-col gap-2 md:flex-row">
                        <Input
                          value={editingCategoryDraft.name || ""}
                          onChange={(event) =>
                            setEditingCategoryDraft((prev) => ({ ...prev, name: event.target.value }))
                          }
                          placeholder="Category name"
                        />
                        <Input
                          value={editingCategoryDraft.icon || ""}
                          onChange={(event) =>
                            setEditingCategoryDraft((prev) => ({ ...prev, icon: event.target.value }))
                          }
                          placeholder="Icon"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">{entry.icon} {entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.id}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editingCategoryId === entry.id ? (
                        <>
                          <Button size="sm" variant="flame" type="button" onClick={() => handleUpdateCategory(entry.id)}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryDraft({});
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(entry.id);
                              setEditingCategoryDraft({ name: entry.name, icon: entry.icon });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            onClick={() => handleDeleteCategory(entry.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Add new item</h2>
              <p className="text-sm text-muted-foreground">
                Create new menu items with price, category, and image.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Item name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price</Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <select
                  id="item-category"
                  aria-label="Item category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image">Image</Label>
              <Input
                id="item-image"
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Or paste a Google Drive / postimages.com link below.
              </p>
              <Input
                id="item-image-url"
                placeholder="https://drive.google.com/..."
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
              {previewUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openImageZoom(previewUrl, name || "Preview")}
                    className="rounded-lg border border-border p-0.5 hover:border-primary"
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </button>
                  <span className="text-xs text-muted-foreground">Image preview</span>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={isAvailable} onCheckedChange={(value) => setIsAvailable(Boolean(value))} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={isPopular} onCheckedChange={(value) => setIsPopular(Boolean(value))} />
                Popular
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={isVegetarian} onCheckedChange={(value) => setIsVegetarian(Boolean(value))} />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={isVegan} onCheckedChange={(value) => setIsVegan(Boolean(value))} />
                Vegan
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={isSpicy} onCheckedChange={(value) => setIsSpicy(Boolean(value))} />
                Spicy
              </label>
            </div>

            {message && (
              <p className={`text-sm ${message.includes("success") ? "text-emerald-600" : "text-destructive"}`}>
                {message}
              </p>
            )}

            <Button type="submit" variant="flame" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create menu item"}
            </Button>
          </form>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Menu items</h2>
            <Input
              placeholder="Search menu"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:max-w-xs"
            />
          </div>

          {isLoadingMenu ? (
            <p className="text-sm text-muted-foreground mt-4">Loading menu...</p>
          ) : filteredMenu.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No menu items found.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredMenu.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <button
                          type="button"
                          onClick={() => openImageZoom(item.image, item.name)}
                          className="rounded-lg border border-border p-0.5 hover:border-primary"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        </button>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-body font-semibold text-foreground">{item.name}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${
                              item.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {item.isAvailable ? "Available" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={item.isAvailable ? "outline" : "flame"}
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {item.isAvailable ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditItem(item)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteItem(item)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {editingId === item.id && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={editDraft.name || ""}
                        onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Item name"
                      />
                      <select
                        aria-label="Edit item category"
                        value={editDraft.category || ""}
                        onChange={(event) => setEditDraft((prev) => ({ ...prev, category: event.target.value }))}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select category</option>
                        {categories.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                    <Input
                      value={editDraft.image || ""}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          image: normalizeImageUrl(event.target.value),
                        }))
                      }
                      placeholder="Image URL (Drive/Postimages)"
                    />
                      {(editDraft.image || item.image) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openImageZoom(editDraft.image || item.image || "", item.name)}
                            className="rounded-lg border border-border p-0.5 hover:border-primary"
                          >
                            <img
                              src={editDraft.image || item.image}
                              alt={`${item.name} preview`}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          </button>
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}
                      <Input
                        type="number"
                        step="0.01"
                        value={editDraft.price ?? ""}
                        onChange={(event) => setEditDraft((prev) => ({ ...prev, price: Number(event.target.value) }))}
                        placeholder="Price"
                      />
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox
                          checked={Boolean(editDraft.isPopular)}
                          onCheckedChange={(value) =>
                            setEditDraft((prev) => ({ ...prev, isPopular: Boolean(value) }))
                          }
                        />
                        Popular
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="flame" onClick={() => handleUpdateItem(item.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Price: £{item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Dialog open={Boolean(zoomImage)} onOpenChange={(open) => !open && setZoomImage(null)}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>{zoomTitle || "Image preview"}</DialogTitle>
          </DialogHeader>
          {zoomImage && (
            <div className="flex items-center justify-center">
              <img
                src={zoomImage}
                alt={zoomTitle || "Preview"}
                className="max-h-[70vh] w-full object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenu;
