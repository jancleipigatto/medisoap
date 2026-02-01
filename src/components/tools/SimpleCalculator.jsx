import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Delete } from "lucide-react";
import FloatingTool from "./FloatingTool";

export default function SimpleCalculator({ onClose, onSave }) {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleNumber = (num) => {
    if (display === "0" || shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    setShouldResetDisplay(true);
    setEquation(display + " " + op + " ");
  };

  const calculate = () => {
    try {
      // Basic evaluation safely
      // Replace x with * and ÷ with /
      const expr = (equation + display).replace(/x/g, "*").replace(/÷/g, "/");
      // eslint-disable-next-line no-eval
      const result = eval(expr); 
      
      // Limit decimals
      const finalResult = String(Math.round(result * 100000000) / 100000000);
      
      setDisplay(finalResult);
      setEquation("");
      setShouldResetDisplay(true);
    } catch (e) {
      setDisplay("Erro");
      setEquation("");
      setShouldResetDisplay(true);
    }
  };

  const handlePercentage = () => {
    try {
      const val = parseFloat(display);
      setDisplay(String(val / 100));
    } catch (e) {
      setDisplay("Erro");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setShouldResetDisplay(false);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleDot = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setShouldResetDisplay(false);
    }
  };

  const handleSave = () => {
    if (!display || display === "Erro") return;
    
    // Save current display value
    const text = `Cálculo: ${display}`;
    onSave(text);
  };

  const buttons = [
    { label: "C", onClick: handleClear, variant: "destructive", className: "col-span-1" },
    { label: "%", onClick: handlePercentage, variant: "secondary" },
    { label: "⌫", onClick: handleDelete, variant: "secondary" }, // Backspace
    { label: "÷", onClick: () => handleOperator("÷"), variant: "secondary", className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    
    { label: "7", onClick: () => handleNumber("7"), variant: "outline" },
    { label: "8", onClick: () => handleNumber("8"), variant: "outline" },
    { label: "9", onClick: () => handleNumber("9"), variant: "outline" },
    { label: "x", onClick: () => handleOperator("x"), variant: "secondary", className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    
    { label: "4", onClick: () => handleNumber("4"), variant: "outline" },
    { label: "5", onClick: () => handleNumber("5"), variant: "outline" },
    { label: "6", onClick: () => handleNumber("6"), variant: "outline" },
    { label: "-", onClick: () => handleOperator("-"), variant: "secondary", className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    
    { label: "1", onClick: () => handleNumber("1"), variant: "outline" },
    { label: "2", onClick: () => handleNumber("2"), variant: "outline" },
    { label: "3", onClick: () => handleNumber("3"), variant: "outline" },
    { label: "+", onClick: () => handleOperator("+"), variant: "secondary", className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    
    { label: "0", onClick: () => handleNumber("0"), variant: "outline", className: "col-span-2" },
    { label: ".", onClick: handleDot, variant: "outline" },
    { label: "=", onClick: calculate, variant: "default", className: "bg-indigo-600 hover:bg-indigo-700" },
  ];

  return (
    <FloatingTool 
      tool={{ name: "Calculadora" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        {/* Display */}
        <div className="bg-gray-100 p-4 rounded-lg text-right border border-gray-200 h-24 flex flex-col justify-end">
          <div className="text-gray-500 text-sm h-6">{equation}</div>
          <div className="text-3xl font-bold text-gray-900 overflow-hidden">{display}</div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn, index) => (
            <Button
              key={index}
              variant={btn.variant}
              onClick={btn.onClick}
              className={`text-lg h-12 font-medium ${btn.className || ""}`}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Resultado
          </Button>
        </div>
      </div>
    </FloatingTool>
  );
}