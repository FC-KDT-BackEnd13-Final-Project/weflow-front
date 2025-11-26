import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function TeamMembers() {
  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">멤버 관리</h1>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            팀원 초대
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {["김개발", "이디자인", "박퍼블", "최기획", "정관리"].map((name) => (
            <Card key={name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">개발팀</p>
                  </div>
                  <Badge variant="secondary">활성</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProjectLayout>
  );
}
