// src/components/quotes/FileDropzone.tsx
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileText } from "lucide-react";
import { cn } from "lib/utils";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface Props {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const ACCEPTED = {
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  "application/pdf": [".pdf"],
  "application/illustrator": [".ai"],
  "image/svg+xml": [".svg"],
  "application/postscript": [".eps"],
};

export function FileDropzone({ files, onChange, maxFiles = 5 }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = [
        ...files,
        ...accepted.map((f) => ({
          file: f,
          preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
        })),
      ].slice(0, maxFiles);
      onChange(next);
    },
    [files, onChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles,
  });

  const remove = (idx: number) => {
    const next = [...files];
    if (next[idx].preview) URL.revokeObjectURL(next[idx].preview!);
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-nsd-purple bg-purple-50"
            : "border-purple-200 bg-purple-50/40 hover:border-nsd-purple hover:bg-purple-50"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud size={28} className="mx-auto mb-2 text-nsd-purple opacity-60" />
        <p className="text-[13px] font-medium text-nsd-purple">
          {isDragActive ? "Drop files here" : "Drop files here or click to browse"}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          PDF, JPG, PNG, AI, EPS, SVG · Max 50 MB each · Up to {maxFiles} files
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2">
              {f.preview
                ? <img src={f.preview} alt="" className="w-8 h-8 object-cover rounded" />
                : <FileText size={18} className="text-gray-400 flex-shrink-0" />}
              <span className="text-[12px] text-gray-700 flex-1 truncate">{f.file.name}</span>
              <span className="text-[11px] text-gray-400">
                {(f.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
