import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Wallet, Search, Trash2 } from "lucide-react";

type TopupRequest = {
  id: string;
  amount: number;
  method: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  card_result: string | null;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const TopUpHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchTopups = async () => {
      setLoading(true);
      const { data } = await supabase.from("topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setTopups(data || []);
      setLoading(false);
    };
    fetchTopups();
  }, [user]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem lịch sử nạp tiền.</p>
          <a href="/dang-nhap" className="inline-block px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg text-sm">Đăng nhập</a>
        </main>
        <Footer />
      </div>
    );
  }

  let filtered = topups;
  if (filterStatus !== "all") filtered = filtered.filter(t => t.status === filterStatus);
  const displayed = filtered.slice(0, perPage);

  const totalApproved = topups.filter(t => t.status === "approved").reduce((s, t) => s + t.amount, 0);
  const totalPending = topups.filter(t => t.status === "pending").reduce((s, t) => s + t.amount, 0);

  const statusText = (s: string) => {
    switch(s) {
      case "approved": return <span className="text-primary font-bold">Thành công</span>;
      case "rejected": return <span className="text-destructive font-bold">Thất bại</span>;
      case "pending": return <span className="text-neon-orange font-bold">Chờ xử lý</span>;
      default: return <span>{s}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="bg-gradient-to-r from-destructive to-neon-orange rounded-xl p-4">
          <h1 className="font-display text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6" /> LỊCH SỬ NẠP THẺ
          </h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-muted border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="all">Trạng thái</option>
              <option value="approved">Thành công</option>
              <option value="pending">Chờ xử lý</option>
              <option value="rejected">Thất bại</option>
            </select>
            <button onClick={() => {}} className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
              <Search className="w-4 h-4" /> Tìm kiếm
            </button>
            <button onClick={() => setFilterStatus("all")} className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-semibold hover:bg-border">
              <Trash2 className="w-4 h-4" /> Bỏ lọc
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              SHOW: <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="bg-muted border border-border rounded px-2 py-1 text-foreground text-sm">
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              SHORT BY DATE: <select className="bg-muted border border-border rounded px-2 py-1 text-foreground text-sm">
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Phương thức</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground italic">Mệnh giá</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground italic">Thực nhận</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-foreground italic">Trạng thái</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Ngày tạo</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Ngày cập nhật</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Chưa có dữ liệu.</td></tr>
                  ) : displayed.map(t => (
                    <tr key={t.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-foreground">{t.method}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-foreground">{formatVND(t.amount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-primary font-bold">{t.status === "approved" ? formatVND(t.amount) : "—"}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{statusText(t.status)}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{t.note || t.card_result || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Đã thanh toán: <span className="text-primary font-bold">{formatVND(totalApproved)}</span> | 
              Chưa thanh toán: <span className="text-destructive font-bold">{formatVND(totalPending)}</span>
            </p>
            <p className="text-muted-foreground">Showing {perPage} of {filtered.length} Results</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TopUpHistory;
