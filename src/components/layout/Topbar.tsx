import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/apis/api";

interface CurrentUser {
  name: string;
  companyName?: string;
}

export function Topbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/api/users/me", { signal: controller.signal });
        const data = response.data?.data;
        if (data) {
          setUser({
            name: data.name ?? "이용자",
            companyName: data.companyName ?? undefined,
          });
        }
      } catch {
        // keep fallback user state
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <header className="rounded-2xl border bg-white/80 px-6 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-inner">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {user?.companyName ?? "weflow workspace"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "정보 불러오는 중..." : `${user?.name ?? "이용자"}님`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
