import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import FloatingTool from "./FloatingTool";

export default function BMICalculator({ onClose, onSave }) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!weight || !height) return;

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height) / 100; // converter cm para m
    const bmi = weightNum / (heightNum * heightNum);

    let classification = "";
    let color = "";

    if (bmi < 18.5) {
      classification = "Abaixo do peso";
      color = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (bmi < 25) {
      classification = "Peso normal";
      color = "text-green-700 bg-green-50 border-green-200";
    } else if (bmi < 30) {
      classification = "Sobrepeso";
      color = "text-yellow-700 bg-yellow-50 border-yellow-200";
    } else if (bmi < 35) {
      classification = "Obesidade Grau I";
      color = "text-orange-700 bg-orange-50 border-orange-200";
    } else if (bmi < 40) {
      classification = "Obesidade Grau II";
      color = "text-red-700 bg-red-50 border-red-200";
    } else {
      classification = "Obesidade Grau III";
      color = "text-red-900 bg-red-100 border-red-300";
    }

    setResult({
      bmi: bmi.toFixed(2),
      classification,
      color
    });
  };

  const handleReset = () => {
    setWeight("");
    setHeight("");
    setResult(null);
  };

  const handleSave = () => {
    if (!result) return;
    
    const text = `
ÍNDICE DE MASSA CORPORAL (IMC)
Peso: ${weight} kg
Altura: ${height} cm
IMC: ${result.bmi} kg/m²
Classificação: ${result.classification}
`.trim();

    onSave(text);
  };

  return (
    <FloatingTool 
      tool={{ name: "Calculadora de IMC" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ex: 70.5"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Ex: 165"
            className="mt-2"
          />
        </div>

        <Button 
          onClick={calculate}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          Calcular IMC
        </Button>

        {result && (
          <div className={`rounded-lg p-4 space-y-2 border ${result.color}`}>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {result.bmi}
              </p>
              <p className="text-xs text-gray-600 mt-1">kg/m²</p>
            </div>
            <div className="border-t pt-3 text-center">
              <p className="font-medium text-sm">
                {result.classification}
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