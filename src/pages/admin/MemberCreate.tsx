import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BulkMemberUpload from "@/components/admin/BulkMemberUpload";
import { adminApi } from "@/apis/admin";
import { useToast } from "@/hooks/use-toast";

const AdminMemberCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "company1234",
    role: "AGENCY",
    companyId: "",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await adminApi.getCompanies(0, 9999, "", "ACTIVE");
        if (response.success) {
          setCompanies(response.data.content);
        }
      } catch (error) {
        console.error("회사 목록 로딩 실패:", error);
        toast({
          variant: "destructive",
          title: "회사 목록 로딩 실패",
          description: "회사 목록을 불러오는 중 오류가 발생했습니다.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [toast]);

  // Auto-fill role based on selected company type
  useEffect(() => {
    if (formData.companyId && companies.length > 0) {
      const selectedCompany = companies.find(
        (c) => c.id.toString() === formData.companyId
      );
      if (selectedCompany && selectedCompany.companyType) {
        setFormData((prev) => ({ ...prev, role: selectedCompany.companyType }));
      }
    }
  }, [formData.companyId, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.companyId) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
      });
      return;
    }

    // Validate company has type set
    const selectedCompany = companies.find(
      (c) => c.id.toString() === formData.companyId
    );

    if (!selectedCompany?.companyType) {
      toast({
        variant: "destructive",
        title: "회사 유형 미설정",
        description: "선택한 회사의 유형이 설정되지 않았습니다. 회사 정보를 먼저 수정해주세요.",
      });
      return;
    }

    // Validate role matches company type
    if (formData.role !== selectedCompany.companyType) {
      toast({
        variant: "destructive",
        title: "역할 불일치",
        description: "사용자 역할이 회사 유형과 일치하지 않습니다.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await adminApi.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        companyId: parseInt(formData.companyId),
      });

      if (response.success) {
        toast({
          title: "회원 생성 성공",
          description: response.message,
        });
        navigate("/admin/members");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원 생성 실패",
        description: error.response?.data?.message || "회원 생성에 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
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
      
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 생성</h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 {'>'} 회원 생성
          </p>
        </div>
      </div>

      {/* 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>회원 생성</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="individual" className="w-full">
            
            {/* 탭 버튼 */}
            <TabsList className="w-full grid grid-cols-2 gap-2">
              <TabsTrigger value="individual" className="w-full">
                개별 회원 생성
              </TabsTrigger>
              <TabsTrigger value="bulk" className="w-full">
                + 일괄 생성
              </TabsTrigger>
            </TabsList>

            {/* 개별 생성 */}
            <TabsContent value="individual" className="space-y-6 mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      placeholder="이름 입력"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호 *</Label>
                    <Input
                      id="phone"
                      placeholder="010-0000-0000"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                {/* 회사 선택 */}
                <div className="space-y-2">
                  <Label>소속 회사 *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="회사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                          {company.companyType && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({company.companyType === 'AGENCY' ? '에이전시' : '고객사'})
                            </span>
                          )}
                          {!company.companyType && (
                            <span className="text-xs text-destructive ml-2">(유형 미설정)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 역할 (자동 설정) */}
                <div className="space-y-3">
                  <Label>역할 *</Label>
                  <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {formData.role === "AGENCY" ? "에이전시 담당자" : "고객사 담당자"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ℹ️ 역할은 선택한 회사의 유형에 따라 자동으로 설정됩니다.
                  </p>
                </div>

                {/* 초기 비밀번호 */}
                <div className="space-y-2">
                  <Label htmlFor="password">초기 비밀번호</Label>
                  <Input
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    ℹ️ 회원이 첫 로그인 시 사용할 비밀번호입니다.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/members")}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "등록 중..." : "등록"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* 일괄 등록 탭 → BulkMemberUpload 컴포넌트 사용 */}
            <TabsContent value="bulk" className="mt-6">
              <BulkMemberUpload />
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMemberCreate;
