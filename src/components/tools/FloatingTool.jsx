import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

export default function FloatingTool({ tool, onClose, onSave, children }) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={false}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed z-50"
      style={{ 
        left: window.innerWidth / 2 - 200,
        top: 100,
        width: '400px',
      }}
    >
      <Card className="shadow-2xl border-2 border-blue-200 bg-white">
        <CardHeader
          className="pb-3 cursor-grab active:cursor-grabbing border-b bg-gradient-to-r from-blue-50 to-indigo-50"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-lg">{tool.name}</CardTitle>
            </div>
            <div onPointerDown={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}