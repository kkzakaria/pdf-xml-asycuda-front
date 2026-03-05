'use client';

import { useCallback, useState, useRef, type DragEvent } from 'react';

const CheckCircleIcon = (
  <svg
    className="h-6 w-6 text-green-600 dark:text-green-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloudUploadIcon = (
  <svg
    className="h-6 w-6 text-zinc-500 dark:text-zinc-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

interface FileUploaderProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  disabled?: boolean;
}

export function FileUploader({
  file,
  onFileSelect,
  onFileRemove,
  accept = '.pdf',
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === 'application/pdf') {
        onFileSelect(droppedFile);
      }
    },
    [disabled, onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileRemove();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onFileRemove]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`
        relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center
        rounded-xl border-2 border-dashed p-6 transition-colors
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : file
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
        }
        ${disabled ? 'cursor-not-allowed opacity-60' : ''}
      `.trim()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={file ? `Fichier sélectionné : ${file.name}` : 'Téléverser un fichier PDF'}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {file ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            {CheckCircleIcon}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {file.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-2 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            disabled={disabled}
          >
            Supprimer le fichier
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
            {CloudUploadIcon}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Déposez votre fichier PDF ici
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              ou cliquez pour parcourir
            </p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Seuls les fichiers PDF sont acceptés
          </p>
        </div>
      )}
    </div>
  );
}
