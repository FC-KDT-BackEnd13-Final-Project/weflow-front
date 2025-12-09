import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "@/apis/admin";
import { useToast } from "@/hooks/use-toast";

const AdminCompanyEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    representative: "",
    email: "",
    address: "",
    businessNumber: "",
    memo: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await adminApi.getCompanyById(Number(id));
        if (response.success) {
          const company = response.data;
          setFormData({
            name: company.name,
            representative: company.representative || "",
            email: company.email || "",
            address: company.address || "",
            businessNumber: company.businessNumber || "",
            memo: company.memo || "",
            status: company.status,
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "회사 정보 조회 실패",
          description: error.response?.data?.message || "회사 정보를 불러올 수 없습니다.",
        });
        navigate("/admin/companies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const response = await adminApi.updateCompany(Number(id), formData);
      if (response.success) {
        toast({
          title: "회사 정보 수정 성공",
          description: "회사 정보가 성공적으로 수정되었습니다.",
        });
        navigate("/admin/companies");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회사 정보 수정 실패",
        description: error.response?.data?.message || "회사 정보 수정 중 오류가 발생했습니다.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회사 관리</h1>
          <p className="text-muted-foreground mt-1">
            회사 관리 {'>'} 회사 목록 {'>'} 회사 상세
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
                variant="destructive"
                onClick={async () => {
                  if (!id) return;
                  if (window.confirm("정말로 이 회사를 삭제하시겠습니까?")) {
                    try {
                      const response = await adminApi.deleteCompany(Number(id));
                      if (response.success) {
                        toast({
                          title: "회사 삭제 성공",
                          description: "회사가 성공적으로 삭제되었습니다.",
                        });
                        navigate("/admin/companies");
                      }
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "회사 삭제 실패",
                        description: error.response?.data?.message || "회사 삭제 중 오류가 발생했습니다.",
                      });
                    }
                  }
                }}
              >
                삭제
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/companies")}
              >
                취소
              </Button>
              <Button type="submit">저장</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCompanyEdit;
