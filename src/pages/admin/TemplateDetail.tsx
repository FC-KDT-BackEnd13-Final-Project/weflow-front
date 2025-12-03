import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TemplateDetail = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);

  useEffect(() => {
    // 실제 API 연결하면 fetch로 바꾸면 됨
    setTemplate({
      id: templateId,
      title: "쇼핑몰 기본 템플릿",
      description: "온라인 쇼핑몰 구축을 위한 체크리스트",
      category: "쇼핑몰",
      createdAt: "2025-11-20",
      questions: [
        {
          id: 1,
          text: "도메인을 보유하고 있나요?",
          type: "single",
          options: ["예", "아니요"],
        },
        {
          id: 2,
          text: "원하는 디자인 스타일이 있나요?",
          type: "text",
          options: [],
        },
      ],
    });
  }, [templateId]);

  if (!template) return null;

  return (
    <div className="space-y-8">

      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{template.title}</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/checklist-templates")}
          >
            목록
          </Button>
          <Button
            onClick={() => navigate(`/admin/checklist-templates/${templateId}/edit`)}
          >
            수정
          </Button>
          <Button variant="destructive">삭제</Button>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">카테고리:</span> {template.category}</p>
          <p className="text-muted-foreground">{template.description}</p>
          <p className="text-xs text-gray-500">생성일: {template.createdAt}</p>
        </CardContent>
      </Card>

      {/* 질문 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>질문 목록</CardTitle>
          <CardDescription>등록된 질문을 확인하세요.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {template.questions.map((q, idx) => (
            <div key={q.id} className="p-4 border rounded-lg space-y-2">

              <p className="font-semibold">
                {idx + 1}. {q.text}
              </p>

              <p className="text-sm text-gray-600">
                유형: {q.type === "single" ? "단일 선택" : "서술형"}
              </p>

              {q.type === "single" && (
                <ul className="list-disc ml-5 text-gray-700 text-sm">
                  {q.options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDetail;
