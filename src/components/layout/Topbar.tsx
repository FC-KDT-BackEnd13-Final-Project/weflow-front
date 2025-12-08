import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

const currentUser = {
  name: "홍길동",
  company: "ABC전자",
};

export function Topbar() {
  const navigate = useNavigate();

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
            <p className="text-lg font-semibold tracking-tight">{currentUser.company}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{currentUser.name}님</p>
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
