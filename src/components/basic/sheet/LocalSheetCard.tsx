import { Link } from "react-router-dom";
import { LocalSheetMetadata } from "../../../lib/localsheet";

interface LocalSheetCardProps {
  sheet: LocalSheetMetadata;
  widthClassName?: string;
}

export default function LocalSheetCard({ sheet, widthClassName }: LocalSheetCardProps) {
  // Calculate how long ago the sheet was saved
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffSeconds = Math.round((now - timestamp) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}秒前`;

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}天前`;
  };

  // Get sync status
  const getSyncStatus = (sheet: LocalSheetMetadata): string => {
    if (!sheet.serverId) return "草稿";
    if (sheet.serverModifiedAt && sheet.localLastSavedAt > sheet.serverModifiedAt) {
      return "本地已编辑";
    }
    return "已同步";
  };

  return (
    <Link
      to={`/editor/${sheet.localKey}`}
      className="group/inner relative rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 hover:bg-[var(--bg-hover)] transition-shadow hover:shadow-md"
    >
      <div className={`relative z-0 ${widthClassName || "aspect-square"}`}>
        {sheet.coverImage ? (
          <img
            src={sheet.coverImage}
            alt={sheet.title || "未命名乐谱"}
            className="mb-2 h-full w-full rounded-lg object-cover aspect-square"
          />
        ) : (
          <div className="mb-2 h-full w-full aspect-square rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
            <span className="text-[var(--text-secondary)]">无封面</span>
          </div>
        )}
      </div>
      <h3 className="truncate font-medium text-[var(--text-primary)]">
        {sheet.title || "未命名乐谱"}
      </h3>
      <p className="truncate text-sm text-[var(--text-tertiary)]">
        更新于: {getRelativeTime(sheet.localLastSavedAt)}
      </p>
      <span className="mt-2 inline-block rounded-full bg-[var(--bg-page)] px-3 py-1 text-xs text-[var(--text-secondary)]">
        {getSyncStatus(sheet)}
      </span>
    </Link>
  );
}
