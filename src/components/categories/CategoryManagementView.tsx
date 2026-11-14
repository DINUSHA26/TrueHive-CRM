"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Upload,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export interface CategoryTreeItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: CategoryTreeItem[];
  _count?: {
    products: number;
  };
}

export function CategoryManagementView() {
  const [categories, setCategories] = useState<CategoryTreeItem[]>([]);
  const [flatCategories, setFlatCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState({
    totalCategories: 0,
    rootCategories: 0,
    activeCategories: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/categories?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setFlatCategories(data.flatCategories || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setImage("");
    setParentId(null);
    setSortOrder(categories.length);
    setIsActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryTreeItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setParentId(cat.parentId || null);
    setSortOrder(cat.sortOrder || 0);
    setIsActive(cat.isActive);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        setImage(data.data.url);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload category image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleToggleStatus = async (cat: CategoryTreeItem) => {
    try {
      await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          isActive: !cat.isActive,
        }),
      });
      fetchCategories();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDelete = async (cat: CategoryTreeItem) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete category");
        return;
      }
      fetchCategories();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Category name is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        id: editingCategory?.id,
        name: name.trim(),
        description: description.trim(),
        image: image || null,
        parentId: parentId || null,
        sortOrder: Number(sortOrder || 0),
        isActive,
      };

      const res = await fetch("/api/categories", {
        method: editingCategory ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save category.");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards matching PrimeWear Image 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Categories</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalCategories}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Root Categories</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.rootCategories}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeCategories}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Products</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalProducts}</p>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Create Category Button */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Category
        </Button>
      </div>

      {/* Category Tree Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-14">Image</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4 w-24">Type</th>
                <th className="py-3 px-4 w-24 text-center">Products</th>
                <th className="py-3 px-4 w-24 text-center">Sub-levels</th>
                <th className="py-3 px-4 w-24 text-center">Priority</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {categories.map((cat) => {
                const isExpanded = expandedIds.has(cat.id);
                const hasChildren = Boolean(cat.children && cat.children.length > 0);

                return (
                  <React.Fragment key={cat.id}>
                    <tr className="hover:bg-slate-800/40 transition">
                      {/* Image */}
                      <td className="py-3 px-4">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 bg-slate-950"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                            No img
                          </div>
                        )}
                      </td>

                      {/* Name with Expand Toggle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(cat.id)}
                              className="p-1 text-slate-400 hover:text-white rounded transition"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6" />
                          )}
                          <div>
                            <p className="font-bold text-white text-sm">{cat.name}</p>
                            {cat.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Main
                        </span>
                      </td>

                      {/* Products Count */}
                      <td className="py-3 px-4 text-center font-bold text-slate-200">
                        {cat._count?.products || 0}
                      </td>

                      {/* Sub-levels */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        {cat.children?.length || 0}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {cat.sortOrder}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            cat.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.isActive ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          {cat.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            title="Delete Category"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-categories Render */}
                    {isExpanded &&
                      cat.children?.map((sub) => (
                        <tr
                          key={sub.id}
                          className="bg-slate-950/40 hover:bg-slate-800/30 transition border-l-2 border-blue-500"
                        >
                          <td className="py-2.5 px-4 pl-8">
                            {sub.image ? (
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-800 bg-slate-950"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[9px]">
                                Sub
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="pl-6">
                              <p className="font-semibold text-slate-200">{sub.name}</p>
                              {sub.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-[9px] font-medium text-slate-400">
                              {cat.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-slate-300">
                            {sub._count?.products || 0}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-500">-</td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                            {sub.sortOrder}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(sub)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                sub.isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {sub.isActive ? "ACTIVE" : "INACTIVE"}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(sub)}
                                className="p-1 text-slate-400 hover:text-white rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(sub)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}

              {categories.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No categories found. Click Create Category to add your first root category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
        description="Configure category hierarchy, display image, and priority order."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Men's Clothing or Electronics"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Parent Category (Optional - leave empty for Root Category)
            </label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">None (Make this a Root Category)</option>
              {flatCategories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Category overview..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Cloudinary Image */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Category Image (Cloudinary)
            </label>
            <div className="flex items-center gap-3">
              {image ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 rounded text-white"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition">
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Display Priority / Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting || uploadingImage}>
              {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

