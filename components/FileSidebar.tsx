import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ChevronLeft, ChevronRight, FolderIcon, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileSidebarProps {
  cells: Array<{
    id: string;
    files?: File[];
  }>;
  onJumpToCell: (cellId: string) => void;
  onRemoveFile: (cellId: string, file: File) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export function FileSidebar({ cells, onJumpToCell, onRemoveFile, onExpandedChange }: FileSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const cellsWithFiles = cells.filter(cell => cell.files && cell.files.length > 0);
  const totalFiles = cellsWithFiles.reduce((acc, cell) => acc + (cell.files?.length || 0), 0);

  return (
    <div 
      className={`h-full bg-[#FFFFFF] dark:bg-[#1E1E1E] border-r border-[#EBEBEB] dark:border-[#333333] transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-12'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#EBEBEB] dark:border-[#333333]">
        {isExpanded ? (
          <h2 className="text-sm font-medium text-[#666666] dark:text-[#999999]">
            Files {totalFiles > 0 && `(${totalFiles})`}
          </h2>
        ) : (
          <FolderIcon className="h-4 w-4 text-[#666666] dark:text-[#999999]" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-[#FFF3E5] dark:hover:bg-[#333333]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            {totalFiles === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <FolderIcon className="h-8 w-8 text-[#999999] dark:text-[#666666] mb-2" />
                <p className="text-sm text-[#666666] dark:text-[#999999]">
                  No files uploaded yet
                </p>
                <p className="text-xs text-[#999999] dark:text-[#666666] mt-1">
                  Upload CSV files to any cell to see them here
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {cellsWithFiles.map((cell) => (
                  <div key={cell.id} className="space-y-1">
                    <div className="text-xs font-medium text-[#666666] dark:text-[#999999] px-2">
                      Cell {cells.findIndex(c => c.id === cell.id) + 1}
                    </div>
                    {cell.files?.map((file) => (
                      <div
                        key={file.name}
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#FFF3E5] dark:hover:bg-[#333333]"
                      >
                        <Button
                          variant="ghost"
                          className="flex-1 justify-start px-0 h-auto py-0 text-left hover:bg-transparent"
                          onClick={() => onJumpToCell(cell.id)}
                        >
                          <FileText className="h-4 w-4 mr-2 text-[#FF8800]" />
                          <span className="text-sm truncate text-[#666666] dark:text-[#999999]">
                            {file.name}
                          </span>
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[#666666] hover:text-red-600 dark:text-[#999999] dark:hover:text-red-400"
                              onClick={() => onRemoveFile(cell.id, file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete file</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 