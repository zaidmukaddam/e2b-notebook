'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { NotebookCell } from '@/components/NotebookCell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown } from 'lucide-react';
import { executeCode, SerializedResult, generateCode, generateCodeWithFiles, analyzeOutput, fixCode } from './actions';
import { GenerateCodeDialog } from '@/components/GenerateCodeDialog';
import { FileSidebar } from '@/components/FileSidebar';

interface Cell {
  id: string;
  code: string;
  output?: string;
  results?: SerializedResult[];
  isAIGenerated?: boolean;
  files?: File[];
  analysis?: string;
}

export default function Home() {
  const [cells, setCells] = useState<Cell[]>([{ id: '1', code: '' }]);
  const [executingCell, setExecutingCell] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [analyzingCell, setAnalyzingCell] = useState<string | null>(null);
  const [fixingCell, setFixingCell] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const handleExecuteCell = async (cellId: string) => {
    setExecutingCell(cellId);
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;

    try {
      const execution = await executeCode(cell.code);
      setCells(cells.map(c => {
        if (c.id === cellId) {
          return {
            ...c,
            output: execution.success ? execution.output : execution.error,
            results: execution.results
          };
        }
        return c;
      }));
    } catch (error) {
      console.error('Execution error:', error);
      setCells(cells.map(c => {
        if (c.id === cellId) {
          return {
            ...c,
            output: 'Failed to execute code',
            results: []
          };
        }
        return c;
      }));
    } finally {
      setExecutingCell(null);
    }
  };

  const addCell = () => {
    setCells([...cells, { id: Date.now().toString(), code: '' }]);
  };

  const deleteCell = (cellId: string) => {
    const remainingCells = cells.filter(c => c.id !== cellId);
    // Always ensure at least one empty cell exists
    if (remainingCells.length === 0) {
      setCells([{ id: Date.now().toString(), code: '' }]);
    } else {
      setCells(remainingCells);
    }
  };

  const updateCell = (cellId: string, newCode: string) => {
    setCells(cells.map(c => {
      if (c.id === cellId) {
        return { ...c, code: newCode };
      }
      return c;
    }));
  };

  const handleRunAll = async () => {
    // Initialize sandbox once for all cells
    try {
      setIsGenerating(true);
      for (const cell of cells) {
        // Set executing state for current cell
        setExecutingCell(cell.id);
        
        try {
          const execution = await executeCode(cell.code);
          // Update only the current cell's output
          setCells(prevCells => prevCells.map(c => {
            if (c.id === cell.id) {
              return {
                ...c,
                output: execution.success ? execution.output : execution.error,
                results: execution.results
              };
            }
            return c;
          }));
        } catch (error) {
          console.error('Execution error:', error);
          // Update error state for the current cell
          setCells(prevCells => prevCells.map(c => {
            if (c.id === cell.id) {
              return {
                ...c,
                output: 'Failed to execute code',
                results: []
              };
            }
            return c;
          }));
        }
        
        // Clear executing state for current cell
        setExecutingCell(null);
        
        // Add a small delay between cell executions to ensure proper order
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Run all error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAllCells = () => {
    setCells([{ id: '1', code: '' }]);
  };

  const handleGenerateCode = async (prompt: string, files: File[]) => {
    setIsGenerating(true);
    try {
      // Add files to the target cell immediately
      const emptyCell = cells.find(c => c.code === '');
      const targetCellId = emptyCell ? emptyCell.id : Date.now().toString();

      // Update cells with files before generation starts
      setCells(prevCells => {
        if (emptyCell) {
          return prevCells.map(c =>
            c.id === emptyCell.id
              ? { 
                  ...c, 
                  files: files.length > 0 ? [...(c.files || []), ...files] : undefined
                }
              : c
          );
        } else {
          return [
            ...prevCells,
            {
              id: targetCellId,
              code: '',
              files: files.length > 0 ? files : undefined,
            },
          ];
        }
      });

      const result = files.length > 0 
        ? await generateCodeWithFiles(prompt, files)
        : await generateCode(prompt);

      if (result.success && result.code) {
        setCells(prevCells => prevCells.map(c =>
          c.id === targetCellId
            ? { 
                ...c, 
                code: result.code, 
                isAIGenerated: true,
              }
            : c
        ));
      }
    } finally {
      setIsGenerating(false);
      setShowGenerateDialog(false);
    }
  };

  const handleUploadFiles = async (cellId: string, files: File[]) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;

    // Update files immediately
    setCells(prevCells => prevCells.map(c => {
      if (c.id === cellId) {
        return { 
          ...c, 
          files: [...(c.files || []), ...files],
          // Clear any existing code since we'll generate new code
          code: ''
        };
      }
      return c;
    }));

    setIsGenerating(true);
    try {
      const result = await generateCodeWithFiles("Process and visualize this data", files);
      if (result.success && result.code) {
        // Use the same pattern as handleGenerateCode
        setCells(prevCells => prevCells.map(c => {
          if (c.id === cellId) {
            return { 
              ...c, 
              code: result.code, 
              isAIGenerated: true,
              // Don't update files here since we already did it above
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      // Optionally handle the error state in the UI
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveFile = (cellId: string, fileToRemove: File) => {
    setCells(cells.map(c => {
      if (c.id === cellId) {
        return {
          ...c,
          files: c.files?.filter(f => f !== fileToRemove)
        };
      }
      return c;
    }));
  };

  const handleJumpToCell = (cellId: string) => {
    const element = document.getElementById(`cell-${cellId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyzeOutput = async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || !cell.output) return;

    setAnalyzingCell(cellId);
    try {
      const result = await analyzeOutput(cell.output, cell.results);
      if (result.success) {
        setCells(cells.map(c => {
          if (c.id === cellId) {
            return {
              ...c,
              analysis: result.analysis
            };
          }
          return c;
        }));
      }
    } finally {
      setAnalyzingCell(null);
    }
  };

  const handleFixError = async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || !cell.output) return;

    setFixingCell(cellId);
    try {
      const result = await fixCode(cell.code, cell.output);
      if (result.success) {
        setCells(cells.map(c => {
          if (c.id === cellId) {
            return {
              ...c,
              code: result.code!,
              isAIGenerated: true
            };
          }
          return c;
        }));
      }
    } finally {
      setFixingCell(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC] dark:bg-[#0A0A0A]">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-10 border-b border-[#EBEBEB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] h-[60px] flex items-center">
        <div className="w-full px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">
              ✶ E2B Notebook
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRunAll}
                className="border-[#FF8800] dark:border-[#FF8800] 
                         hover:bg-[#FFF3E5] dark:hover:bg-[#333333] 
                         text-[#FF8800] dark:text-[#FF8800]
                         hover:text-[#FF8800] dark:hover:text-[#FF8800]"
              >
                Run All
              </Button>

              <Button
                onClick={addCell}
                className="bg-[#FF8800] hover:bg-[#FF9F33] text-[#FFFFFF] border-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Cell
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-[#FF8800] dark:border-[#FF8800] 
                             hover:bg-[#FFF3E5] dark:hover:bg-[#333333] 
                             text-[#FF8800] dark:text-[#FF8800]
                             hover:text-[#FF8800] dark:hover:text-[#FF8800]
                             px-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#FFFFFF] dark:bg-[#1E1E1E] border-[#EBEBEB] dark:border-[#333333]"
                >
                  <DropdownMenuItem
                    onClick={() => setShowGenerateDialog(true)}
                    className="hover:bg-[#FFF3E5] dark:hover:bg-[#333333] text-[#FF8800] dark:text-[#FF8800]"
                  >
                    Generate with AI
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={clearAllCells}
                    className="hover:bg-[#FFF3E5] dark:hover:bg-[#333333] text-[#FF8800] dark:text-[#FF8800]"
                  >
                    Clear All Cells
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with fixed sidebar */}
      <div className="flex flex-1 pt-[60px]">
        {/* Fixed sidebar */}
        <div className="fixed left-0 top-[60px] bottom-0 z-10">
          <FileSidebar 
            cells={cells} 
            onJumpToCell={handleJumpToCell} 
            onRemoveFile={handleRemoveFile}
            onExpandedChange={setIsSidebarExpanded}
          />
        </div>
        
        {/* Scrollable main content with dynamic margin */}
        <main className={`flex-1 overflow-auto transition-[margin] duration-300 ease-in-out ${
          isSidebarExpanded ? 'ml-64' : 'ml-12'
        }`}>
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
              {cells.map((cell) => (
                <div key={cell.id} id={`cell-${cell.id}`}>
                  <NotebookCell
                    code={cell.code}
                    output={cell.output}
                    results={cell.results}
                    isExecuting={executingCell === cell.id}
                    onExecute={() => handleExecuteCell(cell.id)}
                    onDelete={() => deleteCell(cell.id)}
                    onChange={(newCode) => updateCell(cell.id, newCode)}
                    isAIGenerated={cell.isAIGenerated}
                    onGenerateAI={() => setShowGenerateDialog(true)}
                    onUploadFiles={(files) => handleUploadFiles(cell.id, files)}
                    files={cell.files}
                    onRemoveFile={(file) => handleRemoveFile(cell.id, file)}
                    onAnalyze={() => handleAnalyzeOutput(cell.id)}
                    isAnalyzing={analyzingCell === cell.id}
                    analysis={cell.analysis}
                    onFixError={() => handleFixError(cell.id)}
                    isFixing={fixingCell === cell.id}
                    isGeneratingCode={isGenerating && (
                      (cell.files?.length ?? 0) > 0 || 
                      cell.id === cells.find(c => c.code === '')?.id
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <GenerateCodeDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onGenerate={handleGenerateCode}
        isLoading={isGenerating}
      />
    </div>
  );
}
