import { useSelector } from "react-redux";
import { RootState } from "@stores/store";

export default function ReadOnlyMetadataForm() {
  const { title, composers, singers, uploader, coverImage, bvid } = useSelector(
    (state: RootState) => state.sheetMetadata
  );
  
  return (
    <div className="space-y-4 rounded-lg bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] p-4">
      <div>
        <div
          className="relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-secondary)]"
          aria-label="Sheet music cover image"
        >
          {coverImage ? (
            <img
              src={coverImage || undefined}
              alt={`Cover for ${title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center text-[var(--text-tertiary)]">
              <svg
                className="mx-auto mb-2 h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>暂无封面</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[var(--text-tertiary)]">曲名</label>
        <div
          className="min-h-[2.5rem] w-full rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)]"
          aria-label="Song title"
        >
          {title || "未提供"}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[var(--text-tertiary)]">作曲者</label>
        <div
          className="min-h-[2.5rem] w-full rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)]"
          aria-label="Composer"
        >
          {composers?.map((composer) => composer.name).join(", ") || "未提供"}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[var(--text-tertiary)]">演唱者</label>
        <div
          className="min-h-[2.5rem] w-full rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)]"
          aria-label="Singer"
        >
          {singers?.map((singer) => singer.name).join(", ") || "未提供"}
        </div>
      </div>

      {uploader && (
        <div>
          <label className="mb-1 block text-[var(--text-tertiary)]">制谱者</label>
          <div
            className="min-h-[2.5rem] w-full rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)]"
            aria-label="Sheet music creator"
          >
            {uploader}
          </div>
        </div>
      )}
      {bvid && (
        <iframe
          src={`//player.bilibili.com/player.html?bvid=${bvid}&autoPlay=0`}
          allowFullScreen
          className="w-full rounded-lg border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)]"
        ></iframe>
      )}
    </div>
  );
}
