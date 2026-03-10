import { useState, useEffect } from "react";
import { Trophy, Crown, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_amount: number;
}

const maskName = (name: string | null) => {
  if (!name || name.length <= 3) return "***";
  return "***" + name.slice(-3);
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const TopUpLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    supabase.rpc("get_topup_leaderboard", { limit_count: 10 }).then(({ data }) => {
      setLeaders((data as LeaderEntry[]) || []);
    });
  }, []);

  if (leaders.length === 0) return null;

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (i === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">#{i + 1}</span>;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 neon-card">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h2 className="font-display text-lg font-bold text-foreground">BẢNG XẾP HẠNG NẠP</h2>
      </div>
      <div className="space-y-2">
        {leaders.map((l, i) => (
          <div key={l.user_id} className={`flex items-center gap-3 p-2.5 rounded-lg ${i < 3 ? "bg-primary/5 border border-primary/10" : "bg-muted/50"}`}>
            {rankIcon(i)}
            <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden shrink-0">
              {l.avatar_url ? (
                <img src={l.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {(l.display_name || "?")[0]}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-foreground flex-1 truncate">{maskName(l.display_name)}</span>
            <span className="text-sm font-bold text-primary font-mono">{formatVND(l.total_amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopUpLeaderboard;
