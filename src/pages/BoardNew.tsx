import { useState, useEffect } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, X, Link2, MessageSquare, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { createPost, updatePost, getPost } from "@/apis/postApi";
import { ProjectPhase, QuestionType } from "@/types/post";
import type { FileRequest, QuestionRequest, QuestionOptionRequest } from "@/types/post";
import { getStepsByProject } from "@/apis/stepApi";
import type { StepResponse } from "@/types/step";
import { getPresignedUrl, uploadFileToS3 } from "@/apis/attachmentApi";

const phaseOptions = [
  { value: ProjectPhase.CONTRACT, label: "계약" },
  { value: ProjectPhase.IN_PROGRESS, label: "진행" },
  { value: ProjectPhase.DELIVERY, label: "납품" },
  { value: ProjectPhase.MAINTENANCE, label: "유지보수" },
];

const postSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "제목을 입력해주세요" })
    .max(100, { message: "제목은 100자 이내로 입력해주세요" }),
  content: z.string()
    .trim()
    .min(1, { message: "내용을 입력해주세요" })
    .max(5000, { message: "내용은 5000자 이내로 입력해주세요" }),
  status: z.string()
    .min(1, { message: "프로젝트 상태를 선택해주세요" }),
  step: z.string()
    .min(1, { message: "단계를 선택해주세요" }),
});

type PostFormData = z.infer<typeof postSchema>;

export default function BoardNew() {
  const navigate = useNavigate();
  const { id, postId } = useParams<{ id: string; postId?: string }>();
  const location = useLocation();
  const locationState = location.state as {
    parentPostId?: number;
    parentTitle?: string;
    preSelectedPhase?: string;
    preSelectedStepId?: number;
  } | null;
  const replyInfo = locationState ? {
    parentPostId: locationState.parentPostId,
    parentTitle: locationState.parentTitle
  } : null;
  const isReply = Boolean(replyInfo?.parentPostId);
  const isEditMode = Boolean(postId); // postId가 있으면 수정 모드
  const { toast } = useToast();
  const [parentPostPhase, setParentPostPhase] = useState<string>("");
  const [parentPostStepId, setParentPostStepId] = useState<string>("");

  const [formData, setFormData] = useState<PostFormData>({
    title: replyInfo?.parentTitle ? `Re: ${replyInfo.parentTitle}` : "",
    content: "",
    status: locationState?.preSelectedPhase || "",
    step: locationState?.preSelectedStepId?.toString() || "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ fileId: number; fileName: string; fileSize: number; filePath: string }[]>([]);
  const [links, setLinks] = useState<{ linkId?: number; url: string }[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  type LocalQuestionType = "객관식" | "복수선택" | "주관식";

  interface LocalQuestion {
    id: number;
    questionText: string;
    type: LocalQuestionType;
    options: QuestionOptionRequest[];
  }

  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [draggingOption, setDraggingOption] = useState<{ questionId: number; index: number } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PostFormData, string>>>({});
  const [steps, setSteps] = useState<StepResponse[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // 선택된 phase에 해당하는 step만 필터링
  const filteredSteps = steps.filter(step => {
    if (!formData.status) return true; // phase 미선택 시 전체 표시
    return step.phase === formData.status;
  });

  // 답글 작성 시 부모 게시글 정보 가져오기
  useEffect(() => {
    const fetchParentPost = async () => {
      if (!isReply || !id || !replyInfo?.parentPostId) return;

      try {
        const parentPost = await getPost(Number(id), replyInfo.parentPostId);
        const phaseValue = parentPost.projectPhase;
        const stepValue = parentPost.step.stepId.toString();

        setParentPostPhase(phaseValue);
        setParentPostStepId(stepValue);

        // 답글의 경우 부모 게시글의 phase와 step 자동 설정
        setFormData(prev => ({
          ...prev,
          status: phaseValue,
          step: stepValue,
        }));
      } catch (error) {
        console.error("부모 게시글 조회 실패:", error);
        toast({
          title: "부모 게시글 로딩 실패",
          description: "부모 게시글 정보를 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    };

    fetchParentPost();
  }, [isReply, id, replyInfo, toast]);

  // 프로젝트의 실제 step 목록 가져오기
  useEffect(() => {
    const fetchSteps = async () => {
      if (!id) return;

      setIsLoadingSteps(true);
      try {
        const response = await getStepsByProject(Number(id));
        setSteps(response.steps);
      } catch (error) {
        console.error("Step 목록 조회 실패:", error);
        toast({
          title: "단계 로딩 실패",
          description: "단계 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSteps(false);
      }
    };

    fetchSteps();
  }, [id, toast]);

  // 수정 모드일 때 기존 게시글 데이터 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      if (isEditMode && id && postId) {
        // steps가 로드될 때까지 대기
        if (isLoadingSteps) return;

        // 수정 모드: 기존 게시글 데이터 로드
        try {
          const post = await getPost(Number(id), Number(postId));

          // CLOSED 상태 게시글은 수정 불가
          if (post.openStatus === "CLOSED") {
            toast({
              title: "수정 불가",
              description: "종료된 게시글은 수정할 수 없습니다.",
              variant: "destructive",
            });
            navigate(`/project/${id}/board/${postId}`);
            return;
          }

          setFormData({
            title: post.title,
            content: post.content,
            status: post.projectPhase, // ProjectPhase enum 값 사용
            step: post.step.stepId.toString(),
          });

          // 링크 데이터 복원 (linkId 포함)
          setLinks(post.links.map(link => ({
            linkId: link.linkId,
            url: link.url,
          })));

          // 첨부파일 데이터 복원
          if (post.files && post.files.length > 0) {
            setExistingFiles(post.files.map(file => ({
              fileId: file.fileId,
              fileName: file.fileName,
              fileSize: file.fileSize,
              filePath: file.downloadUrl, // 실제 파일 경로는 다를 수 있음
            })));
          }

          // 질문 데이터 복원
          if (post.questions && post.questions.length > 0) {
            const convertedQuestions: LocalQuestion[] = post.questions.map((q, index) => {
              let localType: LocalQuestionType;
              switch (q.questionType) {
                case "SINGLE":
                  localType = "객관식";
                  break;
                case "MULTI":
                  localType = "복수선택";
                  break;
                case "TEXT":
                  localType = "주관식";
                  break;
                default:
                  localType = "주관식";
              }

              return {
                id: index + 1,
                questionText: q.content,
                type: localType,
                options: Array.isArray(q.options) ? q.options.map(opt => ({
                  optionText: opt.optionText,
                  hasInput: opt.hasInput,
                })) : [],
              };
            });
            setQuestions(convertedQuestions);
          }
        } catch (error) {
          console.error("게시글 조회 실패:", error);
          toast({
            title: "게시글 로딩 실패",
            description: "게시글을 불러올 수 없습니다.",
            variant: "destructive",
          });
          navigate(`/project/${id}/board`);
        }
      } else {
        // 작성 모드: 상태 초기화
        setFiles([]);
        setLinks([]);
        setQuestions([]);
      }
    };

    fetchPost();
  }, [isEditMode, id, postId, location.key, isLoadingSteps, toast, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId: number) => {
    setExistingFiles(prev => prev.filter(f => f.fileId !== fileId));
  };

  const handleAddLink = () => {
    let trimmedLink = linkInput.trim();
    if (!trimmedLink) {
      setLinkError("링크를 입력해주세요");
      return;
    }

    // http:// 또는 https://가 없으면 자동으로 https:// 추가
    if (!/^https?:\/\//i.test(trimmedLink)) {
      trimmedLink = `https://${trimmedLink}`;
    }

    try {
      new URL(trimmedLink);
    } catch {
      setLinkError("올바른 URL을 입력해주세요");
      return;
    }

    if (links.some(link => link.url === trimmedLink)) {
      setLinkError("이미 추가된 링크입니다");
      return;
    }

    setLinks(prev => [...prev, { url: trimmedLink }]);
    setLinkInput("");
    setLinkError(null);
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const questionTypeToApi = (type: LocalQuestionType): QuestionType => {
    switch (type) {
      case "복수선택":
        return QuestionType.MULTI;
      case "주관식":
        return QuestionType.TEXT;
      default:
        return QuestionType.SINGLE;
    }
  };

  const addQuestion = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    setQuestions(prev => [
      ...prev,
      { id: nextId, questionText: "", type: "객관식", options: [] }
    ]);
  };

  const handleQuestionTitleChange = (id: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === id ? { ...question, questionText: value } : question))
    );
  };

  const handleQuestionTypeChange = (id: number, nextType: LocalQuestionType) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== id) return question;
        if (nextType === "주관식") {
          return { ...question, type: nextType, options: [] };
        }
        if (nextType === "복수선택") {
          return {
            ...question,
            type: nextType,
            options: question.options.map((option) => ({ ...option, hasInput: false })),
          };
        }
        return { ...question, type: nextType };
      })
    );
  };

  const handleAddOption = (id: number) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id
          ? { ...question, options: [...question.options, { optionText: "", hasInput: false }] }
          : question
      )
    );
  };

  const handleOptionChange = (questionId: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, idx) => (idx === optionIndex ? { ...option, optionText: value } : option)),
            }
          : question
      )
    );
  };

  const handleOptionHasInputToggle = (questionId: number, optionIndex: number, checked: boolean) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, idx) =>
                idx === optionIndex ? { ...option, hasInput: checked } : option
              ),
            }
          : question
      )
    );
  };

  const handleDeleteOption = (questionId: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.filter((_, idx) => idx !== optionIndex),
            }
          : question
      )
    );
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleQuestionDragStart = (id: number) => setDraggingQuestionId(id);
  const handleQuestionDragEnd = () => setDraggingQuestionId(null);
  const handleQuestionDrop = (targetId: number) => {
    if (draggingQuestionId === null || draggingQuestionId === targetId) return;
    setQuestions((prev) => {
      const current = [...prev];
      const fromIndex = current.findIndex((question) => question.id === draggingQuestionId);
      const toIndex = current.findIndex((question) => question.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      return current;
    });
    setDraggingQuestionId(null);
  };

  const handleOptionDragStart = (questionId: number, index: number) => {
    setDraggingOption({ questionId, index });
  };

  const handleOptionDragEnd = () => setDraggingOption(null);

  const handleOptionDrop = (questionId: number, targetIndex: number) => {
    if (!draggingOption || draggingOption.questionId !== questionId || draggingOption.index === targetIndex) return;
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const currentOptions = [...question.options];
        const [moved] = currentOptions.splice(draggingOption.index, 1);
        currentOptions.splice(targetIndex, 0, moved);
        return { ...question, options: currentOptions };
      })
    );
    setDraggingOption(null);
  };

  const handleQuestionDropToEnd = () => {
    if (draggingQuestionId === null) return;
    setQuestions((prev) => {
      const current = [...prev];
      const fromIndex = current.findIndex((question) => question.id === draggingQuestionId);
      if (fromIndex === -1) return prev;
      const [moved] = current.splice(fromIndex, 1);
      current.push(moved);
      return current;
    });
    setDraggingQuestionId(null);
  };

  const handleOptionDropToEnd = (questionId: number) => {
    if (!draggingOption || draggingOption.questionId !== questionId) return;
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const currentOptions = [...question.options];
        const [moved] = currentOptions.splice(draggingOption.index, 1);
        currentOptions.push(moved);
        return { ...question, options: currentOptions };
      })
    );
    setDraggingOption(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 중복 제출 방지
    if (isSubmitting) return;

    const result = postSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PostFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof PostFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // 질문 유효성 검증
    if (questions.length > 0) {
      for (const question of questions) {
        // 질문 내용 검증
        if (!question.questionText.trim()) {
          toast({
            title: "질문 내용 누락",
            description: "모든 질문의 내용을 입력해주세요.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // 객관식/복수선택의 경우에만 옵션 검증 (주관식은 옵션 불필요)
        if (question.type === "객관식" || question.type === "복수선택") {
          if (question.options.length === 0) {
            toast({
              title: "답변 옵션 누락",
              description: `"${question.questionText}" 질문에 최소 1개 이상의 답변 옵션을 추가해주세요.`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }

          // 각 옵션이 비어있지 않은지 검증
          const hasEmptyOption = question.options.some(opt => !opt.optionText.trim());
          if (hasEmptyOption) {
            toast({
              title: "답변 옵션 내용 누락",
              description: `"${question.questionText}" 질문의 모든 답변 옵션 내용을 입력해주세요.`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }
    }

    // 백엔드 API 호출
    setIsSubmitting(true);
    try {
      // formData.status는 이제 ProjectPhase enum 값 (CONTRACT, IN_PROGRESS, DELIVERY, MAINTENANCE)
      const projectPhase = formData.status as ProjectPhase;

      // formData.step은 이제 실제 stepId(문자열)
      const stepId = Number(formData.step);

      if (!stepId) {
        toast({
          title: "유효하지 않은 단계",
          description: "단계를 다시 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 파일 업로드
      const uploadedFiles: FileRequest[] = [];
      if (files.length > 0) {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // 1. Presigned URL 요청
          const key = `post/${Date.now()}_${file.name}`;
          const presignedUrlResponse = await getPresignedUrl({
            key,
            contentType: file.type,
          });

          // 2. S3에 파일 업로드
          await uploadFileToS3(presignedUrlResponse.url, file);

          // 3. 파일 정보 저장
          uploadedFiles.push({
            fileName: file.name,
            fileSize: file.size,
            filePath: presignedUrlResponse.key,
            contentType: file.type,
          });

          // 진행률 업데이트
          setUploadProgress({ current: i + 1, total: files.length });
        } catch (error) {
          console.error(`파일 업로드 실패 (${file.name}):`, error);
          setIsUploading(false);
          setUploadProgress({ current: 0, total: 0 });
          throw error;
        }
      }

      if (files.length > 0) {
        setIsUploading(false);
        setUploadProgress({ current: 0, total: 0 });
      }

      if (isEditMode && postId) {
        // 수정 모드: 기존 파일 + 새 파일, 기존 링크 + 새 링크
        const allFiles: FileRequest[] = [
          // 기존 파일 유지 (fileId 포함)
          ...existingFiles.map(file => ({
            fileId: file.fileId,
            fileName: file.fileName,
            fileSize: file.fileSize,
            filePath: file.filePath,
            contentType: 'application/octet-stream', // 기존 파일의 contentType은 서버에 있음
          })),
          // 새로 업로드한 파일 (fileId 없음)
          ...uploadedFiles,
        ];

        const requestPayload = {
          title: formData.title,
          content: formData.content,
          stepId: stepId,
          projectPhase: projectPhase,
          links: links, // 이미 { linkId?, url } 형태
          files: allFiles,
          questions: questions.length > 0 ? questions.map(q => ({
            questionText: q.questionText,
            questionType: questionTypeToApi(q.type),
            options: q.type === "주관식" ? [] : q.options,
          })) : undefined,
        };

        await updatePost(Number(id), Number(postId), requestPayload);

        toast({
          title: "게시글 수정 완료",
          description: "게시글이 성공적으로 수정되었습니다.",
        });

        // 상태 초기화
        setFiles([]);
        setExistingFiles([]);
        setLinks([]);
        setQuestions([]);
        setFormData({
          title: "",
          content: "",
          status: "",
          step: "",
        });

        // 수정한 게시글 상세 페이지로 이동
        navigate(`/project/${id}/board/${postId}`);
      } else {
        // 작성 모드
        const response = await createPost(Number(id), {
          title: formData.title,
          content: formData.content,
          stepId: stepId,
          projectPhase: projectPhase,
          parentPostId: replyInfo?.parentPostId,
          links: links.map(link => ({ url: link.url })),
          files: uploadedFiles,
          questions: questions.map(q => ({
            questionText: q.questionText,
            questionType: questionTypeToApi(q.type),
            options: q.type === "주관식" ? [] : q.options,
          })),
        });

        toast({
          title: "게시글 작성 완료",
          description: "게시글이 성공적으로 작성되었습니다.",
        });

        // 상태 초기화
        setFiles([]);
        setExistingFiles([]);
        setLinks([]);
        setQuestions([]);
        setFormData({
          title: "",
          content: "",
          status: "",
          step: "",
        });

        // 방금 작성한 게시글 상세 페이지로 이동
        navigate(`/project/${id}/board/${response.postId}`);
      }
    } catch (error: any) {
      const errorCode = error.response?.data?.errorCode;
      const errorMessage = errorCode === "POST_ALREADY_CLOSED"
        ? "종료된 게시글은 수정할 수 없습니다."
        : error.response?.data?.message || error.message || `게시글 ${isEditMode ? '수정' : '작성'} 중 오류가 발생했습니다.`;

      toast({
        title: `게시글 ${isEditMode ? '수정' : '작성'} 실패`,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const navigateWithState = () => {
      navigate(`/project/${id}/board`, {
        state: {
          restorePhase: locationState?.preSelectedPhase,
          restoreStepId: locationState?.preSelectedStepId,
        }
      });
    };

    if (formData.title || formData.content) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        navigateWithState();
      }
    } else {
      navigateWithState();
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        {/* 파일 업로드 진행 상황 모달 */}
        {isUploading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-foreground">첨부파일 업로드 중입니다...</p>
            <p className="text-sm text-muted-foreground mt-2">
              {uploadProgress.current} / {uploadProgress.total} 개 업로드 중
            </p>
            <div className="w-64 h-2 bg-muted rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? "게시글 수정" : isReply ? "답글 작성" : "게시글 작성"}
            </h1>
            {isReply && (
              <p className="text-sm text-muted-foreground">원본 글: {replyInfo?.parentTitle}</p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditMode ? "게시글 수정" : isReply ? "답글 입력" : "새 게시글"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phase */}
              <div className="space-y-2">
                <Label htmlFor="status">프로젝트 단계 (Phase) *</Label>
                {isReply && formData.status ? (
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {phaseOptions.find(p => p.value === formData.status)?.label || "로딩 중..."}
                  </div>
                ) : (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      setFormData(prev => {
                        // phase 변경 시, 현재 선택된 step이 새 phase에 속하지 않으면 초기화
                        const currentStepBelongsToNewPhase = steps.some(
                          step => step.id.toString() === prev.step && step.phase === value
                        );
                        return {
                          ...prev,
                          status: value,
                          step: currentStepBelongsToNewPhase ? prev.step : ""
                        };
                      });
                      setErrors(prev => ({ ...prev, status: undefined })); // 에러 제거
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="프로젝트 단계를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {phaseOptions.map((phase) => (
                        <SelectItem key={phase.value} value={phase.value}>
                          {phase.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {isReply && (
                  <p className="text-xs text-muted-foreground">답글은 부모 게시글의 단계를 따릅니다</p>
                )}
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status}</p>
                )}
              </div>

              {/* Step */}
              <div className="space-y-2">
                <Label htmlFor="step">세부 단계 (Step) *</Label>
                {isReply && formData.step ? (
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {steps.find(s => s.id.toString() === formData.step)?.title || "로딩 중..."}
                  </div>
                ) : (
                  <Select
                    value={formData.step}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, step: value }));
                      setErrors(prev => ({ ...prev, step: undefined })); // 에러 제거
                    }}
                    disabled={isLoadingSteps || !formData.status}
                  >
                    <SelectTrigger id="step">
                      <SelectValue placeholder={
                        isLoadingSteps
                          ? "단계 로딩 중..."
                          : !formData.status
                            ? "먼저 프로젝트 단계를 선택하세요"
                            : filteredSteps.length === 0
                              ? "해당 단계에 등록된 세부 단계가 없습니다"
                              : "세부 단계를 선택하세요"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSteps.map((step) => (
                        <SelectItem key={step.id} value={step.id.toString()}>
                          {step.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {isReply && (
                  <p className="text-xs text-muted-foreground">답글은 부모 게시글의 단계를 따릅니다</p>
                )}
                {errors.step && (
                  <p className="text-sm text-destructive">{errors.step}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  placeholder="제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (errors.title) setErrors(prev => ({ ...prev, title: undefined })); // 에러 제거
                  }}
                  maxLength={100}
                />
                <div className="flex justify-between items-center">
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.title.length} / 100
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  placeholder="내용을 입력하세요"
                  value={formData.content}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, content: e.target.value }));
                    if (errors.content) setErrors(prev => ({ ...prev, content: undefined })); // 에러 제거
                  }}
                  className="min-h-[300px] resize-none"
                  maxLength={5000}
                />
                <div className="flex justify-between items-center">
                  {errors.content && (
                    <p className="text-sm text-destructive">{errors.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.content.length} / 5000
                  </p>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="files">파일 첨부</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("files")?.click()}
                    className="gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    파일 선택
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {existingFiles.length + files.length}개 파일 (기존 {existingFiles.length}개 + 새로 추가 {files.length}개)
                  </span>
                </div>

                {/* Existing Files (from server) */}
                {existingFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-muted-foreground font-medium">기존 첨부파일</p>
                    {existingFiles.map((file) => (
                      <div
                        key={file.fileId}
                        className="flex items-center justify-between p-2 border rounded-md bg-blue-50/50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 flex-shrink-0 text-blue-600" />
                          <span className="text-sm truncate">{file.fileName}</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {(file.fileSize / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => removeExistingFile(file.fileId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New File List */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-muted-foreground font-medium">새로 추가할 파일</p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="space-y-2">
                <Label htmlFor="link">관련 링크</Label>
                <div className="flex gap-2">
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://example.com"
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value);
                      setLinkError(null);
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddLink}>
                    추가
                  </Button>
                </div>
                {linkError && (
                  <p className="text-sm text-destructive">{linkError}</p>
                )}

                {links.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {links.map((link, index) => (
                      <div
                        key={link.linkId || `new-${index}`}
                        className={`flex items-center gap-2 p-2 border rounded-md ${link.linkId ? 'bg-blue-50/50' : 'bg-muted/30'}`}
                      >
                        <Link2 className={`h-4 w-4 flex-shrink-0 ${link.linkId ? 'text-blue-600' : ''}`} />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline-offset-2 hover:underline flex-1 min-w-0 truncate"
                        >
                          {link.url}
                        </a>
                        {link.linkId && (
                          <span className="text-xs text-muted-foreground">기존</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => removeLink(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    질문 생성
                  </Label>
                  {questions.length === 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={addQuestion}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" /> 질문 추가
                    </Button>
                  )}
                </div>

                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded bg-background p-4 pl-12 space-y-4 border relative"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleQuestionDrop(question.id)}
                    >
                      <button
                        type="button"
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="absolute top-4 left-4 text-muted-foreground cursor-grab"
                        draggable
                        onDragStart={() => handleQuestionDragStart(question.id)}
                        onDragEnd={handleQuestionDragEnd}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      <p className="font-semibold text-gray-700">질문 #{index + 1}</p>

                      <Input
                        placeholder="질문을 입력하세요"
                        value={question.questionText}
                        onChange={(event) => handleQuestionTitleChange(question.id, event.target.value)}
                      />

                      <Select
                        value={question.type}
                        onValueChange={(value) => handleQuestionTypeChange(question.id, value as LocalQuestionType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="질문 타입 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="객관식">객관식 (1개 선택)</SelectItem>
                          <SelectItem value="복수선택">복수선택</SelectItem>
                          <SelectItem value="주관식">주관식</SelectItem>
                        </SelectContent>
                      </Select>

                      {(question.type === "객관식" || question.type === "복수선택") && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            {question.type === "복수선택" ? "옵션 목록 (복수 선택 가능)" : "옵션 목록"}
                          </p>
                          {question.options.map((option, idx) => (
                            <div
                              key={`${question.id}-${idx}`}
                              className="flex flex-col gap-2"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={() => handleOptionDrop(question.id, idx)}
                            >
                              <div className="flex gap-2 items-center">
                                <button
                                  type="button"
                                  className="text-muted-foreground cursor-grab"
                                  draggable
                                  onDragStart={() => handleOptionDragStart(question.id, idx)}
                                  onDragEnd={handleOptionDragEnd}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                                <Input
                                  placeholder="옵션 입력"
                                  value={option.optionText}
                                  onChange={(event) =>
                                    handleOptionChange(question.id, idx, event.target.value)
                                  }
                                />
                                {question.type === "객관식" && (
                                  <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={option.hasInput}
                                      onChange={(event) =>
                                        handleOptionHasInputToggle(question.id, idx, event.target.checked)
                                      }
                                    />
                                    기타 입력 허용
                                  </label>
                                )}
                                <Trash2
                                  className="w-4 h-4 text-red-500 cursor-pointer"
                                  onClick={() => handleDeleteOption(question.id, idx)}
                                />
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => handleAddOption(question.id)}>
                            + 옵션 추가
                          </Button>
                        </div>
                      )}

                      {question.type === "주관식" && (
                        <p className="text-xs text-muted-foreground">
                          주관식 질문 · 별도의 선택지가 없습니다.
                        </p>
                      )}
                    </div>
                  ))}
                  {questions.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={addQuestion}
                      className="gap-2 w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" /> 질문 추가
                    </Button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting
                    ? `${isEditMode ? '수정' : '작성'} 중...`
                    : isEditMode ? "게시글 수정" : "게시글 작성"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ProjectLayout>
  );
}
