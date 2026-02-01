import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical, ChevronRight } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

export default function FloatingDocument({ document, onClose, children }) {
  const [isTranslucent, setIsTranslucent] = useState(false);
  const [size, setSize] = useState({ width: 630, height: 600 });
  const dragControls = useDragControls();
  const holdTimerRef = useRef(null);

  const handleMouseDown = () => {
    holdTimerRef.current = setTimeout(() => {
      setIsTranslucent(true);
    }, 2000);
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setIsTranslucent(false);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(300, startHeight + (moveEvent.clientY - startY));
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUpResize = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUpResize);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUpResize);
  };

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={false}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isTranslucent ? 0.3 : 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed z-50"
      style={{ 
        left: `calc(50% - ${size.width / 2}px)`, 
        top: 100,
        width: size.width,
        height: size.height,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="shadow-2xl border-2 border-blue-200 bg-white h-full flex flex-col relative">
        <CardHeader 
          className="pb-3 cursor-grab active:cursor-grabbing border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-lg">{document.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                >
                <X className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 overflow-y-auto flex-1">
          {children}
        </CardContent>
        
        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center bg-gray-100 rounded-tl-lg border-t border-l border-gray-300 hover:bg-gray-200 transition-colors z-50"
          onMouseDown={handleResizeStart}
        >
            <ChevronRight className="w-4 h-4 text-gray-400 rotate-45 transform" />
        </div>
      </Card>
    </motion.div>
  );
}