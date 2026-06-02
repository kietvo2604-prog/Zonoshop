import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, Gift, Copy, CheckCircle, Loader2, 
  Clock, XCircle, History
} from "lucide-react";
import { Link } from "react-router-dom";

const banks: { name: string; number: string; holder: string }[] = [
  { name: "MB Bank", number: "0365739178", holder: "NGUYEN NGOC QUY" },
];

type TopupRequest = {
  id: string;
  amount: number;
  method: string;
  status: string;
  note: string | null;
  created_at: string;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const BankTopUp = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState("");
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [recentTopups, setRecentTopups] = useState<TopupRequest[]>([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  const [atmAmount, setAtmAmount] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [pendingAtmRequest, setPendingAtmRequest] = useState<TopupRequest | null>(null);
  const [sepayQrUrl, setSepayQrUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingTopups(true);
      setLoadingQr(true);
      const [profileRes, topupRes] = await Promise.all([
        supabase.from("profiles").select("transfer_code, bank_qr_code").eq("user_id", user.id).single(),
        supabase.from("topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      
      setTransferCode(profileRes.data?.transfer_code || null);
      setSepayQrUrl(profileRes.data?.bank_qr_code || null);
      setRecentTopups(topupRes.data || []);
      
      const pendingAtm = (topupRes.data || []).find(
        (t) => t.status === "pending" && t.method.toLowerCase().includes("chuyển khoản")
      );
      setPendingAtmRequest(pendingAtm || null);
      
      if (!profileRes.data?.bank_qr_code && profileRes.data?.transfer_code) {
        try {
          const { data: qrData } = await supabase.functions.invoke("generate-sepay-qr", {
            body: { user_id: user.id, transfer_code: profileRes.data.transfer_code },
          });
          if (qrData?.qr_url) setSepayQrUrl(qrData.qr_url);
        } catch (err) {
          console.error("QR generation exception:", err);
        }
      }
      setLoadingTopups(false);
    };
    fetchData();
  }, [user]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleAutoApproveAtm = async () => {
    if (!user || !pendingAtmRequest) {
      toast({ title: "Lỗi", description: "Không có yêu cầu chuyển khoản chờ xử lý.", variant: "destructive" });
      return;
    }
    
    if (!atmAmount.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số tiền đã chuyển.", variant: "destructive" });
      return;
    }

    const amount = parseInt(atmAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số tiền hợp lệ.", variant: "destructive" });
      return;
    }

    setApproveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-approve-atm", {
        body: { topup_request_id: pendingAtmRequest.id, transfer_amount: amount },
      });

      if (error || !data?.success) {
        toast({ title: "❌ Lỗi", description: data?.error || "Không thể phê duyệt.", variant: "destructive" });
        setApproveLoading(false);
        return;
      }

      toast({ title: "✅ Đã phê duyệt tự động", description: `Nạp ${formatVND(amount)} → Thực cộng ${formatVND(data.credit_amount)}` });
      setAtmAmount("");
      setPendingAtmRequest(null);

      const { data: newTopups } = await supabase.from("topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      setRecentTopups(newTopups || []);
    } catch (err) {
      toast({ title: "❌ Lỗi", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    } finally {
      setApproveLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent/10 border-accent/30 text-accent"><Clock className="w-3 h-3" /> Chờ xử lý</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-primary/10 border-primary/30 text-primary"><CheckCircle className="w-3 h-3" /> Đã duyệt</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-destructive/10 border-destructive/30 text-destructive"><XCircle className="w-3 h-3" /> Từ chối</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-primary neon-text text-center">NẠP QUA ATM / CHUYỂN KHOẢN</h1>
        <p className="text-center text-muted-foreground text-sm">Chuyển khoản ngân hàng — Bonus +5% đến +10%</p>

        <div className="space-y-6 animate-slide-up">
          {/* Bonus banner */}
          <div className="gradient-accent rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-accent-foreground" />
              <div>
                <p className="font-bold text-accent-foreground">ƯU ĐÃI KHI NẠP ATM</p>
                <p className="text-sm text-accent-foreground/80">Nạp dưới 50k → +10% bonus. Từ 50k trở lên → +5% bonus!</p>
              </div>
            </div>
            <span className="font-display text-2xl font-bold text-accent-foreground">+10%</span>
          </div>

          {/* Bank accounts */}
          <div className="bg-card border border-border rounded-xl p-6 neon-card space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-neon-cyan" />
              <h2 className="font-display text-lg font-bold text-secondary neon-cyan-text">CHUYỂN KHOẢN NGÂN HÀNG</h2>
            </div>
            <div className="space-y-3">
              {/* MB Bank with Sepay QR */}
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><Wallet className="w-5 h-5 text-white" /></div>
                  <div><h3 className="text-white font-bold">MB Bank</h3><p className="text-blue-100 text-xs">NGUYEN NGOC QUY</p></div>
                </div>
                <div className="bg-white p-6 space-y-4">
                  {loadingQr ? (
                    <div className="w-56 h-56 flex items-center justify-center bg-gray-100 rounded-lg mx-auto"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                  ) : sepayQrUrl ? (
                    <img src={sepayQrUrl} alt="MB Bank Sepay QR" className="w-56 h-56 rounded-lg border-2 border-gray-200 object-contain mx-auto" />
                  ) : (
                    <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center mx-auto"><p className="text-sm text-gray-500">QR đang được tạo...</p></div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Số tài khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">0365739178</span>
                        <button onClick={() => handleCopy("0365739178", "MB Bank")} className="text-blue-600 text-xs">
                          {copiedField === "MB Bank" ? <><CheckCircle className="w-3 h-3" /> Đã copy</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Chủ tài khoản</span>
                      <span className="font-bold text-gray-900">NGUYEN NGOC QUY</span>
                    </div>
                    {transferCode && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mt-3">
                        <p className="text-xs text-gray-600 mb-1">NỘI DUNG CHUYỂN KHOẢN</p>
                        <div className="flex items-center justify-between">
                          <code className="font-bold text-red-600 text-sm">{transferCode}</code>
                          <button onClick={() => handleCopy(transferCode, "content")} className="text-blue-600 text-xs">
                            {copiedField === "content" ? <><CheckCircle className="w-3 h-3" /> Đã copy</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Approve ATM Transfer */}
          {pendingAtmRequest && (
            <div className="bg-card border border-accent/30 rounded-xl p-6 neon-card">
              <div className="flex items-center gap-2 mb-4"><CheckCircle className="w-6 h-6 text-accent" /><h3 className="font-bold text-foreground">⚡ Đã chuyển khoản?</h3></div>
              <p className="text-sm text-muted-foreground mb-4">Nhập số tiền bạn đã chuyển để hệ thống tự động phê duyệt và cộng tiền ngay.</p>
              <div className="space-y-3">
                <input type="text" value={atmAmount} onChange={(e) => setAtmAmount(e.target.value.replace(/\D/g, ""))} placeholder="Số tiền đã chuyển (VNĐ)" className="w-full bg-muted border border-border rounded-lg py-3 px-4" />
                {atmAmount && <p className="text-xs text-accent">💰 Bạn sẽ nhận: {formatVND(parseInt(atmAmount, 10) < 50000 ? Math.floor(parseInt(atmAmount, 10) * 1.10) : Math.floor(parseInt(atmAmount, 10) * 1.05))}</p>}
                <button onClick={handleAutoApproveAtm} disabled={approveLoading || !atmAmount} className="w-full py-3 gradient-accent text-accent-foreground font-bold rounded-lg flex items-center justify-center gap-2">
                  {approveLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><CheckCircle className="w-4 h-4" /> Phê duyệt tự động → Cộng tiền ngay</>}
                </button>
              </div>
            </div>
          )}

          {/* Lịch sử nạp */}
          {user && (
            <div className="bg-card border border-border rounded-xl p-6 neon-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><History className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">Lịch sử nạp gần đây</h3></div>
                <Link to="/lich-su-nap" className="text-primary text-xs font-semibold hover:underline">Xem tất cả →</Link>
              </div>
              {loadingTopups ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : recentTopups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có lịch sử nạp tiền.</p>
              ) : (
                <div className="space-y-2">
                  {recentTopups.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3 px-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10"><CheckCircle className="w-4 h-4 text-primary" /></div>
                        <div><p className="text-sm font-medium text-foreground">{t.method}</p><p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString("vi-VN")}</p></div>
                      </div>
                      <div className="text-right"><p className="font-bold text-sm text-primary">+{formatVND(t.amount)}</p>{statusBadge(t.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BankTopUp;
