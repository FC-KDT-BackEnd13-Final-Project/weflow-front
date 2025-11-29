import { useState } from "react";
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
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, X, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const status = ["계약", "진행", "납품", "유지보수"];
const step = ["요구사항 정의", "화면설계", "디자인", "퍼블리싱", "개발", "검수"];

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
  const { id } = useParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    content: "",
    status: "",
    step: "",
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PostFormData, string>>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    const trimmedLink = linkInput.trim();
    if (!trimmedLink) {
      setLinkError("링크를 입력해주세요");
      return;
    }

    try {
      new URL(trimmedLink);
    } catch {
      setLinkError("올바른 URL을 입력해주세요");
      return;
    }

    if (links.includes(trimmedLink)) {
      setLinkError("이미 추가된 링크입니다");
      return;
    }

    setLinks(prev => [...prev, trimmedLink]);
    setLinkInput("");
    setLinkError(null);
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    // TODO: API 호출로 데이터 저장
    // console.log({ ...formData, files, links });
    toast({
      title: "게시글 작성 완료",
      description: "게시글이 성공적으로 작성되었습니다.",
    });
    
    navigate(`/project/${id}/board`);
  };

  const handleCancel = () => {
    if (formData.title || formData.content) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        navigate(`/project/${id}/board`);
      }
    } else {
      navigate(`/project/${id}/board`);
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">게시글 작성</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>새 게시글</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">상태 *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="프로젝트 상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {status.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status}</p>
                )}
              </div>

              {/* Step */}
              <div className="space-y-2">
                <Label htmlFor="step">단계 *</Label>
                <Select
                  value={formData.step}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, step: value }))}
                >
                  <SelectTrigger id="step">
                    <SelectValue placeholder="단계를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {step.map((step) => (
                      <SelectItem key={step} value={step}>
                        {step}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
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
                    {files.length}개 파일 선택됨
                  </span>
                </div>
                
                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
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
                        key={`${link}-${index}`}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Link2 className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm truncate underline-offset-2 hover:underline"
                          >
                            {link}
                          </a>
                        </div>
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

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  게시글 작성
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
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
