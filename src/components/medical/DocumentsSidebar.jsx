import React, { useState } from "react";
import { PanelRightClose, PanelRight, Pill, ClipboardList, FileCheck, Send, Info } from "lucide-react";

export default function DocumentsSidebar({ 
  onDocumentOpen, 
  isOpen, 
  setIsOpen, 
  width, 
  setWidth,
  otherSidebarOpen,
  otherSidebarWidth 
}) {
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
    const rightPosition = otherSidebarOpen ? `${otherSidebarWidth}px` : '0';
    return (
      <div 
        className="fixed top-1/2 z-[70] transition-all duration-300" 
        style={{ 
          right: rightPosition, 
          transform: 'translateY(calc(-50% + 70px))' 
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          title="Saída de Atendimentos"
          className="bg-green-100 text-green-900 border-green-200 shadow-lg py-4 px-2 rounded-l-lg hover:bg-green-200 transition-colors duration-200 border-l border-t border-b flex flex-col items-center gap-2"
        >
          <PanelRight className="w-5 h-5" />
          <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
            Documentos
          </span>
        </button>
      </div>
    );
  }

  // Logic to stack sidebars if both are open
  // If Tools is open (otherSidebarOpen), Docs should be at left of Tools
  // So right = otherSidebarWidth
  // But wait, what if Docs was opened first?
  // Let's assume a fixed z-order or simple stacking: Tools is "outer", Docs is "inner" or vice versa?
  // Or just always: Tools at 0, Docs at ToolsWidth?
  // If both are open, one must be shifted.
  // Let's say we shift THIS sidebar if the OTHER is open.
  // But both see "otherSidebarOpen". If both are open, both shift? No.
  // We need to decide which one stays at right: 0.
  // Let's say Tools stays at 0 (base), Docs shifts if Tools is open.
  // And Tools shifts if Docs is open?
  // This causes infinite loop if we aren't careful or they both shift away.
  
  // Better approach:
  // If Tools is Open: Tools at 0. Docs at ToolsWidth.
  // If Docs is Open AND Tools Closed: Docs at 0.
  // This implies Tools has precedence?
  // Or purely based on state passed from parent.
  // But here we only know "otherSidebarOpen". We don't know "which one is left/right".
  
  // Let's stick to the current logic: 
  // If `otherSidebarOpen`, shift `this` sidebar.
  // But if `other` logic also says "If this is open, shift me", they both shift.
  // We need asymmetric logic or passed positions.
  
  // Let's make Tools the "primary" (rightmost) and Docs "secondary" (inner) when both open.
  // So in ToolsSidebar: right = 0 always (or maybe shifted by Docs if we want Docs on right).
  // Let's say Docs is ALWAYS shifted by ToolsWidth if Tools is open.
  // Tools is NEVER shifted by DocsWidth.
  // This means Tools covers the right edge. Docs appears to the left of Tools.
  
  // In ToolsSidebar (previous file), I set right = otherSidebarOpen ? width : 0.
  // That would mean if Docs is open, Tools shifts left.
  // If I do the same here, and both are open, both shift left? That leaves a gap at right:0.
  // Not what we want.
  
  // Correct logic for "Tools at Right Edge, Docs to its Left":
  // ToolsSidebar: right = 0.
  // DocumentsSidebar: right = toolsSidebarOpen ? toolsSidebarWidth : 0.
  
  // Let's check what I wrote in ToolsSidebar.
  // I wrote: `const panelRight = otherSidebarOpen ? ${otherSidebarWidth}px : '0';`
  // That means Tools shifts if Docs is open.
  
  // If I want them to stack properly, one must anchor.
  // Let's decide: Tools is the anchor (Rightmost).
  // So ToolsSidebar should have right: 0 always? 
  // If I want to allow user to toggle them and they just stack.
  // Let's change ToolsSidebar to right: 0.
  // And DocsSidebar to right: toolsOpen ? toolsWidth : 0.
  
  // Wait, I can't re-edit ToolsSidebar easily in this turn without a new tool call or re-doing it.
  // I already sent `find_replace` for ToolsSidebar.
  // In that replace, I set: `const panelRight = otherSidebarOpen ? ... : '0';`
  
  // If Tools shifts when Docs is open.
  // And Docs shifts when Tools is open.
  // Then when both open:
  // Tools is at DocsWidth.
  // Docs is at ToolsWidth.
  // Gap at 0? No, Docs is at ToolsWidth (from right edge). Tools is at DocsWidth (from right edge).
  // If widths are same (120), they are both at 120px. They overlap at 120px. 0-120px is empty.
  // That is bad.
  
  // I need to correct this.
  // I should update ToolsSidebar to be `right: 0` always (ignoring other sidebar).
  // And DocsSidebar to be `right: otherSidebarOpen ? otherSidebarWidth : 0`.
  // OR vice versa.
  
  // Let's correct ToolsSidebar in a moment.
  // For DocumentsSidebar, let's make it the "inner" one.
  // right = otherSidebarOpen ? otherSidebarWidth : 0.
  
  const panelRight = otherSidebarOpen ? `${otherSidebarWidth}px` : '0';

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
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-green-50">
            <span className="text-xs font-medium text-green-900">Documentos</span>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-green-100 p-1.5 rounded transition-colors duration-200 text-green-900"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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