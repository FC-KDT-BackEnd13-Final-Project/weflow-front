import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const CompanyCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    representative: "",
    email: "",
    address: "",
    businessNumber: "",
    memo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 회사 등록 로직
    console.log("회사 등록:", formData);
    navigate("/admin/companies");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회사 관리</h1>
          <p className="text-muted-foreground mt-1">
            회사 관리 {'>'} 회사 생성
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회사명</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">회사명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="회사명 입력"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representative">대표자명</Label>
              <Input
                id="representative"
                value={formData.representative}
                onChange={(e) =>
                  setFormData({ ...formData, representative: e.target.value })
                }
                placeholder="대표자명 입력"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">대표 이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="example@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">회사 주소</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="예: 서울특별시 강남구 테헤란로 231, 11층"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessNumber">사업자등록번호</Label>
              <Input
                id="businessNumber"
                value={formData.businessNumber}
                onChange={(e) =>
                  setFormData({ ...formData, businessNumber: e.target.value })
                }
                placeholder="123-45-67890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Textarea
                id="memo"
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
                placeholder="회사 주소 이전 예정(12월 초 계획). 프로젝트 문서에도 반영해야 함."
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/companies")}
              >
                취소
              </Button>
              <Button type="submit">등록</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyCreate;
