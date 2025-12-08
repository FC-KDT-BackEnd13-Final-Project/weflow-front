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

const Members = () => {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("전체");
  const [companyFilter, setCompanyFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const members = [
    {
      name: "김철수",
      email: "kim@dev.com",
      role: "개발사",
      company: "개발사 A",
    },
    {
      name: "이영희",
      email: "lee@con.com",
      role: "고객사",
      company: "ClientA",
      badge: "A소핑몰"
    },
    {
      name: "박민수",
      email: "park@dev.com",
      role: "개발사",
      company: "DevCorp",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            회원 목록 {'>'} 회원 목록
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => navigate("/admin/members/create")}>
          <Plus className="h-4 w-4" />
          회원 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">역할</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="관리자">관리자</SelectItem>
                  <SelectItem value="개발자">개발자</SelectItem>
                  <SelectItem value="고객사">고객사</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">회사</label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="회사1">회사1</SelectItem>
                  <SelectItem value="회사2">회사2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">검색:</label>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름 / 이메일 입력"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* 회원 목록 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 bg-muted p-4 font-medium text-sm">
              <div>이름</div>
              <div>이메일</div>
              <div>역할</div>
              <div>회사명</div>
            </div>
            <div className="divide-y">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/members/${index + 1}`)}
                >
                  <div className="font-medium">{member.name}</div>
                  <div className="text-muted-foreground">{member.email}</div>
                  <div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{member.company}</span>
                    {member.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {member.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
