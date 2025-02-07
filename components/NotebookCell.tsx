import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from "@/components/ui/button";
import { Trash2, Play, Sparkles, Upload, LineChart, Loader2, AlertTriangle } from "lucide-react";
import { ChartOutput } from './ChartOutput';
import type { SerializedResult } from '@/app/actions';
import { Skeleton } from './ui/skeleton';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as monaco from 'monaco-editor';

interface NotebookCellProps {
  code: string;
  output?: string;
  results?: SerializedResult[];
  isExecuting: boolean;
  isAIGenerated?: boolean;
  files?: File[];
  onExecute: () => void;
  onDelete: () => void;
  onChange: (value: string) => void;
  onGenerateAI: () => void;
  onUploadFiles: (files: File[]) => void;
  onRemoveFile?: (file: File) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
  analysis?: string;
  onFixError: () => void;
  isFixing?: boolean;
  isGeneratingCode?: boolean;
}

export function NotebookCell({
  code,
  output,
  results,
  isExecuting,
  isAIGenerated = false,
  files = [],
  onExecute,
  onDelete,
  onChange,
  onGenerateAI,
  onUploadFiles,
  onRemoveFile,
  onAnalyze,
  isAnalyzing,
  analysis,
  onFixError,
  isFixing,
  isGeneratingCode,
}: NotebookCellProps) {
  const editorRef = useRef<any>(null);
  const [showAIWarning, setShowAIWarning] = useState(false);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Add keyboard shortcut for cell execution
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteClick();
    });

    editor.onDidContentSizeChange(() => {
      updateEditorHeight();
    });
    updateEditorHeight();
  };

  const updateEditorHeight = () => {
    if (editorRef.current) {
      const contentHeight = Math.min(
        Math.max(100, editorRef.current.getContentHeight()),
        500
      );
      editorRef.current.getContainerDomNode().style.height = `${contentHeight}px`;
      editorRef.current.layout();
    }
  };

  // Update the handleEditorChange to be simpler
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  // Add a useEffect to handle initial layout
  useEffect(() => {
    if (editorRef.current) {
      updateEditorHeight();
    }
  }, [code]);

  const handleExecuteClick = () => {
    if (!code.trim()) {
      // Show generate dialog instead of executing empty cell
      onGenerateAI();
      return;
    }

    if (isAIGenerated) {
      setShowAIWarning(true);
    } else {
      onExecute();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file =>
        file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      onUploadFiles(files);
    }
  };

  // Helper to check if output contains an error
  const hasError = output?.toLowerCase().includes('error') ||
    output?.toLowerCase().includes('exception');

  return (
    <div className="rounded-lg border border-[#EBEBEB] dark:border-[#333333] overflow-hidden mb-4">
      {/* Code Input Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E1E1E]">
        <div className="flex justify-between items-center p-2 border-b border-[#EBEBEB] dark:border-[#333333]">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-[#666666] dark:text-[#999999]">
              Code Cell
            </div>
            {isAIGenerated && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#FFF3E5] dark:bg-[#333333] text-[#FF8800]">
                AI Generated
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isGeneratingCode ? (
              <div className="flex items-center gap-2 text-[#FF8800]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating code...</span>
              </div>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleExecuteClick}
                      disabled={isExecuting}
                      className="text-[#FF8800] hover:text-[#FF9F33] dark:text-[#FF8800] dark:hover:text-[#FF9F33]"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Run cell</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="cursor-pointer">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-[#FF8800] hover:text-[#FF9F33] dark:text-[#FF8800] dark:hover:text-[#FF9F33]"
                      >
                        <div>
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            multiple
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                      </Button>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload CSV files</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onGenerateAI}
                      className="text-[#FF8800] hover:text-[#FF9F33] dark:text-[#FF8800] dark:hover:text-[#FF9F33]"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate with AI</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      className="text-[#666666] hover:text-red-600 dark:text-[#999999] dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete cell</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        {isAIGenerated && isExecuting && (
          <div className="p-2 bg-[#FFF3E5] dark:bg-[#333333] text-[#FF8800] text-sm">
            ⚠️ Please review the AI-generated code before execution
          </div>
        )}

        {/* Show generating feedback when files are present and code is being generated */}
        {isGeneratingCode && files.length > 0 && (
          <div className="p-4 bg-[#FFF3E5] dark:bg-[#333333] border-b border-[#EBEBEB] dark:border-[#333333]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF8800]" />
              <div>
                <p className="text-sm font-medium text-[#FF8800]">
                  Generating code for {files.length} file{files.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[#666666] dark:text-[#999999] mt-1">
                  {files.map(f => f.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <Editor
          defaultLanguage="python"
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            padding: { top: 8, bottom: 8 },
            wordWrap: 'on',
            automaticLayout: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto'
            },
            folding: true,
            renderValidationDecorations: 'off',
            suggest: {
              showWords: false
            },
            hover: {
              enabled: true
            },
            unicodeHighlight: {
              ambiguousCharacters: false
            },
            renderWhitespace: 'none',
            guides: {
              indentation: true
            },
            placeholder: `# Type your Python code here, or:
# - Upload CSV files to analyze data
# - Use AI to generate code
# - Press ${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to run`,
            showUnused: true,
            smoothScrolling: true,
            readOnly: isGeneratingCode
          }}
        />
      </div>

      {/* Output Section */}
      {(isExecuting || output || (results && results.length > 0)) && (
        <div className="border-t border-[#EBEBEB] dark:border-[#333333]">
          <div className="bg-[#FAFAFA] dark:bg-[#1E1E1E] p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-[#666666] dark:text-[#999999]">
                Output
              </div>
              <div className="flex gap-2">
                {hasError && !isExecuting && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFixError}
                    disabled={isFixing}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                  >
                    {isFixing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Fix Error
                      </>
                    )}
                  </Button>
                )}
                {output && !isExecuting && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="text-[#FF8800] hover:text-[#FF9F33] dark:text-[#FF8800] dark:hover:text-[#FF9F33]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <LineChart className="mr-2 h-4 w-4" />
                        Analyze Output
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {isExecuting ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-4">
                {output && (
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-[#F5F5F5] dark:bg-[#0A0A0A] p-3 rounded-lg">
                    {output}
                  </pre>
                )}
                {results && results.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((result, index) => (
                      <ChartOutput key={index} result={result} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {analysis && (
              <div className="mt-4 p-4 bg-[#FFF3E5] dark:bg-[#333333] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <LineChart className="h-4 w-4 text-[#FF8800]" />
                  <span className="text-sm font-medium text-[#FF8800]">Analysis</span>
                </div>
                <div className="text-sm text-[#666666] dark:text-[#999999] whitespace-pre-wrap">
                  {analysis}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={showAIWarning} onOpenChange={setShowAIWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Execute AI-Generated Code</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the AI-generated code before execution. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowAIWarning(false);
                onExecute();
              }}
              className="bg-[#FF8800] hover:bg-[#FF9F33] text-white"
            >
              Execute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 