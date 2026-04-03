import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const WarrantyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="bg-gradient-to-r from-destructive to-neon-orange rounded-xl p-4">
          <h1 className="font-display text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7" /> CHÍNH SÁCH BẢO HÀNH
          </h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" /> Quyền lợi bảo hành
            </h2>
            <div className="space-y-3 pl-7">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Đổi trả 1-1</h3>
                  <p className="text-sm text-muted-foreground">Nếu tài khoản bị sai mật khẩu hoặc không đúng như mô tả khi vừa mua xong.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Hỗ trợ 24h</h3>
                  <p className="text-sm text-muted-foreground">Tiếp nhận khiếu nại trong vòng 24h kể từ thời điểm giao dịch thành công.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Đổi mật khẩu ngay</h3>
                  <p className="text-sm text-muted-foreground">Người mua có trách nhiệm đổi mật khẩu và cập nhật thông tin bảo mật ngay sau khi nhận tài khoản.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-neon-orange" /> Từ chối bảo hành khi
            </h2>
            <div className="space-y-3 pl-7">
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Sử dụng phần mềm thứ 3 (Hack/Cheat) sau khi mua.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Tự làm lộ thông tin hoặc không đổi mật khẩu sau khi nhận.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Chia sẻ tài khoản cho nhiều người dùng chung.</p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Khiếu nại sau 24h kể từ thời điểm giao dịch.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WarrantyPolicy;
