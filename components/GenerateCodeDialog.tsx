import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { FileList } from './FileList';

interface GenerateCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, files: File[]) => void;
  isLoading: boolean;
}

export function GenerateCodeDialog({ isOpen, onClose, onGenerate, isLoading }: GenerateCodeDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleGenerate = () => {
    onGenerate(prompt, files);
    setPrompt('');
    setFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => 
        file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#000000] dark:text-[#FFFFFF]">Generate Code with AI</DialogTitle>
          <DialogDescription className="text-[#666666] dark:text-[#999999]">
            Describe what you want to create and upload any CSV files needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a visualization using the uploaded CSV files"
            className="h-32 resize-none"
            disabled={isLoading}
          />
          
          <div className="space-y-2">
            <label 
              htmlFor="file-upload"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#EBEBEB] dark:border-[#333333] p-4 hover:border-[#FF8800] transition-colors"
            >
              <Upload className="h-4 w-4 text-[#FF8800]" />
              <span className="text-sm text-[#666666] dark:text-[#999999]">
                Upload CSV files
              </span>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
            
            {files.length > 0 && (
              <FileList files={files} onRemove={removeFile} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#EBEBEB] dark:border-[#333333] text-[#666666] dark:text-[#999999]"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt || isLoading}
            className="bg-[#FF8800] hover:bg-[#FF9F33] text-[#FFFFFF] border-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 