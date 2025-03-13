import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { RootState } from "@stores/store";

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

interface MetadataFormProps {
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MetadataForm({uploading, setUploading}:MetadataFormProps){
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const auth = useSelector((state: RootState) => state.auth);
  const { title, composer, singer, coverImage } = sheetMetadata;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth.isAuthenticated) {
      alert("请先登录");
      navigate("/login");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setSheetMetadata({...sheetMetadata, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    if(!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await fetch(API_BASE_URL+"/api/upload-image", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${auth.token}`
        },
        body: formData,
      });
      
      if (result.ok) {
        const resultJson = await result.json();
        if(resultJson.coverImage){
          dispatch(setSheetMetadata({...sheetMetadata, coverImage: resultJson.coverImage}));
        }
      } else if (result.status === 401) {
        alert("登录已过期，请重新登录");
        navigate("/login");
      } else {
        alert("上传失败，请重试");
      }
    } catch (error) {
      alert("网络错误，请稍后再试");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4 bg-gradient-to-t from-[#121212] to-[#212121] p-4 rounded-lg">
      <div>
        <div 
          className="aspect-square w-full  border-4 border-[#1f1f1f] shadow-md rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden mb-4"
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
            disabled={uploading}
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
          onChange={(e) => dispatch(setSheetMetadata({...sheetMetadata, title: e.target.value }))}
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-1">作曲者</label>
        <input
          type="text"
          value={composer}
          onChange={(e) => dispatch(setSheetMetadata({...sheetMetadata, composer: e.target.value }))}
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-1">演唱者</label>
        <input
          type="text"
          value={singer}
          onChange={(e) => dispatch(setSheetMetadata({...sheetMetadata, singer: e.target.value }))}
          className="w-full p-2 bg-transparent border border-gray-700 rounded text-gray-100"
        />
      </div>
    </div>
  );
}