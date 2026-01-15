import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Save, RotateCcw, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingTool({ tool, onClose, onSave, children }) {
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: 0,
        top: 0,
        right: window.innerWidth - 400,
        bottom: window.innerHeight - 500
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        width: '400px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <Card className="shadow-2xl border-2 border-blue-200 bg-white">
        <CardHeader className="pb-3 cursor-grab active:cursor-grabbing border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-lg">{tool.name}</CardTitle>
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
        <CardContent className="pt-4">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}