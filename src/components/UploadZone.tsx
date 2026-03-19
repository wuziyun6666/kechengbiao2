import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
}

export function UploadZone({ onUpload, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // result is like "data:image/png;base64,iVBORw0KGgo..."
      const [prefix, base64] = result.split(',');
      const mimeType = prefix.split(':')[1].split(';')[0];
      onUpload(base64, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }, [onUpload]);

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto p-8 md:p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center
        ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="text-lg font-medium text-slate-700">正在分析您的课表...</div>
          <p className="text-sm text-slate-500">这可能需要几秒钟时间。</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <div className="text-lg font-medium text-slate-700">
              点击上传或拖拽文件至此
            </div>
            <p className="text-sm text-slate-500 mt-1">
              上传您的课表截图 (PNG, JPG)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
