import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Loader2, AlertCircle, Search, Trash2 } from "lucide-react";

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const BalanceHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balanceEvents, setBalanceEvents] = useState<{ id: string; type: "topup" | "purchase"; label: string; amount: number; date: string }[]>([]);
  const [searchReason, setSearchReason] = useState("");
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [topupRes, ordersRes] = await Promise.all([
        supabase.from("topup_requests").select("*").eq("user_id", user.id).eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const topups = topupRes.data || [];
      const orders = ordersRes.data || [];

      const events = [
        ...topups.map((t: any) => ({ id: t.id, type: "topup" as const, label: `Nạp tiền tự động qua ${t.method}${t.note ? ` - ${t.note}` : ''}`, amount: t.amount, date: t.created_at })),
        ...orders.map((o: any) => ({ id: o.id, type: "purchase" as const, label: `Thanh toán đơn hàng mua tài khoản ${o.product_name}${o.order_code ? ` - #${o.order_code}` : ''}`, amount: o.price, date: o.created_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate running balances
      setBalanceEvents(events);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem biến động số dư.</p>
          <a href="/dang-nhap" className="inline-block px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg text-sm">Đăng nhập</a>
        </main>
        <Footer />
      </div>
    );
  }

  let filtered = balanceEvents;
  if (searchReason.trim()) filtered = filtered.filter(e => e.label.toLowerCase().includes(searchReason.toLowerCase()));
  const displayed = filtered.slice(0, perPage);

  // Calculate running balance from bottom up
  let runningBalance = 0;
  const eventsWithBalance = [...filtered].reverse().map(e => {
    const before = runningBalance;
    if (e.type === "topup") {
      runningBalance += e.amount;
    } else {
      runningBalance -= e.amount;
    }
    return { ...e, balanceBefore: before, balanceAfter: runningBalance };
  }).reverse();

  const displayedWithBalance = eventsWithBalance.slice(0, perPage);

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <h2 className="font-bold text-foreground text-xl">Biến động số dư</h2>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <input value={searchReason} onChange={e => setSearchReason(e.target.value)} placeholder="Lý do"
              className="bg-muted border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-40" />
            <button className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
              <Search className="w-4 h-4" /> Tìm kiếm
            </button>
            <button onClick={() => setSearchReason("")} className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-semibold hover:bg-border">
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
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Thời gian</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground italic">Số dư ban đầu</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground italic">Số dư thay đổi</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground italic">Số dư hiện tại</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedWithBalance.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có biến động.</td></tr>
                  ) : displayedWithBalance.map(e => (
                    <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.date).toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-foreground font-bold">{formatVND(e.balanceBefore)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${e.type === "topup" ? "text-primary" : "text-destructive"}`}>
                        {e.type === "topup" ? `+${formatVND(e.amount)}` : `-${formatVND(e.amount)}`}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${e.balanceAfter === 0 ? "text-destructive" : "text-primary"}`}>
                        {formatVND(e.balanceAfter)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[300px]">{e.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-sm text-muted-foreground">Showing {perPage} of {filtered.length} Results</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BalanceHistory;
