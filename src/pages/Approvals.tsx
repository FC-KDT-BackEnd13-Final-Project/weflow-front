import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ApprovalRequest {
  id: string;
  title: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
  requester: string;
  description: string;
  attachments: string[];
  links: string[];
}

const mockApprovals: ApprovalRequest[] = [
  {
    id: "1",
    title: "승인 요청 v1",
    category: "요구사항 정의",
    status: "approved",
    requestDate: "2025-11-20",
    requester: "홍길동(개발사)",
    description: "베인 페이지 및 시안 수정 요청 중. 구 반영\n- 단락 1/2: 텍스트 수정 3줄 개발팀",
    attachments: ["기능명세서_v1.xlsx"],
    links: ["Google Drive - 회의록 링크"]
  },
  {
    id: "2",
    title: "승인 요청 v2",
    category: "요구사항 정의",
    status: "rejected",
    requestDate: "2025-11-18",
    requester: "홍길동(개발사)",
    description: "베인 페이지 및 시안 수정 요청 중. 구 반영\n- 단락 1/2: 텍스트 수정 3줄 개발팀",
    attachments: ["기능명세서_v2.xlsx"],
    links: ["Google Drive - 회의록 링크"]
  },
  {
    id: "3",
    title: "승인 요청 v1",
    category: "화면 설계",
    status: "pending",
    requestDate: "2025-11-20",
    requester: "홍길동(개발사)",
    description: "베인 페이지 및 시안 수정 요청 중. 구 반영\n- 단락 1/2: 텍스트 수정 3줄 개발팀",
    attachments: ["화면명세서_v1.xlsx"],
    links: ["Google Drive - 화면설계 링크"]
  }
];

const categories = ["요구사항 정의", "화면 설계", "디자인", "퍼블리싱", "개발", "검수"];

export default function Approvals() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestAttachments, setRequestAttachments] = useState<string[]>([]);
  const [requestLinks, setRequestLinks] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState("");
  const [linkInput, setLinkInput] = useState("");

  const getCategoryStatus = (category: string) => {
    const categoryApprovals = mockApprovals.filter(a => a.category === category);
    const hasApproved = categoryApprovals.some(a => a.status === "approved");
    const hasPending = categoryApprovals.some(a => a.status === "pending");
    
    if (hasPending) {
      return { label: "진행중", className: "bg-blue-500 text-white", isCompleted: false };
    }

    if (hasApproved) {
      return { label: "완료", className: "bg-green-500 text-white", isCompleted: true };
    }

    return { label: "진행전", className: "bg-gray-400 text-white", isCompleted: false };
  };

  const getStatusColor = (status: ApprovalRequest["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
    }
  };

  const openRequestDialog = (category: string) => {
    setSelectedCategory(category);
    setRequestTitle("");
    setRequestDescription("");
    setRequestAttachments([]);
    setRequestLinks([]);
    setAttachmentInput("");
    setLinkInput("");
    setIsRequestDialogOpen(true);
  };

  const handleRequestDialogChange = (open: boolean) => {
    setIsRequestDialogOpen(open);
    if (!open) {
      setSelectedCategory(null);
      setRequestTitle("");
      setRequestDescription("");
      setRequestAttachments([]);
      setRequestLinks([]);
      setAttachmentInput("");
      setLinkInput("");
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) return;
    setRequestAttachments(prev => [...prev, attachmentInput.trim()]);
    setAttachmentInput("");
  };

  const handleRemoveAttachment = (index: number) => {
    setRequestAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    setRequestLinks(prev => [...prev, linkInput.trim()]);
    setLinkInput("");
  };

  const handleRemoveLink = (index: number) => {
    setRequestLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = () => {
    console.log("승인 요청 생성", {
      category: selectedCategory,
      title: requestTitle,
      description: requestDescription,
      attachments: requestAttachments,
      links: requestLinks
    });
    handleRequestDialogChange(false);
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">단계별 승인 요청</h1>
            <p className="text-sm text-muted-foreground mt-1">프로젝트 단계별 승인을 관리합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryApprovals = mockApprovals.filter(a => a.category === category);
            const status = getCategoryStatus(category);
            
            return (
              <Card key={category} className="flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4 space-y-4 flex flex-col">
                  <div className="space-y-2 flex-1">
                    {categoryApprovals.length > 0 ? (
                      categoryApprovals.map((approval) => (
                        <button
                          key={approval.id}
                          onClick={() => navigate(`/project/${id}/approvals/${approval.id}`)}
                          className="w-full p-3 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/50 text-left transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", getStatusColor(approval.status))} />
                            <span className="font-medium text-sm">{approval.title}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground text-center">
                        승인 요청이 없습니다.
                      </div>
                    )}
                  </div>
                  {!status.isCompleted && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => openRequestDialog(category)}
                    >
                      승인 요청
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isRequestDialogOpen} onOpenChange={handleRequestDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>승인 요청</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">단계</Label>
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3">
                <p className="text-lg font-semibold text-foreground">
                  {selectedCategory ?? "단계를 선택해주세요"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>요청 제목</Label>
              <Input
                value={requestTitle}
                onChange={(event) => setRequestTitle(event.target.value)}
                placeholder="승인 요청 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>요청 내용</Label>
              <Textarea
                value={requestDescription}
                onChange={(event) => setRequestDescription(event.target.value)}
                placeholder="승인 요청 내용을 입력하세요"
                className="min-h-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label>첨부파일</Label>
              <div className="flex gap-2">
                <Input
                  value={attachmentInput}
                  onChange={(event) => setAttachmentInput(event.target.value)}
                  placeholder="파일명을 입력하세요"
                />
                <Button type="button" variant="secondary" onClick={handleAddAttachment}>
                  추가
                </Button>
              </div>
              {requestAttachments.length > 0 && (
                <div className="space-y-2">
                  {requestAttachments.map((file, index) => (
                    <div
                      key={`${file}-${index}`}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>{file}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAttachment(index)}>
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>링크</Label>
              <div className="flex gap-2">
                <Input
                  value={linkInput}
                  onChange={(event) => setLinkInput(event.target.value)}
                  placeholder="링크를 입력하세요"
                />
                <Button type="button" variant="secondary" onClick={handleAddLink}>
                  추가
                </Button>
              </div>
              {requestLinks.length > 0 && (
                <div className="space-y-2">
                  {requestLinks.map((link, index) => (
                    <div
                      key={`${link}-${index}`}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span className="truncate">{link}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveLink(index)}>
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleRequestDialogChange(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitRequest} disabled={!requestTitle || !requestDescription}>
              작성 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
