import React, { useRef } from 'react';

interface MetadataFormProps {
  title: string;
  setTitle: (value: string) => void;
  composer: string;
  setComposer: (value: string) => void;
  singer: string;
  setSinger: (value: string) => void;
  coverImage: string | null;
  setCoverImage: (value: string | null) => void;
}

export default function MetadataForm({
  title,
  setTitle,
  composer,
  setComposer,
  singer,
  setSinger,
  coverImage,
  setCoverImage,
}: MetadataFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 bg-gradient-to-t from-[#121212] to-[#212121] p-4 rounded-lg">
      <div>
        <div 
          className="aspect-square w-full bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          {coverImage ? (
            <img 
              src={coverImage} 
              alt="Cover" 
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>点击上传封面</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">曲名</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-1">作曲者</label>
        <input
          type="text"
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-1">演唱者</label>
        <input
          type="text"
          value={singer}
          onChange={(e) => setSinger(e.target.value)}
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100"
        />
      </div>
    </div>
  );
}