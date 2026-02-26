import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PhotoSlot {
  id: string;
  role: string;
  file: File | null;
  preview: string | null;
}

interface PhotoUploadProps {
  slotData: PhotoSlot;
  onUpload: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}

export function PhotoUpload({ slotData, onUpload, onRemove }: PhotoUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(slotData.id, acceptedFiles[0]);
    }
  }, [slotData.id, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/80 font-sans tracking-wide uppercase">
        {slotData.role}
      </span>
      
      <div 
        {...(slotData.preview ? {} : getRootProps())}
        data-testid={`upload-slot-${slotData.id}`}
        className={cn(
          "relative aspect-[4/5] w-full rounded-sm overflow-hidden transition-all duration-300 group hover-elevate active-elevate-2",
          !slotData.preview && "border-2 border-dashed cursor-pointer flex flex-col items-center justify-center p-4 text-center",
          isDragActive ? "border-accent bg-accent/5" : "border-border",
          slotData.preview && "border-none shadow-md shadow-black/5"
        )}
      >
        {!slotData.preview && <input {...getInputProps()} />}
        
        {slotData.preview ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="relative w-full h-full"
          >
            <img 
              src={slotData.preview} 
              alt={slotData.role} 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(slotData.id);
                }}
                data-testid={`button-remove-photo-${slotData.id}`}
                className="bg-white/10 text-white rounded-full p-3 backdrop-blur-md hover-elevate active-elevate-2"
                aria-label="Remover foto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground group-hover:text-accent transition-colors">
            <UploadCloud className="w-8 h-8 mb-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-xs sm:text-sm font-medium">Arraste uma foto</p>
            <p className="text-[10px] sm:text-xs opacity-60 mt-1">ou clique para enviar</p>
          </div>
        )}
      </div>
    </div>
  );
}
