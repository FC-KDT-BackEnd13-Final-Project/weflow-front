import { useEffect, useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Paperclip, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { mockProjectSteps, projectStepMap } from "@/mocks/projectSteps";
import {
  boardStatusLabels,
  boardStatusStyles,
  BoardPostStatus,
  BoardApprovalStatus,
} from "@/constants/boardStatus";

interface BoardPost {
  id: number;
  title: string;
  author: string;
  date: string;
  attachments: number;
  comments: number;
  projectStatus: string;
  stepId: number;
  status: BoardPostStatus;
  questionStatus: BoardApprovalStatus;
}

const mockPosts: BoardPost[] = [
  {
    id: 42,
    title: "요구사항 문서",
    author: "박민수",
    date: "2024-01-11",
    attachments: 5,
    comments: 10,
    projectStatus: "진행",
    stepId: 21,
    status: "progress",
    questionStatus: "request",
  },
  {
    id: 43,
    title: "화면 설계 검토 요청",
    author: "김지현",
    date: "2024-01-10",
    attachments: 3,
    comments: 7,
    projectStatus: "진행",
    stepId: 22,
    status: "progress",
    questionStatus: "request",
  },
  {
    id: 44,
    title: "디자인 시안 1차",
    author: "이서연",
    date: "2024-01-09",
    attachments: 8,
    comments: 12,
    projectStatus: "진행",
    stepId: 23,
    status: "complete",
    questionStatus: "approved",
  },
  {
    id: 45,
    title: "요구사항 수정 요청 드립니다",
    author: "김개발",
    date: "2024-01-08",
    attachments: 2,
    comments: 3,
    projectStatus: "계약",
    stepId: 21,
    status: "complete",
    questionStatus: "rejected",
  },
];

const projectStatuses = ["전체", "계약", "진행", "납품", "유지보수"];
const statusStepMap: Record<string, number[]> = {
  전체: mockProjectSteps.map((step) => step.id),
  계약: [21],
  진행: [21, 22, 23, 24],
  납품: [24, 25],
  유지보수: [25],
};

export default function Board() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeProjectStatus, setActiveProjectStatus] = useState("전체");
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const posts = mockPosts;
  const [postStatusFilter, setPostStatusFilter] = useState<"전체" | "진행중" | "완료">("전체");
  const pageSize = 5;

  const stepsForActiveStatus = statusStepMap[activeProjectStatus] || statusStepMap["전체"];
  const stepOptions = stepsForActiveStatus
    .map((stepId) => projectStepMap[stepId])
    .filter((step): step is NonNullable<typeof step> => Boolean(step))
    .map((step) => ({ id: step.id, name: step.name }));
  const availableSteps = [{ id: null, name: "전체" }, ...stepOptions];

  useEffect(() => {
    const stepsForStatus = statusStepMap[activeProjectStatus] || statusStepMap["전체"];
    if (selectedStepId !== null && !stepsForStatus.includes(selectedStepId)) {
      setSelectedStepId(null);
    }
  }, [activeProjectStatus, selectedStepId]);

  const toggleStep = (stepId: number | null) => {
    if (stepId === null) {
      setSelectedStepId(null);
      setCurrentPage(1);
      return;
    }
    setSelectedStepId(prev => {
      const next = prev === stepId ? null : stepId;
      setCurrentPage(1);
      return next;
    });
  };

  const filteredPosts = posts.filter(post => {
    if (activeProjectStatus !== "전체" && post.projectStatus !== activeProjectStatus) return false;
    if (selectedStepId !== null && post.stepId !== selectedStepId) return false;
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

  const handleProjectStatusChange = (status: string) => {
    setActiveProjectStatus(status);
    setSelectedStepId(null);
    setCurrentPage(1);
  };

  const getStepName = (stepId: number) => projectStepMap[stepId]?.name ?? "미정 단계";

  const handlePostClick = (postId: number) => {
    navigate(`/project/${id}/board/${postId}`);
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
              {projectStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleProjectStatusChange(status)}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm rounded-full border transition-colors",
                    activeProjectStatus === status
                      ? "bg-primary text-white border-primary"
                      : "text-muted-foreground border-input hover:text-foreground"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                {availableSteps.map((stepOption) => {
                  const isSelected = selectedStepId === stepOption.id || (stepOption.id === null && selectedStepId === null);
                  return (
                    <button
                      key={stepOption.id ?? "all"}
                      onClick={() => toggleStep(stepOption.id)}
                      className={cn(
                        "pb-1 border-b-2 transition-colors",
                        isSelected ? "text-primary border-primary font-semibold" : "text-muted-foreground border-transparent hover:text-foreground"
                      )}
                    >
                      {stepOption.name}
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
                  className="card-hover cursor-pointer hover:shadow-md transition-shadow border border-border/70 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => handlePostClick(post.id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handlePostClick(post.id);
                    }
                  }}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-3">

                      {/* 진행/완료 */}
                      <div
                        className={cn(
                          "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                          boardStatusStyles[post.status]
                        )}
                      >
                        {boardStatusLabels[post.status]}
                      </div>

                      {/* 제목/작성자 */}
                      <div className="flex flex-1 flex-col gap-1">
                        <h3 className="text-base font-semibold">{post.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{post.date}</span>
                          <span>•</span>
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-foreground bg-muted/40">
                            {getStepName(post.stepId)}
                          </span>
                        </div>
                      </div>

                      {/* 승인 요청 / 승인 */}
                      <div className="flex flex-col gap-2 items-end">

                        <div
                          className={cn(
                            "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                            boardStatusStyles[post.questionStatus]
                          )}
                        >
                          {boardStatusLabels[post.questionStatus]}
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
