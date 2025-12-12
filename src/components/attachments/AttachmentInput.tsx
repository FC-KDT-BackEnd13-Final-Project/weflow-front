import { useRef, useState, useMemo, useCallback, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Link as LinkIcon, X, Paperclip } from "lucide-react";
import { getPresignedUrl, uploadFileToS3 } from "@/apis/attachmentApi";
import { useToast } from "@/hooks/use-toast";

export type UploadedAttachment = {
  id: number | string;
  name: string;
  url?: string;
  isLink?: boolean;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  contentType?: string;
};

type TargetType = "STEP_REQUEST" | "STEP_REQUEST_ANSWER";

interface AttachmentInputProps {
  targetType: TargetType;
  attachments: UploadedAttachment[];
  onChange: (items: UploadedAttachment[]) => void;
  label?: string;
  linkLabel?: string;
  linkButtonText?: string;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSizeMB?: number;
  maxTotalMB?: number;
  controlsVisible?: boolean;
}

const DEFAULT_ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "docx", "zip"];

export function AttachmentInput({
  targetType,
  attachments,
  onChange,
  label = "파일 첨부",
  linkLabel = "관련 링크",
  linkButtonText = "추가",
  disabled = false,
  maxFiles = 10,
  maxFileSizeMB = 10,
  maxTotalMB = 50,
  controlsVisible = true,
}: AttachmentInputProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

  const fileCountText = useMemo(() => `${attachments.filter((a) => !a.isLink).length}개 파일 선택됨`, [attachments]);

  const validateFiles = useCallback((files: File[]) => {
    if (attachments.length + files.length > maxFiles) {
      toast({ title: `최대 ${maxFiles}개까지 업로드할 수 있습니다.`, variant: "destructive" });
      return false;
    }
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize / (1024 * 1024) > maxTotalMB) {
      toast({ title: `총 ${maxTotalMB}MB 이하로 업로드해주세요.`, variant: "destructive" });
      return false;
    }
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!DEFAULT_ALLOWED_EXT.includes(ext)) {
        toast({ title: "허용되지 않는 파일 형식입니다.", description: DEFAULT_ALLOWED_EXT.join(", "), variant: "destructive" });
        return false;
      }
      if (file.size / (1024 * 1024) > maxFileSizeMB) {
        toast({ title: `개별 파일은 ${maxFileSizeMB}MB 이하만 가능합니다.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  }, [attachments.length, maxFiles, maxFileSizeMB, maxTotalMB, toast]);

  const handleFilesSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || disabled || !controlsVisible) return;
    if (!validateFiles(files)) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const key = `step/${targetType.toLowerCase()}/${Date.now()}_${file.name}`;
          const presigned = await getPresignedUrl({ key, contentType: file.type || "application/octet-stream" });
          await uploadFileToS3(presigned.url, file);
          return {
            id: presigned.key,
            name: file.name,
            url: presigned.url?.split("?")[0],
            isLink: false,
            fileName: file.name,
            fileSize: file.size,
            filePath: presigned.key,
            contentType: file.type || "application/octet-stream",
          };
        })
      );
      onChange([...attachments, ...uploaded]);
    } catch (error: unknown) {
      toast({ title: "파일 업로드 실패", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!controlsVisible || !linkInputRef.current || !linkInputRef.current.value.trim() || disabled) return;
    const urlValue = linkInputRef.current.value.trim();
    onChange([
      ...attachments,
      {
        id: `link-${Date.now()}`,
        name: urlValue,
        url: urlValue,
        isLink: true,
      },
    ]);
    linkInputRef.current.value = "";
  };

  const handleRemove = async (index: number) => {
    if (!controlsVisible) return;
    onChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {controlsVisible && (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelect}
            accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.zip"
            disabled={disabled}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={isUploading || disabled}>
            <Paperclip className="h-4 w-4" />
            파일 선택
          </Button>
          <span className="text-sm text-muted-foreground">{fileCountText}</span>
          {isUploading && <span className="text-xs text-muted-foreground">업로드 중...</span>}
        </div>
      )}

      {attachments.filter((a) => !a.isLink).length > 0 && (
        <div className="space-y-2 mt-3">
          {attachments
            .filter((a) => !a.isLink)
            .map((file) => {
              const originalIndex = attachments.findIndex((item) => item.id === file.id);
              const sizeLabel =
                typeof file.fileSize === "number" ? `${(file.fileSize / 1024).toFixed(1)} KB` : undefined;
              return (
                <div
                  key={`${file.id}-${file.name}`}
                  className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm truncate">{file.name}</span>
                    {sizeLabel && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {sizeLabel}
                      </Badge>
                    )}
                  </div>
                  {controlsVisible && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => originalIndex >= 0 && handleRemove(originalIndex)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <div className="space-y-2">
        {controlsVisible && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-foreground">{linkLabel}</Label>
            <div className="flex gap-2">
              <Input ref={linkInputRef} placeholder="https://example.com" className="w-64" disabled={disabled} />
              <Button type="button" variant="outline" onClick={handleAddLink} disabled={isUploading || disabled}>
                {linkButtonText}
              </Button>
            </div>
          </div>
        )}
        {attachments.filter((a) => a.isLink).length > 0 && (
          <div className="space-y-2 mt-3">
            {attachments
              .filter((a) => a.isLink)
              .map((link) => {
                const originalIndex = attachments.findIndex((item) => item.id === link.id);
                const href = link.url || link.name;
                return (
                  <div
                    key={`${link.id}-${link.name}`}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-blue-500" />
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline-offset-2 hover:underline flex-1 min-w-0 truncate"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <span className="text-sm truncate">{link.name}</span>
                      )}
                    </div>
                    {controlsVisible && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => originalIndex >= 0 && handleRemove(originalIndex)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {controlsVisible && (
        <p className="text-xs text-muted-foreground">
          허용: {DEFAULT_ALLOWED_EXT.join(", ")} / 최대 {maxFiles}개, 개별 {maxFileSizeMB}MB, 총 {maxTotalMB}MB
        </p>
      )}
    </div>
  );
}
