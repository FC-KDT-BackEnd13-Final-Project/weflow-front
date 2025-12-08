import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TemplateList = () => {
  const navigate = useNavigate();

  const templates = [
    {
      id: 1,
      title: "쇼핑몰 기본 템플릿",
      category: "쇼핑몰",
      questionCount: 8,
      createdAt: "2025-11-20",
    },
    {
      id: 2,
      title: "홈페이지 제작 체크리스트",
      category: "홈페이지",
      questionCount: 5,
      createdAt: "2025-11-18",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 제목 + 생성 버튼 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">체크리스트 템플릿</h1>
        <Button onClick={() => navigate("/admin/checklist-templates/create")}>
          + 템플릿 생성
        </Button>
      </div>

      {/* 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>템플릿 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="
                p-4 border rounded-lg 
                cursor-pointer hover:bg-gray-50 
                transition flex justify-between items-center
              "
              onClick={() => navigate(`/admin/checklist-templates/${tpl.id}`)}
            >
              <div>
                <p className="font-medium text-lg">{tpl.title}</p>
                <p className="text-sm text-muted-foreground">
                  {tpl.category} · 질문 {tpl.questionCount}개 · 생성 {tpl.createdAt}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateList;
