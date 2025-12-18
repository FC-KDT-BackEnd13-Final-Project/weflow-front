import { cn } from "@/lib/utils";
import type { AttachmentResponse as StepAttachmentResponse } from "@/lib/stepTypes";
import type {
  AttachmentResponse as CommonAttachmentResponse,
  AttachmentType,
} from "@/types/attachment";
import { Button } from "@/components/ui/button";
import { Download, Link2, Paperclip } from "lucide-react";
import { Label } from "@/components/ui/label";

type AttachmentInputItem = StepAttachmentResponse | CommonAttachmentResponse | string;

interface AttachmentListProps {
  items: AttachmentInputItem[];
  emptyText?: string;
  fileLabel?: string;
  linkLabel?: string;
  className?: string;
}

const formatFileSize = (size?: number) => {
  if (!size || Number.isNaN(size)) return null;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};

const getHostname = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const normalizeAttachments = (items: AttachmentInputItem[]) => {
  const seen = new Set<string>();
  const mapped = items
    .map((item, idx) => {
      const attachmentType: AttachmentType | "LINK" | undefined =
        typeof item === "string" ? "LINK" : (item as CommonAttachmentResponse)?.attachmentType;
      const pathValue = typeof item === "string" ? undefined : (item as StepAttachmentResponse | CommonAttachmentResponse)?.filePath || (item as StepAttachmentResponse)?.path;
      const url = typeof item === "string" ? item : (item as StepAttachmentResponse | CommonAttachmentResponse)?.url || pathValue;
      const baseName =
        typeof item === "string"
          ? url
          : (item as StepAttachmentResponse | CommonAttachmentResponse)?.fileName ||
            (item as StepAttachmentResponse)?.name ||
            (item as StepAttachmentResponse)?.originalName ||
            pathValue ||
            (item as StepAttachmentResponse | CommonAttachmentResponse)?.url;
      const isLinkType =
        attachmentType === "LINK" ||
        Boolean((item as StepAttachmentResponse).isLink) ||
        Boolean((item as StepAttachmentResponse | CommonAttachmentResponse).url && !(item as StepAttachmentResponse | CommonAttachmentResponse).filePath);
      const isLink = typeof item === "string" || isLinkType;
      const id = typeof item === "string" ? `link-${idx}` : (item as StepAttachmentResponse | CommonAttachmentResponse)?.id ?? `${attachmentType ?? "att"}-${idx}`;
      const key = isLink ? `link-${url || baseName}` : `file-${pathValue || url || baseName}`;
      const size =
        typeof item === "string"
          ? undefined
          : (item as StepAttachmentResponse | CommonAttachmentResponse)?.fileSize ??
            (item as { size?: number }).size;
      if (!baseName || seen.has(key)) return null;
      seen.add(key);
      return {
        id,
        name: baseName,
        url: url ?? undefined,
        isLink,
        size,
      };
    })
    .filter(Boolean) as { id: string | number; name: string; url?: string; isLink: boolean; size?: number }[];

  return {
    files: mapped.filter((m) => !m.isLink),
    links: mapped.filter((m) => m.isLink),
    hasAny: mapped.length > 0,
  };
};

export function AttachmentList({
  items,
  emptyText = "첨부가 없습니다.",
  fileLabel = "첨부파일",
  linkLabel = "링크",
  className,
}: AttachmentListProps) {
  const { files, links, hasAny } = normalizeAttachments(items);

  if (!hasAny) {
    return <p className={cn("mt-2 text-sm text-muted-foreground", className)}>{emptyText}</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!!files.length && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Paperclip className="h-4 w-4" />
            {fileLabel}
          </Label>
          <div className="space-y-2">
            {files.map((file) => {
              const sizeText = formatFileSize(file.size);
              const href = file.url;
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                  title={file.name}
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      {sizeText && <p className="text-xs text-muted-foreground">{sizeText}</p>}
                    </div>
                  </div>
                  {href ? (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={href} target="_blank" rel="noreferrer" download>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">다운로드</span>
                      </a>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!!links.length && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4" />
            {linkLabel}
          </Label>
          <div className="space-y-2">
            {links.map((link) => {
              const href = link.url || link.name || "";
              const hostLabel = getHostname(href) || link.name;
              const tooltip = href || hostLabel;
              return (
                <a
                  key={link.id}
                  href={href || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  title={tooltip}
                >
                  <div className="text-xs text-muted-foreground truncate mt-1">{hostLabel}</div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
