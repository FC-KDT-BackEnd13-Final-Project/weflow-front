import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockHistory = [
  {
    id: 1,
    user: "김개발",
    action: "단계 완료",
    target: "요구사항 분석",
    date: "2024.11.15 14:30",
    type: "complete" as const,
  },
  {
    id: 2,
    user: "이디자인",
    action: "파일 업로드",
    target: "디자인 시안.fig",
    date: "2024.11.14 11:20",
    type: "upload" as const,
  },
  {
    id: 3,
    user: "박민수",
    action: "게시글 작성",
    target: "요구사항 문서",
    date: "2024.11.11 09:15",
    type: "post" as const,
  },
];

export default function History() {
  return (
    <ProjectLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">히스토리</h1>
        
        <div className="space-y-3">
          {mockHistory.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{item.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.user}</span>
                      <span className="text-sm text-muted-foreground">{item.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.target}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProjectLayout>
  );
}
