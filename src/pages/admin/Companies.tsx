import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/apis/admin";
import { useToast } from "@/hooks/use-toast";

const Companies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await adminApi.getCompanies();
        if (response.success) {
          setCompanies(response.data.content);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "회사 목록 조회 실패",
          description: error.response?.data?.message || "회사 목록을 불러올 수 없습니다.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">활성</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-700">비활성</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회사 관리</h1>
          <p className="text-muted-foreground mt-1">회사 관리 {'>'} 회사 목록</p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/admin/companies/create")}
        >
          <Plus className="h-4 w-4" />
          회사 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회사 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">진행 상태</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">검색:</label>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="회사명 / 대표자"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* 회사 목록 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 bg-muted p-4 font-medium text-sm">
              <div>회사명</div>
              <div>대표자</div>
              <div>대표 이메일</div>
              <div>활성 상태</div>
            </div>
            <div className="divide-y">
              {companies.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  회사가 없습니다.
                </div>
              ) : (
                companies.map((company) => (
                  <div
                    key={company.id}
                    className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/companies/${company.id}/edit`)}
                  >
                    <div className="font-medium">{company.name}</div>
                    <div className="text-muted-foreground">{company.representative || "-"}</div>
                    <div className="text-muted-foreground">{company.email || "-"}</div>
                    <div>{getStatusBadge(company.status)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Companies;
