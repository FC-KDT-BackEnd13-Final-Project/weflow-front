import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState([
    { name: "요구사항 정의", order: 1 },
    { name: "화면 설계", order: 2 },
    { name: "디자인", order: 3 },
    { name: "개발", order: 4 },
    { name: "테스트", order: 5 },
    { name: "납품", order: 6 },
  ]);
  const [members, setMembers] = useState([
    { name: "홍길동", company: "개발사", role: "최고관한", canDelete: false },
    { name: "주덕밥", company: "개발사", role: "일반권한", canDelete: true },
    { name: "주덕밥", company: "개발사", role: "일반권한", canDelete: true },
    { name: "주덕밥", company: "개발사", role: "일반권한", canDelete: true },
    { name: "김철수", company: "고객사", role: "일반권한", canDelete: true },
    { name: "이영희", company: "고객사", role: "일반권한", canDelete: true },
  ]);
  const [editingStageName, setEditingStageName] = useState("");
  const [editingStageOrder, setEditingStageOrder] = useState("1");
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditStage = () => {
    if (editingStageName) {
      // 실제로는 특정 단계를 수정해야 하지만 예시로 첫 번째 단계 수정
      const updatedStages = [...stages];
      updatedStages[0] = { name: editingStageName, order: parseInt(editingStageOrder) };
      setStages(updatedStages);
      setEditingStageName("");
      setEditingStageOrder("1");
      setIsStageDialogOpen(false);
    }
  };

  const handleAddMember = () => {
    // TODO: 멤버 추가 로직
  };

  const handleDeleteMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    navigate("/admin/projects");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/admin/projects");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-1">
            프로젝트 관리 {'>'} 프로젝트 생성
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트명</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트명</Label>
              <Input
                id="name"
                defaultValue="ClientA Web Renewal"
                placeholder="프로젝트명 입력"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">프로젝트 설명</Label>
              <Textarea
                id="description"
                defaultValue="고객사 웹 리뉴얼 프로젝트"
                placeholder="프로젝트 설명 입력"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">고객사</Label>
              <Select defaultValue="clienta">
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clienta">ClientA</SelectItem>
                  <SelectItem value="clientb">ClientB</SelectItem>
                  <SelectItem value="devcorp">DevCorp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일</Label>
                <Select defaultValue="2025-11-12">
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-11-12">2025-11-12</SelectItem>
                    <SelectItem value="2025-12-01">2025-12-01</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">종료일</Label>
                <Select defaultValue="2025-12-12">
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-12-12">2025-12-12</SelectItem>
                    <SelectItem value="2025-12-31">2025-12-31</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm">개발사 PM</Label>
              <Select defaultValue="hong">
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hong">홍길동</SelectItem>
                  <SelectItem value="kim">김철수</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>계약서 파일 업로드</Label>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                계약서 csv 파일을 드래그하거나 클릭하여 업로드 해주세요.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>프로젝트 단계 설정</Label>
                <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      단계 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>요구사항 정의</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="stageName">단계명</Label>
                        <Input
                          id="stageName"
                          value={editingStageName}
                          onChange={(e) => setEditingStageName(e.target.value)}
                          placeholder="요구사항 정의"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stageOrder">순서</Label>
                        <Input
                          id="stageOrder"
                          type="number"
                          value={editingStageOrder}
                          onChange={(e) => setEditingStageOrder(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setIsStageDialogOpen(false)}
                        >
                          삭제
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsStageDialogOpen(false)}
                        >
                          취소
                        </Button>
                        <Button type="button" onClick={handleEditStage}>
                          수정
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm px-3 py-1 cursor-pointer"
                    onClick={() => {
                      setEditingStageName(stage.name);
                      setEditingStageOrder(stage.order.toString());
                      setIsStageDialogOpen(true);
                    }}
                  >
                    {stage.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>프로젝트 멤버 설정</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMember}>
                  <Plus className="h-4 w-4 mr-1" />
                  멤버 추가
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted">
                  <div className="grid grid-cols-4 gap-4 p-3 text-sm font-medium">
                    <div>이름</div>
                    <div>소속</div>
                    <div>권한</div>
                    <div>삭제</div>
                  </div>
                </div>
                <div className="divide-y">
                  {members.map((member, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 text-sm items-center">
                      <div>{member.name}</div>
                      <div className="text-muted-foreground">{member.company}</div>
                      <div>{member.role}</div>
                      <div>
                        {member.canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDeleteMember(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/projects")}
              >
                목록
              </Button>
              <Button type="submit">수정</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProjectEdit;
