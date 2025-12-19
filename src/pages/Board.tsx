import { useEffect, useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Paperclip, MessageSquare } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  boardStatusLabels,
  boardStatusStyles,
  BoardPostStatus,
  BoardQuestionStatus,
} from "@/constants/boardStatus";
import { getPosts } from "@/apis/postApi";
import { ProjectPhase, type PageInfo, type PostItem } from "@/types/post";
import { getStepsByProject } from "@/apis/stepApi";
import type { StepResponse } from "@/types/step";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton UI 임포트 추가

interface BoardPost {
  id: number;
  title: string;
  author: string;
  date: string;
  attachments: number;
  comments: number;
  projectStatus: string;
  stepId: number;
  openStatus: "OPEN" | "CLOSED";
  questionStatus: BoardQuestionStatus | null;
  hasQuestions: boolean;
}

const projectPhases = ["전체", "계약", "진행", "납품", "유지보수"];

// ProjectPhase enum 값으로 매핑
const projectPhaseEnumMap: Record<string, ProjectPhase | ""> = {
  "전체": "",
  "계약": ProjectPhase.CONTRACT,
  "진행": ProjectPhase.IN_PROGRESS,
  "납품": ProjectPhase.DELIVERY,
  "유지보수": ProjectPhase.MAINTENANCE,
};

// Enum 값을 한글 라벨로 역매핑
const projectPhaseReverseMap: Record<string, string> = {
  "CONTRACT": "계약",
  "IN_PROGRESS": "진행",
  "DELIVERY": "납품",
  "MAINTENANCE": "유지보수",
};

// 게시글 항목 스켈레톤 컴포넌트 정의
const BoardPostSkeleton = () => (
  <Card className="border border-border/70 rounded-xl">
    <CardContent className="p-4 space-y-2">
      <div className="flex items-start gap-3">
        {/* 진행/완료 배지 */}
        <Skeleton className="h-6 w-16 rounded-full" />

        {/* 제목/작성자 */}
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <Skeleton className="h-4 w-12" />
            <span className="text-muted-foreground">•</span>
            <Skeleton className="h-4 w-16" />
            <span className="text-muted-foreground">•</span>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>

        {/* 승인 요청 / 첨부파일 / 댓글 */}
        <div className="flex flex-col gap-2 items-end">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-6" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);


export default function Board() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const pageSize = 5;
  const [activeProjectPhase, setActiveProjectPhase] = useState("전체");
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    currentPage: 0,
    pageSize,
    totalElements: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [postStatusFilter, setPostStatusFilter] = useState<"전체" | "Open" | "Closed">("전체");
  const [steps, setSteps] = useState<StepResponse[]>([]);
  const [isStepsLoading, setIsStepsLoading] = useState(true); // 단계 로딩 상태 추가

  // 선택된 phase에 해당하는 step만 필터링
  const activePhaseEnum = projectPhaseEnumMap[activeProjectPhase];
  const filteredSteps = activePhaseEnum
    ? steps.filter(step => step.phase === activePhaseEnum)
    : steps;
  const availableSteps = [
    { id: null, name: "전체" },
    ...filteredSteps.map(step => ({ id: step.id, name: step.title }))
  ];

  // 백엔드에서 step 목록 가져오기
  useEffect(() => {
    const fetchSteps = async () => {
      if (!id) return;
      setIsStepsLoading(true);
      try {
        const response = await getStepsByProject(Number(id));
        setSteps(response.steps);
      } catch (error) {
        console.error("Step 목록 조회 실패:", error);
      } finally {
        setIsStepsLoading(false);
      }
    };

    fetchSteps();
  }, [id]);

  // 뒤로가기 시 필터 상태 복원 (steps 로드 완료 후 실행)
  useEffect(() => {
    if (isStepsLoading) return; // steps가 로드될 때까지 대기

    const locationState = location.state as {
      restorePhase?: string;
      restoreStepId?: number;
    } | null;

    if (locationState?.restorePhase) {
      const phaseLabel = projectPhaseReverseMap[locationState.restorePhase];
      if (phaseLabel) {
        setActiveProjectPhase(phaseLabel);
      }
    }

    if (locationState?.restoreStepId !== undefined) {
      setSelectedStepId(locationState.restoreStepId);
    }

    // 상태 복원 후 location.state 초기화 (한 번만 실행)
    if (locationState) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isStepsLoading]); // steps 대신 isStepsLoading 사용

  // 백엔드에서 게시글 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await getPosts(Number(id), {
          page: currentPage - 1,
          size: pageSize,
          stepId: selectedStepId ?? undefined,
          projectPhase: activePhaseEnum || undefined,
          openStatus: postStatusFilter === "전체" ? undefined : (postStatusFilter === "Open" ? "OPEN" : "CLOSED"),
          sortBy: "createdAt",
          direction: "DESC",
        });

        // projectPhase 매핑
        const projectPhaseMap: Record<string, string> = {
          "CONTRACT": "계약",
          "IN_PROGRESS": "진행",
          "DELIVERY": "납품",
          "MAINTENANCE": "유지보수",
        };

        // 백엔드 데이터를 프론트 형식으로 변환
        const convertedPosts: BoardPost[] = response.posts.map((post: PostItem) => {
          // 질문 상태 매핑: WAITING_ANSWER -> waiting, ANSWERED -> answered
          let questionStatus: BoardQuestionStatus | null = null;
          if (post.hasQuestions) {
            if (post.status === "WAITING_ANSWER") {
              questionStatus = "waiting";
            } else if (post.status === "ANSWERED") {
              questionStatus = "answered";
            }
          }

          return {
            id: post.postId,
            title: post.title,
            author: post.author.name,
            date: post.createdAt.split('T')[0], // ISO 8601 -> YYYY-MM-DD
            attachments: post.hasFiles ? 1 : 0, // 임시: 실제로는 파일 개수 필요
            comments: post.commentCount,
            projectStatus: projectPhaseMap[post.projectPhase] || post.projectPhase,
            stepId: post.stepId,
            openStatus: post.openStatus || "OPEN",
            hasQuestions: post.hasQuestions,
            questionStatus,
          };
        });

        setPosts(convertedPosts);
        setPageInfo(response.pageInfo);
      } catch (error) {
        console.error("게시글 목록 조회 실패:", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [id, currentPage, activePhaseEnum, selectedStepId, postStatusFilter]);

  // phase 변경 시 선택된 step이 해당 phase에 속하지 않으면 초기화
  useEffect(() => {
    if (selectedStepId !== null) {
      const isStepInActivePhase = filteredSteps.some(step => step.id === selectedStepId);
      if (!isStepInActivePhase) {
        setSelectedStepId(null);
      }
    }
  }, [activeProjectPhase, selectedStepId, filteredSteps]);

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

  const goToPage = (page: number) => {
    const totalPages = pageInfo.totalPages || 1;
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleProjectPhaseChange = (phase: string) => {
    setActiveProjectPhase(phase);
    setSelectedStepId(null);
    setCurrentPage(1);
  };

  const getStepName = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    return step?.title ?? "미정 단계";
  };

  const handlePostClick = (postId: number) => {
    navigate(`/project/${id}/board/${postId}`);
  };

  // 필터링된 게시글 (클라이언트 사이드 필터링)
  const clientFilteredPosts = posts.filter((post) => {
    if (postStatusFilter === "진행중" && post.status !== "progress") return false;
    if (postStatusFilter === "완료" && post.status !== "complete") return false;
    return true;
  });

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">게시판</h1>
          <Button
            className="gap-2"
            onClick={() => navigate(`/project/${id}/board/new`, {
              state: {
                preSelectedPhase: activeProjectPhase !== "전체" ? projectPhaseEnumMap[activeProjectPhase] : undefined,
                preSelectedStepId: selectedStepId ?? undefined,
              }
            })}
            disabled={isLoading} // 로딩 중 작성 버튼 비활성화
          >
            <Plus className="h-4 w-4" />
            게시글 작성
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-2 mt-1">
              {projectPhases.map((phase) => (
                <button
                  key={phase}
                  onClick={() => handleProjectPhaseChange(phase)}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm rounded-full border transition-colors",
                    activeProjectPhase === phase
                      ? "bg-primary text-white border-primary"
                      : "text-muted-foreground border-input hover:text-foreground"
                  )}
                  disabled={isLoading} // 로딩 중 필터 비활성화
                >
                  {phase}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                {isStepsLoading ? (
                  // 단계 로딩 중 스켈레톤
                  <>
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-14" />
                  </>
                ) : availableSteps.map((stepOption) => {
                  const isSelected = selectedStepId === stepOption.id || (stepOption.id === null && selectedStepId === null);
                  return (
                    <button
                      key={stepOption.id ?? "all"}
                      onClick={() => toggleStep(stepOption.id)}
                      className={cn(
                        "pb-1 border-b-2 transition-colors",
                        isSelected ? "text-primary border-primary font-semibold" : "text-muted-foreground border-transparent hover:text-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {stepOption.name}
                    </button>
                  );
                })}
              </div>
              <Select
                value={postStatusFilter}
                onValueChange={(value: "전체" | "Open" | "Closed") => {
                  setPostStatusFilter(value);
                  setCurrentPage(1);
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 게시글 목록 */}
            <div className="space-y-2">
              {isLoading && (
                // 로딩 중일 때 항목 스켈레톤 표시
                Array.from({ length: pageSize }).map((_, i) => (
                  <BoardPostSkeleton key={i} />
                ))
              )}

              {!isLoading && posts.map((post) => (
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

                      {/* Open/Closed */}
                      <div
                        className={cn(
                          "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium border w-[70px]",
                          post.openStatus === "OPEN"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        )}
                      >
                        {post.openStatus}
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

                      {/* 질문 답변 상태 */}
                      <div className="flex flex-col gap-2 items-end">

                        {post.hasQuestions && post.questionStatus && (
                          <div
                            className={cn(
                              "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                              boardStatusStyles[post.questionStatus]
                            )}
                          >
                            {boardStatusLabels[post.questionStatus]}
                          </div>
                        )}

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

              {!isLoading && posts.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">게시글이 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between pt-4 border-t">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    총 {pageInfo.totalElements}건 · {pageInfo.currentPage + 1}/{pageInfo.totalPages || 1} 페이지
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={!pageInfo.hasPrevious || currentPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={!pageInfo.hasNext || currentPage >= (pageInfo.totalPages || 1)}
                    >
                      다음
                    </Button>
                  </div>
                </>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}