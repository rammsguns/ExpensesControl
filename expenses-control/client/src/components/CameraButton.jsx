import React from 'react';
import { Camera, Image, X } from 'lucide-react';

export default function CameraButton({ expenseId, onUpload }) {
  const [preview, setPreview] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    if (!expenseId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch(`/api/expenses/${expenseId}/receipt`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        onUpload?.(data.receiptUrl);
      }
    } catch {
      // silently fail or handle via parent
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*;capture=camera"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Receipt preview"
            className="w-16 h-16 object-cover rounded-lg border border-slate-200"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600 transition"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <Camera size={16} />
          {uploading ? '...' : <Image size={16} />}
        </button>
      )}
    </div>
  );
}
