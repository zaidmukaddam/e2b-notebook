import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, X } from "lucide-react";

interface FileListProps {
  files: File[];
  onRemove: (file: File) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  return (
    <ScrollArea className="h-[200px] w-full rounded-md border border-[#EBEBEB] dark:border-[#333333] p-2">
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between rounded-lg p-2 hover:bg-[#FFF3E5] dark:hover:bg-[#333333]"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#FF8800]" />
              <span className="text-sm text-[#666666] dark:text-[#999999] truncate">
                {file.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(file)}
              className="h-6 w-6 text-[#666666] hover:text-red-600 dark:text-[#999999] dark:hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 