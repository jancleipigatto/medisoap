import React, { useState } from "react";
import { PanelRightClose, PanelRight, Calculator, Baby, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function ToolsSidebar({ onToolOpen }) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(120);

  const tools = [
    {
      id: "gestational_age",
      name: "Idade Gestacional",
      icon: Baby,
      color: "from-pink-500 to-rose-600"
    },
    {
      id: "bmi",
      name: "IMC",
      icon: Activity,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "cardiac_risk",
      name: "Risco Cardíaco",
      icon: Heart,
      color: "from-red-500 to-pink-600"
    },
    {
      id: "calculator",
      name: "Calculadora",
      icon: Calculator,
      color: "from-purple-500 to-indigo-600"
    }
  ];

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[60]">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white shadow-lg p-3 rounded-l-lg hover:bg-gray-50 transition-colors duration-200 border-l border-t border-b border-gray-200"
        >
          <PanelRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-screen bg-white border-l border-gray-200 shadow-2xl z-[60]" style={{ width: `${width}px`, minWidth: '100px', maxWidth: '300px' }}>
      <div className="flex h-full">
        <div 
          className="w-1 hover:w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-all duration-150"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = width;
            
            const handleMouseMove = (e) => {
              const delta = startX - e.clientX;
              const newWidth = Math.max(100, Math.min(300, startWidth + delta));
              setWidth(newWidth);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
        
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Ferramentas</span>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-100 p-1.5 rounded transition-colors duration-200"
            >
              <PanelRightClose className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolOpen(tool.id)}
                className="w-full group"
                title={tool.name}
              >
                <div className={`w-full aspect-square bg-gradient-to-br ${tool.color} rounded-xl shadow-md hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 group-hover:scale-105`}>
                  <tool.icon className="w-6 h-6 text-white" />
                  <span className="text-[10px] text-white font-medium text-center px-1 leading-tight">
                    {tool.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}