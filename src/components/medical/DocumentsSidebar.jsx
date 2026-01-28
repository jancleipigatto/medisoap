import React, { useState } from "react";
import { PanelRightClose, PanelRight, Pill, ClipboardList, FileCheck, Send, Info } from "lucide-react";

export default function DocumentsSidebar({ onDocumentOpen, isToolsOpen }) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(120);

  const documents = [
    {
      id: "receita",
      name: "Receita",
      icon: Pill,
      color: "from-pink-500 to-rose-600"
    },
    {
      id: "atestado",
      name: "Atestado",
      icon: ClipboardList,
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "exame",
      name: "Exame",
      icon: FileCheck,
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "encaminhamento",
      name: "Encaminhamento",
      icon: Send,
      color: "from-violet-500 to-purple-600"
    },
    {
      id: "orientacao",
      name: "Orientação",
      icon: Info,
      color: "from-cyan-500 to-blue-600"
    }
  ];

  if (!isOpen) {
    return (
      <div className="fixed top-1/2 z-[70]" style={{ right: isToolsOpen ? '120px' : '0', transform: 'translateY(calc(-50% + 22px))' }}>
        <button
          onClick={() => setIsOpen(true)}
          title="Saída de Atendimentos"
          className="bg-white shadow-lg p-3 rounded-l-lg hover:bg-gray-50 transition-colors duration-200 border-l border-t border-b border-gray-200"
        >
          <PanelRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 h-screen bg-white border-l border-gray-200 shadow-2xl z-[60]" style={{ right: isToolsOpen ? '120px' : '0', width: `${width}px`, minWidth: '100px', maxWidth: '300px' }}>
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
            <span className="text-xs font-medium text-gray-700">Documentos</span>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-100 p-1.5 rounded transition-colors duration-200"
            >
              <PanelRightClose className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2" style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onDocumentOpen(doc.id)}
                className="w-full group"
                title={doc.name}
              >
                <div className={`w-full aspect-square bg-gradient-to-br ${doc.color} rounded-xl shadow-md hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 group-hover:scale-105`}>
                  <doc.icon className="w-6 h-6 text-white" />
                  <span className="text-[10px] text-white font-medium text-center px-1 leading-tight">
                    {doc.name}
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