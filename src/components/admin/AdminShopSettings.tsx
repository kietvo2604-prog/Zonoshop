import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SETTING_KEYS = [
  { key: "shop_title", label: "Tiêu đề shop (dòng lớn)" },
  { key: "shop_subtitle_1", label: "Dòng mô tả 1" },
  { key: "shop_subtitle_2", label: "Dòng mô tả 2" },
  { key: "shop_subtitle_3", label: "Dòng mô tả 3" },
];

const AdminShopSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("shop_settings").select("*").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    for (const { key } of SETTING_KEYS) {
      if (settings[key] !== undefined) {
        await supabase.from("shop_settings").update({ value: settings[key], updated_at: new Date().toISOString() }).eq("key", key);
      }
    }
    setSaving(false);
    toast({ title: "✅ Đã lưu cài đặt shop!" });
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary neon-text flex items-center gap-2">
        <FileText className="w-6 h-6" /> MÔ TẢ SHOP
      </h1>

      <div className="bg-card border border-border rounded-xl p-6 neon-card space-y-4">
        <p className="text-sm text-muted-foreground">Chỉnh sửa nội dung mô tả hiển thị trên trang chủ.</p>

        {SETTING_KEYS.map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
            <input
              value={settings[key] || ""}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm"
            />
          </div>
        ))}

        <div className="bg-muted border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Xem trước:</p>
          <p className="text-lg font-bold text-foreground">{settings["shop_title"] || ""}</p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>{settings["shop_subtitle_1"] || ""}</p>
            <p>{settings["shop_subtitle_2"] || ""}</p>
            <p>{settings["shop_subtitle_3"] || ""}</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
};

export default AdminShopSettings;
