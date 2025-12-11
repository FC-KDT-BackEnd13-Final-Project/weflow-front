import { cn } from "@/lib/utils";
import { AttachmentResponse } from "@/lib/stepTypes";
import { FileText, Link as LinkIcon } from "lucide-react";

type AttachmentInputItem = AttachmentResponse | string;

interface AttachmentListProps {
  items: AttachmentInputItem[];
  emptyText?: string;
  fileLabel?: string;
  linkLabel?: string;
  className?: string;
}

const normalizeAttachments = (items: AttachmentInputItem[]) => {
  const seen = new Set<string>();
  const mapped = items
    .map((item, idx) => {
      const attachmentType = typeof item === "string" ? "LINK" : (item as { attachmentType?: string }).attachmentType;
      const pathValue = typeof item === "string" ? undefined : item?.filePath || item?.path;
      const url = typeof item === "string" ? item : item?.url || pathValue;
      const baseName = typeof item === "string" ? url : item?.fileName || item?.name || item?.originalName || pathValue || item?.url;
      const isLinkType = attachmentType === "LINK" || Boolean((item as AttachmentResponse).isLink);
      const isLink =
        typeof item === "string" ||
        isLinkType;
      const id = typeof item === "string" ? `link-${idx}` : item?.id ?? `${attachmentType ?? "att"}-${idx}`;
      const key = isLink ? `link-${url || baseName}` : `file-${pathValue || url || baseName}`;
      if (!baseName || seen.has(key)) return null;
      seen.add(key);
      return {
        id,
        name: baseName,
        url: url ?? undefined,
        isLink,
      };
    })
    .filter(Boolean) as { id: string | number; name: string; url?: string; isLink: boolean }[];

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
  linkLabel = "관련 링크",
  className,
}: AttachmentListProps) {
  const { files, links, hasAny } = normalizeAttachments(items);

  if (!hasAny) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyText}</p>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!!files.length && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{fileLabel}</p>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                <FileText className="h-4 w-4 text-blue-500" />
                {file.url ? (
                  <a
                    className="text-sm font-semibold text-blue-600 hover:underline break-all"
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.name}
                  </a>
                ) : (
                  <span className="text-sm flex-1">{file.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {!!links.length && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{linkLabel}</p>
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                <LinkIcon className="h-4 w-4 text-blue-500" />
                {link.url ? (
                  <a
                    className="text-sm font-semibold text-blue-600 hover:underline break-all"
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.name}
                  </a>
                ) : (
                  <span className="text-sm flex-1">{link.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
