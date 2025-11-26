import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Link as LinkIcon, ChevronDown, ArrowLeft } from "lucide-react";
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
  rejectedBy?: string;
  rejectedDate?: string;
  rejectReason?: string;
  approvedBy?: string;
  approvedDate?: string;
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
    links: ["Google Drive - 회의록 링크"],
    approvedBy: "김영희(고객사)",
    approvedDate: "2025-11-20"
  },
  {
    id: "2",
    title: "승인 요청 v2",
    category: "요구사항 정의",
    status: "rejected",
    requestDate: "2025-11-18",
    requester: "홍길동(개발사)",
    description: "베인 페이지 및 시안 수정 요청 중. 구 반영\n- 단락 1/2: 텍스트 수정 3줄 개발팀",
    attachments: ["화면명세서_v1.docx"],
    links: ["Google Drive - 화면설계 회의록"],
    rejectedBy: "김철수(고객사)",
    rejectedDate: "2025-11-20",
    rejectReason: "기능 누락으로 수정 필요합니다."
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

export default function ApprovalDetail() {
  const { id, approvalId } = useParams();
  const navigate = useNavigate();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approval = mockApprovals.find(a => a.id === approvalId);

  if (!approval) {
    return (
      <ProjectLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">승인 요청을 찾을 수 없습니다.</p>
          <Button onClick={() => navigate(`/project/${id}/approvals`)} className="mt-4">
            목록으로 돌아가기
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  const getStatusBadge = (status: ApprovalRequest["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">승인 완료</Badge>;
      case "rejected":
        return <Badge variant="destructive">반려됨</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white hover:bg-blue-600">승인 요청 중</Badge>;
    }
  };

  const getStatusColor = (status: ApprovalRequest["status"]) => {
    switch (status) {
      case "approved":
        return "text-green-600 border-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 border-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
    }
  };

  const getStatusDotColor = (status: ApprovalRequest["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
    }
  };

  const handleApprove = () => {
    console.log("승인:", approval.id);
    // TODO: 승인 처리 로직
    navigate(`/project/${id}/approvals`);
  };

  const handleReject = () => {
    console.log("반려:", approval.id, "사유:", rejectReason);
    setShowRejectDialog(false);
    setRejectReason("");
    // TODO: 반려 처리 로직
    navigate(`/project/${id}/approvals`);
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/project/${id}/approvals`)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{approval.category}</h1>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{approval.category}</CardTitle>
              {getStatusBadge(approval.status)}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* 제목 선택 */}
            <div className="space-y-2">
              <Select defaultValue={approval.id}>
                <SelectTrigger className={cn("w-full h-12", getStatusColor(approval.status))}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", getStatusDotColor(approval.status))} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={approval.id}>{approval.title}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label>설명</Label>
              <div className="text-sm text-muted-foreground whitespace-pre-line p-3 bg-muted/30 rounded-md">
                {approval.description}
              </div>
            </div>

            {/* 첨부파일 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                첨부파일
              </Label>
              <div className="space-y-2">
                {approval.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm flex-1">{file}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 링크 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                링크
              </Label>
              <div className="space-y-2">
                {approval.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                    <LinkIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm flex-1">{link}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 요청자 */}
            <div className="space-y-2">
              <Label>요청자</Label>
              <Input value={approval.requester} readOnly />
            </div>

            {/* 요청일 */}
            <div className="space-y-2">
              <Label>요청일</Label>
              <Input value={approval.requestDate} readOnly />
            </div>

            {/* 상태 */}
            <div className="space-y-2">
              <Label>상태</Label>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  approval.status === "approved" && "bg-green-500",
                  approval.status === "rejected" && "bg-red-500",
                  approval.status === "pending" && "bg-yellow-500"
                )}>
                  {approval.status === "approved" && "승인 완료"}
                  {approval.status === "rejected" && "반려됨"}
                  {approval.status === "pending" && "승인 요청 중"}
                </Badge>
              </div>
            </div>

            {/* 반려 정보 (반려된 경우에만 표시) */}
            {approval.status === "rejected" && (
              <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
                <div className="flex items-center gap-2 pb-2 border-b border-red-200">
                  <div className="font-semibold text-red-700">반려 정보</div>
                </div>
                
                <div className="space-y-2">
                  <Label>반려자</Label>
                  <Input value={approval.rejectedBy || ""} readOnly className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>반려일</Label>
                  <Input value={approval.rejectedDate || ""} readOnly className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>반려사유</Label>
                  <Textarea 
                    value={approval.rejectReason || ""} 
                    readOnly 
                    className="min-h-[80px] bg-white"
                  />
                </div>

                {/* 첨부파일 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    첨부파일
                  </Label>
                  <div className="space-y-2">
                    {approval.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm flex-1">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 링크 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    링크
                  </Label>
                  <div className="space-y-2">
                    {approval.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                        <LinkIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm flex-1">{link}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 승인자/승인일 (승인된 경우에만 표시) */}
            {approval.status === "approved" && (
              <>
                <div className="space-y-2">
                  <Label>승인자</Label>
                  <Input value={approval.approvedBy || ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>승인일</Label>
                  <Input value={approval.approvedDate || ""} readOnly />
                </div>
              </>
            )}

            {/* 액션 버튼 (pending 상태일 때만 표시) */}
            {approval.status === "pending" && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleApprove} className="flex-1 bg-blue-500 hover:bg-blue-600">
                  승인
                </Button>
                <Button 
                  onClick={() => setShowRejectDialog(true)} 
                  variant="destructive"
                  className="flex-1"
                >
                  반려
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 반려 사유 입력 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>승인 반려</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>반려 사유</Label>
              <Textarea
                placeholder="반려 사유를 입력해주세요."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
