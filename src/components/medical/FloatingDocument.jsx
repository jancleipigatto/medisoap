import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingDocument({ document, onClose, children }) {
  const [isTranslucent, setIsTranslucent] = useState(false);
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

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: 0,
        top: 0,
        right: window.innerWidth - 450,
        bottom: window.innerHeight - 600
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isTranslucent ? 0.3 : 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed z-50"
      style={{ 
        left: window.innerWidth / 2 - 225, 
        top: 100,
        width: '450px',
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="shadow-2xl border-2 border-blue-200 bg-white">
        <CardHeader className="pb-3 cursor-grab active:cursor-grabbing border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-lg">{document.name}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}