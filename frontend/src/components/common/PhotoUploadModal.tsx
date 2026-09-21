import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Check } from 'lucide-react';
import { Modal } from './Modal';
import { ProfileAvatar } from './ProfileAvatar';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string | null;
  onSave: (newPhotoUrl: string | null) => void;
  title?: string;
  userName?: string;
  userRole?: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  onSave,
  title = 'Upload Profile Photo',
  userName = 'User',
  userRole = 'PATIENT',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5 MB.');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onSave(previewUrl);
    onClose();
  };

  const handleCancel = () => {
    setPreviewUrl(currentPhotoUrl || null);
    setSelectedFile(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title}>
      <div className="space-y-6 text-xs text-slate-300">
        {/* Current / New Preview Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#141416] border border-white/[0.08] rounded-2xl space-y-4">
          <div className="relative">
            <ProfileAvatar
              photoUrl={previewUrl}
              name={userName}
              role={userRole}
              size="2xl"
              shape="rounded"
              className="border-4 border-white/[0.10] shadow-2xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-105"
              title="Choose photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <p className="font-bold text-sm text-white">{userName}</p>
            <p className="text-[11px] text-slate-400">
              {previewUrl ? 'Photo preview ready for update' : 'Default medical avatar currently active'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload / Replace / Remove Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/[0.10] bg-[#101012] hover:bg-white/[0.06] text-white font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>{previewUrl ? 'Replace Photo' : 'Upload Image'}</span>
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove Photo</span>
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-[#141416] border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Tip:</strong> Upload a clear, professional portrait photo in JPG or PNG format. Your photo will appear across your header, profile card, digital identity pass, and clinical records.
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile Photo</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
