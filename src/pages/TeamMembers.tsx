import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

interface ProjectMember {
  projectMemberId: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  projectRole: "ADMIN" | "MEMBER";
  createdAt: string;
  removedAt: string | null;
}

const mockMembers: ProjectMember[] = [
  {
    projectMemberId: 12,
    userId: 7,
    name: "김고객",
    email: "customer@abc.com",
    phone: "010-1234-5678",
    companyName: "ABC전자",
    projectRole: "ADMIN",
    createdAt: "2025-01-05T10:00:00",
    removedAt: null,
  },
  {
    projectMemberId: 13,
    userId: 3,
    name: "이개발",
    email: "dev@bnsys.com",
    phone: "010-8888-5555",
    companyName: "비엔시스템",
    projectRole: "MEMBER",
    createdAt: "2025-01-05T10:20:00",
    removedAt: null,
  },
];

const roleLabels: Record<ProjectMember["projectRole"], { label: string; badgeVariant: "default" | "secondary" }> = {
  ADMIN: { label: "관리자", badgeVariant: "default" },
  MEMBER: { label: "멤버", badgeVariant: "secondary" },
};

export default function TeamMembers() {
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [roleSelection, setRoleSelection] = useState<ProjectMember["projectRole"]>("MEMBER");

  const openRoleDialog = (member: ProjectMember) => {
    setSelectedMember(member);
    setRoleSelection(member.projectRole);
  };

  const closeRoleDialog = () => {
    setSelectedMember(null);
  };

  const handleRoleChange = (value: ProjectMember["projectRole"]) => {
    setRoleSelection(value);
  };

  const handleSaveRole = () => {
    if (!selectedMember) return;
    console.log("권한 변경 요청:", { projectMemberId: selectedMember.projectMemberId, role: roleSelection });
    closeRoleDialog();
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">멤버 관리</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockMembers.map((member) => (
            <Card
              key={member.projectMemberId}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => openRoleDialog(member)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.companyName}</p>
                  </div>
                  <Badge variant={roleLabels[member.projectRole].badgeVariant}>
                    {roleLabels[member.projectRole].label}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">{member.email}</p>
                  <p>{member.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    가입일: {new Date(member.createdAt).toLocaleString("ko-KR", { hour12: false })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(selectedMember)} onOpenChange={closeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>권한 변경</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedMember.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
              </div>
              <div className="space-y-2">
                <Label>권한</Label>
                <RadioGroup value={roleSelection} onValueChange={handleRoleChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ADMIN" id="role-admin" />
                    <Label htmlFor="role-admin">관리자</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MEMBER" id="role-member" />
                    <Label htmlFor="role-member">멤버</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeRoleDialog}>
              취소
            </Button>
            <Button onClick={handleSaveRole} disabled={!selectedMember || roleSelection === selectedMember.projectRole}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
