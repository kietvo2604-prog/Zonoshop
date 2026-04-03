import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, Loader2, AlertCircle, Eye, Download, Trash2, Search, X } from "lucide-react";

type Order = {
  id: string;
  order_code: string | null;
  product_name: string;
  product_category: string;
  price: number;
  status: string;
  created_at: string;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const PurchaseHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [searchAccount, setSearchAccount] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [sortDate, setSortDate] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem lịch sử mua hàng.</p>
          <a href="/dang-nhap" className="inline-block px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg text-sm">Đăng nhập</a>
        </main>
        <Footer />
      </div>
    );
  }

  let filtered = orders;
  if (searchCode.trim()) filtered = filtered.filter(o => o.order_code?.toLowerCase().includes(searchCode.toLowerCase()));
  if (searchAccount.trim()) filtered = filtered.filter(o => o.product_name.toLowerCase().includes(searchAccount.toLowerCase()));

  const displayed = filtered.slice(0, perPage);

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="bg-gradient-to-r from-destructive to-neon-orange rounded-xl p-4">
          <h1 className="font-display text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> LỊCH SỬ ĐƠN HÀNG
          </h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input value={searchCode} onChange={e => setSearchCode(e.target.value)} placeholder="Mã đơn hàng"
              className="bg-muted border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-40" />
            <input value={searchAccount} onChange={e => setSearchAccount(e.target.value)} placeholder="Sản phẩm"
              className="bg-muted border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-40" />
            <button onClick={() => {}} className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
              <Search className="w-4 h-4" /> Tìm kiếm
            </button>
            <button onClick={() => { setSearchCode(""); setSearchAccount(""); }} className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-semibold hover:bg-border">
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
              SHORT BY DATE: <select value={sortDate} onChange={e => setSortDate(e.target.value)} className="bg-muted border border-border rounded px-2 py-1 text-foreground text-sm">
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Thao tác</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Mã đơn hàng</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground italic">Sản phẩm</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-foreground italic">Số lượng</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground italic">Thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có đơn hàng nào.</td></tr>
                  ) : displayed.map(o => (
                    <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Link to={`/don-hang/${o.id}`} className="px-2 py-1 bg-primary/80 text-primary-foreground rounded text-xs font-bold hover:bg-primary transition-colors">
                            👁 View
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-foreground text-xs">{o.order_code || "—"}</td>
                      <td className="px-3 py-2.5 text-foreground max-w-[300px] truncate">{o.product_name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/30">1</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-bold rounded border border-destructive/30">{formatVND(o.price)}</span>
                      </td>
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

export default PurchaseHistory;
