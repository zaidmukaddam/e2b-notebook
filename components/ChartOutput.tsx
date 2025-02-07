import React from 'react';
import Image from 'next/image';
import type { SerializedResult } from '@/app/actions';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ChartOutputProps {
  result: SerializedResult;
}

export function ChartOutput({ result }: ChartOutputProps) {
  if (!result.png) return null;

  const handleDownload = () => {
    // Convert base64 to blob
    const byteString = atob(result.png!);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/png' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative group bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleDownload}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                 bg-white/80 dark:bg-neutral-900/80 hover:bg-white/90 dark:hover:bg-neutral-900/90
                 border border-neutral-200/50 dark:border-neutral-800/50
                 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100
                 shadow-sm z-10"
      >
        <Download className="h-4 w-4" />
      </Button>
      <div className="p-2">
        <Image 
          src={`data:image/png;base64,${result.png}`}
          alt="Chart output"
          width={600}
          height={400}
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
} 