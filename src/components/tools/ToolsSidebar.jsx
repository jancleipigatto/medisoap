import React, { useState } from "react";
import { PanelRightClose, PanelRight, Calculator, Baby, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function ToolsSidebar({ 
  onToolOpen, 
  isOpen, 
  setIsOpen, 
  width, 
  setWidth, 
  otherSidebarOpen, 
  otherSidebarWidth 
}) {
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
      id: "alvarado",
      name: "Escala Alvarado",
      icon: Activity,
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "gfr",
      name: "Taxa Filtração",
      icon: Activity,
      color: "from-emerald-500 to-green-600"
    },
    {
      id: "calculator",
      name: "Calculadora",
      icon: Calculator,
      color: "from-purple-500 to-indigo-600"
    }
  ];

  if (!isOpen) {
    const rightPosition = otherSidebarOpen ? `${otherSidebarWidth}px` : '0';
    return (
      <div 
        className="fixed top-1/2 z-[70] transition-all duration-300" 
        style={{ 
          right: rightPosition, 
          transform: 'translateY(calc(-50% - 70px))' 
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          title="Ferramentas"
          className="bg-blue-100 text-blue-900 border-blue-200 shadow-lg py-4 px-2 rounded-l-lg hover:bg-blue-200 transition-colors duration-200 border-l border-t border-b flex flex-col items-center gap-2"
        >
          <PanelRight className="w-5 h-5" />
          <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
            Ferramentas
          </span>
        </button>
      </div>
    );
  }

  // When open, push the other sidebar if it's closed? Or just sit on top/beside?
  // The layout request is to be always visible.
  // If Tools is open, it sits at right: 0.
  // If Docs is open, it sits at right: 0.
  // If both open, they overlap? We should probably manage z-index or stack them.
  // Let's assume they stack or push.
  // If other is open, maybe this one opens to the left of it?
  // right: otherSidebarOpen ? `${otherSidebarWidth}px` : '0'
  
  // Tools Sidebar always stays at right: 0 (Anchor)
  // If Docs is open, it will shift left.
  const panelRight = '0';

  return (
    <div 
      className="fixed top-0 h-screen bg-white border-l border-gray-200 shadow-2xl z-[60] transition-all duration-300" 
      style={{ 
        right: panelRight, 
        width: `${width}px`, 
        minWidth: '100px', 
        maxWidth: '300px' 
      }}
    >
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
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-blue-50">
            <span className="text-xs font-medium text-blue-900">Ferramentas</span>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-100 p-1.5 rounded transition-colors duration-200 text-blue-900"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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