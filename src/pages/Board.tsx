import { useEffect, useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Paperclip, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

type PostStatus = "progress" | "complete";
type QuestionStatus = "request" | "approved";

interface BoardPost {
  id: number;
  title: string;
  author: string;
  date: string;
  attachments: number;
  comments: number;
  category: string;
  tags: string[];
  status: PostStatus;
  questionStatus: QuestionStatus;
}

const mockPosts: BoardPost[] = [
  {
    id: 1,
    title: "요구사항 문서",
    author: "박민수",
    date: "2024-01-11",
    attachments: 5,
    comments: 10,
    category: "진행",
    tags: ["요구사항 정의"],
    status: "progress",
    questionStatus: "request",
  },
  {
    id: 2,
    title: "화면 설계 검토 요청",
    author: "김지현",
    date: "2024-01-10",
    attachments: 3,
    comments: 7,
    category: "진행",
    tags: ["화면설계"],
    status: "progress",
    questionStatus: "request",
  },
  {
    id: 3,
    title: "디자인 시안 1차",
    author: "이서연",
    date: "2024-01-09",
    attachments: 8,
    comments: 12,
    category: "진행",
    tags: ["디자인"],
    status: "complete",
    questionStatus: "approved",
  },
  {
    id: 4,
    title: "요구사항 수정 요청 드립니다",
    author: "김개발",
    date: "2024-01-08",
    attachments: 2,
    comments: 3,
    category: "계약",
    tags: ["요구사항 정의"],
    status: "complete",
    questionStatus: "request",
  },
];

const categories = ["전체", "계약", "진행", "납품", "유지보수"];
const categoryTags: Record<string, string[]> = {
  전체: ["전체", "요구사항 정의", "화면설계", "디자인", "퍼블리싱", "개발", "검수"],
  계약: ["전체", "요구사항 정의"],
  진행: ["전체", "요구사항 정의", "화면설계", "디자인"],
  납품: ["전체", "퍼블리싱", "개발", "검수"],
  유지보수: ["전체", "개발", "검수"],
};

const statusStyles: Record<PostStatus, string> = {
  progress: "bg-blue-100 text-blue-700 border-blue-200",
  complete: "bg-green-100 text-green-700 border-green-200",
};

const statusLabels: Record<PostStatus, string> = {
  progress: "진행중",
  complete: "완료",
};

const questionStatusStyles: Record<QuestionStatus, string> = {
  request: "!bg-[#FFE899] !text-[#7A4A00] !border-[#F5CA6A]",
  approved: "!bg-[#D3F9D8] !text-[#1B5E20] !border-[#A5E4AE]",
};

const questionLabels: Record<QuestionStatus, string> = {
  request: "승인 요청",
  approved: "승인",
};

export default function Board() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeCategory, setActiveCategory] = useState("전체");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const posts = mockPosts;
  const [postStatusFilter, setPostStatusFilter] = useState<"전체" | "진행중" | "완료">("전체");
  const pageSize = 5;

  const availableTags = categoryTags[activeCategory] || categoryTags["전체"];

  useEffect(() => {
    const tagsForCategory = categoryTags[activeCategory] || categoryTags["전체"];
    if (selectedTag && !tagsForCategory.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [activeCategory, selectedTag]);

  const toggleTag = (tag: string) => {
    if (tag === "전체") {
      setSelectedTag(null);
      setCurrentPage(1);
      return;
    }
    setSelectedTag(prev => {
      const next = prev === tag ? null : tag;
      setCurrentPage(1);
      return next;
    });
  };

  const filteredPosts = posts.filter(post => {
    if (activeCategory !== "전체" && post.category !== activeCategory) return false;
    if (selectedTag && selectedTag !== "전체" && !post.tags.includes(selectedTag)) return false;
    if (postStatusFilter === "진행중" && post.status !== "progress") return false;
    if (postStatusFilter === "완료" && post.status !== "complete") return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSelectedTag(null);
    setCurrentPage(1);
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">게시판</h1>
          <Button className="gap-2" onClick={() => navigate(`/project/${id}/board/new`)}>
            <Plus className="h-4 w-4" />
            게시글 작성
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm rounded-full border transition-colors",
                    activeCategory === category
                      ? "bg-primary text-white border-primary"
                      : "text-muted-foreground border-input hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                {availableTags.map((tag) => {
                  const isSelected = selectedTag ? selectedTag === tag : tag === "전체";
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "pb-1 border-b-2 transition-colors",
                        isSelected ? "text-primary border-primary font-semibold" : "text-muted-foreground border-transparent hover:text-foreground"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <Select
                value={postStatusFilter}
                onValueChange={(value: "전체" | "진행중" | "완료") => {
                  setPostStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 게시글 목록 */}
            <div className="space-y-2">
              {paginatedPosts.map((post) => (
                <Card
                  key={post.id}
                  className="card-hover cursor-pointer hover:shadow-md transition-shadow border border-border/70 rounded-xl"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-3">

                      {/* 진행/완료 */}
                      <div
                        className={cn(
                          "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                          statusStyles[post.status]
                        )}
                      >
                        {statusLabels[post.status]}
                      </div>

                      {/* 제목/작성자 */}
                      <div className="flex flex-1 flex-col gap-1">
                        <h3 className="text-base font-semibold">{post.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{post.date}</span>
                        </div>
                      </div>

                      {/* 승인 요청 / 승인 */}
                      <div className="flex flex-col gap-2 items-end">

                        <div
                          className={cn(
                            "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                            questionStatusStyles[post.questionStatus]
                          )}
                        >
                          {questionLabels[post.questionStatus]}
                        </div>

                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="flex items-center gap-1 text-xs">
                            <Paperclip className="h-4 w-4" />
                            <span>{post.attachments}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.comments}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredPosts.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">게시글이 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">총 {filteredPosts.length}건 · {currentPage}/{totalPages} 페이지</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
