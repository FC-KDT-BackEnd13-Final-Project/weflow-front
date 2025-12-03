import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import AddCategoryModal from "@/components/admin/AddCategoryModal";
import { useToast } from "@/hooks/use-toast";

const TemplateCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 기본 템플릿 정보 states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // 카테고리 목록
  const [categories, setCategories] = useState([
    "쇼핑몰",
    "기업 홈페이지",
    "포트폴리오",
    "병원/의료",
    "교육/강의",
    "기타",
  ]);
  const [openAddCategory, setOpenAddCategory] = useState(false);

  // 질문 목록
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      text: "",
      type: "single",
      options: [],
    },
  ]);

  // 질문 추가
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        text: "",
        type: "single",
        options: [],
      },
    ]);
  };

  // 질문 삭제
  const deleteQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // 옵션 추가
  const addOption = (qid) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? { ...q, options: [...q.options, ""] }
          : q
      )
    );
  };

  // 옵션 삭제
  const deleteOption = (qid, idx) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.filter((_, i) => i !== idx) }
          : q
      )
    );
  };

  // 새 카테고리 저장
  const handleAddCategory = (newCategory) => {
    if (!categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
    setCategory(newCategory);
  };

  // 템플릿 생성 API 호출
  const createTemplate = () => {
    if (!title.trim()) return alert("템플릿 제목을 입력하세요.");
    if (!category) return alert("카테고리를 선택하세요.");

    // API 로직 작성
    toast({
      title: "템플릿 생성 완료",
      description: "새 템플릿이 저장되었습니다.",
    });
    navigate("/admin/checklist-templates");
  };

  return (
    <div className="space-y-8">
      
      {/* ------- 상단 헤더 ------- */}
      <h1 className="text-3xl font-bold">템플릿 생성</h1>

      {/* ------- 기본 정보 ------- */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>새로운 체크리스트 템플릿을 생성합니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="템플릿 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="템플릿 설명 입력"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c, i) => (
                    <SelectItem key={i} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => setOpenAddCategory(true)}>
              + 새 카테고리
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ------- 질문 목록 ------- */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>질문 목록</CardTitle>
            <CardDescription>템플릿에 포함될 질문들을 추가하세요.</CardDescription>
          </div>

          <Button onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-1" />
            질문 추가
          </Button>
        </CardHeader>

        <CardContent className="space-y-8">
          {questions.map((q, index) => (
            <div key={q.id} className="border rounded-lg p-4 space-y-4 relative">

              {/* 삭제 버튼 */}
              <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                onClick={() => deleteQuestion(q.id)}
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <p className="font-medium text-gray-700">질문 #{index + 1}</p>

              {/* 질문 입력 */}
              <Input
                placeholder="질문 입력"
                value={q.text}
                onChange={(e) =>
                  setQuestions(
                    questions.map((item) =>
                      item.id === q.id ? { ...item, text: e.target.value } : item
                    )
                  )
                }
              />

              {/* 질문 타입 선택 */}
              <Select
                value={q.type}
                onValueChange={(value) =>
                  setQuestions(
                    questions.map((item) =>
                      item.id === q.id ? { ...item, type: value } : item
                    )
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="질문 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">단일 선택</SelectItem>
                  <SelectItem value="multi">다중 선택</SelectItem>
                  <SelectItem value="text">서술형</SelectItem>
                </SelectContent>
              </Select>

              {/* 옵션 입력 (단일/다중 선택일 때) */}
              {(q.type === "single" || q.type === "multi") && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {q.type === "multi" ? "옵션 목록 (복수 선택 가능)" : "옵션 목록"}
                  </p>

                  {q.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="옵션 입력"
                        value={opt}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((item) =>
                              item.id === q.id
                                ? {
                                    ...item,
                                    options: item.options.map((o, i) =>
                                      i === idx ? e.target.value : o
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <Trash2
                        className="w-4 h-4 text-red-500 cursor-pointer"
                        onClick={() => deleteOption(q.id, idx)}
                      />
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={() => addOption(q.id)}>
                    + 옵션 추가
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ------- 생성 버튼 ------- */}
      <div className="flex justify-end">
        <Button size="lg" className="gap-2" onClick={createTemplate}>
          템플릿 생성
        </Button>
      </div>

      {/* ------- 카테고리 추가 모달 ------- */}
      <AddCategoryModal
        open={openAddCategory}
        onClose={() => setOpenAddCategory(false)}
        onConfirm={handleAddCategory}
      />
    </div>
  );
};

export default TemplateCreate;
