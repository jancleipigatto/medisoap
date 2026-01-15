import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import FloatingTool from "./FloatingTool";

export default function GestationalAgeCalculator({ onClose, onSave }) {
  const [dum, setDum] = useState(""); // Data da última menstruação
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!dum) return;

    const dumDate = new Date(dum);
    const today = new Date();
    const diffTime = today - dumDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    // Calcular DPP (Data Provável do Parto) - Regra de Naegele
    const dpp = new Date(dumDate);
    dpp.setDate(dpp.getDate() + 280); // 40 semanas

    setResult({
      weeks,
      days,
      totalDays: diffDays,
      dpp: dpp.toLocaleDateString('pt-BR'),
      trimester: weeks < 13 ? "1º Trimestre" : weeks < 27 ? "2º Trimestre" : "3º Trimestre"
    });
  };

  const handleReset = () => {
    setDum("");
    setResult(null);
  };

  const handleSave = () => {
    if (!result) return;
    
    const text = `
IDADE GESTACIONAL
DUM: ${new Date(dum).toLocaleDateString('pt-BR')}
Idade Gestacional: ${result.weeks} semanas e ${result.days} dias
${result.trimester}
DPP (Data Provável do Parto): ${result.dpp}
`.trim();

    onSave(text);
  };

  return (
    <FloatingTool 
      tool={{ name: "Calculadora de Idade Gestacional" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="dum">Data da Última Menstruação (DUM)</Label>
          <Input
            id="dum"
            type="date"
            value={dum}
            onChange={(e) => setDum(e.target.value)}
            className="mt-2"
          />
        </div>

        <Button 
          onClick={calculate}
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
        >
          Calcular
        </Button>

        {result && (
          <div className="bg-pink-50 rounded-lg p-4 space-y-2 border border-pink-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-700">
                {result.weeks}s {result.days}d
              </p>
              <p className="text-sm text-gray-600 mt-1">{result.trimester}</p>
            </div>
            <div className="border-t border-pink-200 pt-3 space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Total:</span> {result.totalDays} dias
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">DPP:</span> {result.dpp}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Nova
          </Button>
          <Button
            onClick={handleSave}
            disabled={!result}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar na Anamnese
          </Button>
        </div>
      </div>
    </FloatingTool>
  );
}