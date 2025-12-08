import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectDetail = () => {
  const navigate = useNavigate();

  const project = {
    name: "ClientA Web Renewal",
    description: "고객사 웹 리뉴얼 프로젝트",
    company: "ClientA Corporation",
    stage: "디자인",
    startDate: "2025-11-12",
    endDate: "2025-12-12",
    contract: "contract_v1.pdf",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-1">
            프로젝트 관리 {'>'} 프로젝트 목록 {'>'} 프로젝트 상세
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>프로젝트 정보</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/projects")}>
              목록
            </Button>
            <Button className="gap-2" onClick={() => navigate("/admin/projects/1/edit")}>수정</Button>
            <Button variant="destructive" className="gap-2">
              삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-sm font-medium">
                  프로젝트명
                </Badge>
                <span className="font-medium">{project.name}</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-sm font-medium">
                  프로젝트 설명
                </Badge>
                <span className="text-muted-foreground">{project.description}</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-sm font-medium">
                  고객사
                </Badge>
                <span className="font-medium">{project.company}</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-sm font-medium">
                  현재 단계
                </Badge>
                <span className="text-muted-foreground">{project.stage}</span>
              </div>

            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-sm font-medium">
                  시작일
                </Badge>
                <span className="font-mono">{project.startDate}</span>
                <Badge variant="outline" className="text-sm font-medium ml-4">
                  종료일
                </Badge>
                <span className="font-mono">{project.endDate}</span>
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium mb-2">계약서</div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <a href="#" className="text-primary hover:underline">
                    {project.contract}
                  </a>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetail;
