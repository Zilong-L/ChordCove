import React from 'react';

interface ReadOnlyMetadataFormProps {
  title: string;
  composer: string;
  singer: string;
  uploader?: string;
  coverImage: string | null;
}

export default function ReadOnlyMetadataForm({
  title,
  composer,
  singer,
  uploader,
  coverImage,
}: ReadOnlyMetadataFormProps) {
  return (
    <div className="space-y-4 bg-gradient-to-b from-[#121212] to-[#212121] p-4 rounded-lg">
      <div>
        <div 
          className="aspect-square w-full bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden mb-4"
          aria-label="Sheet music cover image"
        >
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={`Cover for ${title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-400">
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
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
        <label className="block text-gray-400 mb-1">曲名</label>
        <div 
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100 min-h-[2.5rem]"
          aria-label="Song title"
        >
          {title || '未提供'}
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">作曲者</label>
        <div 
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100 min-h-[2.5rem]"
          aria-label="Composer"
        >
          {composer || '未提供'}
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">演唱者</label>
        <div 
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100 min-h-[2.5rem]"
          aria-label="Singer"
        >
          {singer || '未提供'}
        </div>
      </div>

      {uploader && (
        <div>
          <label className="block text-gray-400 mb-1">制谱者</label>
          <div 
            className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100 min-h-[2.5rem]"
            aria-label="Sheet music creator"
          >
            {uploader}
          </div>
        </div>
      )}
    </div>
  );
}