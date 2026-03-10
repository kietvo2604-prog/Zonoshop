import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories((data as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const slug = newSlug.trim() || generateSlug(newName);
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0;
    await supabase.from("categories").insert({ name: newName.trim(), slug, sort_order: maxOrder + 1 } as any);
    setNewName("");
    setNewSlug("");
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá danh mục này?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  };

  const handleUpdate = async () => {
    if (!editing || !editName.trim()) return;
    await supabase.from("categories").update({ name: editName.trim(), slug: editSlug.trim() || generateSlug(editName) }).eq("id", editing.id);
    setEditing(null);
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary neon-text">QUẢN LÝ DANH MỤC</h1>

      {/* Add form */}
      <div className="bg-card border border-border rounded-xl p-4 neon-card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-foreground mb-1 block">Tên danh mục</label>
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNewSlug(generateSlug(e.target.value)); }}
            placeholder="VD: Max Level"
            className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="w-40">
          <label className="text-sm font-medium text-foreground mb-1 block">Slug</label>
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="maxlevel"
            className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm font-mono"
          />
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden neon-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Thứ tự</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Tên</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Slug</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Đang tải...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Chưa có danh mục</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4" />
                    {c.sort_order}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground font-medium">
                  {editing?.id === c.id ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="bg-muted border border-border rounded px-2 py-1 text-sm w-full" />
                  ) : c.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                  {editing?.id === c.id ? (
                    <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)}
                      className="bg-muted border border-border rounded px-2 py-1 text-sm w-full font-mono" />
                  ) : c.slug}
                </td>
                <td className="px-4 py-3 text-right">
                  {editing?.id === c.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleUpdate} className="px-3 py-1.5 gradient-primary text-primary-foreground rounded text-xs font-semibold">Lưu</button>
                      <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-muted text-muted-foreground rounded text-xs">Huỷ</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-muted transition-colors text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategories;
