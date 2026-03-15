"use client";

import { useEffect, useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Share2, Save, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface AnalysisPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fullContent: string;
}

export function AnalysisPanel({ isOpen, onOpenChange, fullContent }: AnalysisPanelProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Streaming Typewriter Effect
  useEffect(() => {
    if (isOpen) {
      setDisplayedText("");
      setIsStreaming(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index < fullContent.length) {
          setDisplayedText((prev) => prev + fullContent[index]);
          index++;
        } else {
          setIsStreaming(false);
          clearInterval(interval);
        }
      }, 18); // PRD exact speed: 18ms per character
      return () => clearInterval(interval);
    }
  }, [isOpen, fullContent]);

  // Auto-scroll to bottom as text streams
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  const handleShare = () => {
    const text = "Just revealed my hidden trading edges with OrderFlow AI. Check the report: ";
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, '_blank');
  };

  const handleSave = () => {
    toast({
      title: "Report Saved",
      description: "Analysis stored in your history.",
    });
  };

  // High-fidelity Markdown Parser for AI content
  const renderContent = (text: string) => {
    const sections = text.split(/(## [A-Z0-9' ]+)/g);
    return sections.map((part, i) => {
      if (part.startsWith('## ')) {
        return <h2 key={i}>{part.replace('## ', '')}</h2>;
      }
      
      // Split by bold markdown markers
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i}>
          {boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={j} className="text-white font-bold">{bp.slice(2, -2)}</strong>;
            }
            return bp;
          })}
        </p>
      );
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-[#13131A] border-l border-primary/20 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-white/5">
          <SheetTitle className="text-primary font-headline flex items-center gap-2">
            {isStreaming && <Loader2 className="w-4 h-4 animate-spin" />}
            AI Behavioral Analysis
          </SheetTitle>
        </SheetHeader>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-body analysis-content">
          {renderContent(displayedText)}
          {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
        </div>

        {!isStreaming && (
          <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
            <Button onClick={handleSave} className="flex-1 bg-primary text-black font-semibold hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" /> Save Report
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 border-white/10 hover:bg-white/5">
              <Share2 className="w-4 h-4 mr-2" /> Share on X
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
