import { useState } from "react";
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

const Companies = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const companies = [
    {
      name: "4소핑몰",
      ceo: "김대표",
      email: "daepyo@shop.com",
      status: "활성",
    },
    {
      name: "B전자",
      ceo: "최대표",
      email: "daepyo@shop.com",
      status: "완료",
    },
    {
      name: "C전자",
      ceo: "이대표",
      email: "daepyo@shop.com",
      status: "활성",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "활성") {
      return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">{status}</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-700">{status}</Badge>;
  };

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
              {companies.map((company, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/companies/${index + 1}/edit`)}
                >
                  <div className="font-medium">{company.name}</div>
                  <div className="text-muted-foreground">{company.ceo}</div>
                  <div className="text-muted-foreground">{company.email}</div>
                  <div>{getStatusBadge(company.status)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Companies;
