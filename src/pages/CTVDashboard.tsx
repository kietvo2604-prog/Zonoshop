import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Package, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CTVAssignment = {
  id: string;
  email: string;
  assigned_categories: string[];
  is_active: boolean;
};

const CTVDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<CTVAssignment | null>(null);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: 0, category: "" });
  const [accountLines, setAccountLines] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/dang-nhap"); return; }

    supabase.from("ctv_assignments").select("*").eq("email", user.email?.toLowerCase()).eq("is_active", true).single()
      .then(({ data }) => {
        if (data) {
          setAssignment(data as CTVAssignment);
          setForm(f => ({ ...f, category: (data as CTVAssignment).assigned_categories[0] || "" }));
        }
        setChecking(false);
      });
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!form.name || !form.category || !user) return;
    setSaving(true);

    const { data: newProduct, error } = await supabase.from("products").insert({
      name: form.name,
      description: form.description,
      price: form.price,
      category: form.category,
      status: "active",
      stock: 0,
    }).select().single();

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    if (newProduct && accountLines.trim()) {
      const lines = accountLines.split("\n").filter(l => l.trim());
      if (lines.length > 0) {
        await supabase.from("product_accounts").insert(
          lines.map(line => ({ product_id: newProduct.id, account_info: line.trim() })) as any
        );
        await supabase.from("products").update({ stock: lines.length }).eq("id", newProduct.id);
      }
    }

    toast({ title: "✅ Đã thêm sản phẩm!" });
    setForm({ name: "", description: "", price: 0, category: assignment?.assigned_categories[0] || "" });
    setAccountLines("");
    setShowForm(false);
    setSaving(false);
  };

  if (authLoading || checking) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Bạn chưa được cấp quyền CTV. Liên hệ admin để được phân quyền.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 neon-card">
          <h1 className="font-display text-2xl font-bold text-primary neon-text mb-2">TRANG CTV</h1>
          <p className="text-sm text-muted-foreground">Xin chào <span className="text-primary font-semibold">{user?.email}</span>. Bạn có quyền đăng sản phẩm trong các danh mục:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {assignment.assigned_categories.map(cat => (
              <span key={cat} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/30">{cat}</span>
            ))}
          </div>
        </div>

        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Thêm sản phẩm mới
        </button>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 neon-card animate-slide-up space-y-4">
            <h2 className="font-bold text-foreground">Thêm sản phẩm</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tên sản phẩm</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Danh mục</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm">
                  {assignment.assigned_categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Giá (VNĐ)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                <Package className="w-4 h-4 inline mr-1" /> Thêm tài khoản (mỗi dòng = 1 tài khoản)
              </label>
              <textarea value={accountLines} onChange={e => setAccountLines(e.target.value)} rows={5}
                placeholder={"VD:\nuser1:pass1\nuser2:pass2"}
                className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm resize-none font-mono" />
              <p className="text-xs text-muted-foreground mt-1">{accountLines.split("\n").filter(l => l.trim()).length} tài khoản</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving || !form.name || !form.category}
                className="px-6 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Đang thêm..." : "Thêm sản phẩm"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors">Huỷ</button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CTVDashboard;
