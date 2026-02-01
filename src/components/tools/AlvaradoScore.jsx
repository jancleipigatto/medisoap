import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import FloatingTool from "./FloatingTool";

export default function AlvaradoScore({ onClose, onSave }) {
  const [scores, setScores] = useState({
    migration: false, // 1
    anorexia: false, // 1
    nausea: false, // 1
    tenderness: false, // 2
    rebound: false, // 1
    temp: false, // 1
    leukocytosis: false, // 2
    shift: false // 1
  });

  const [totalScore, setTotalScore] = useState(0);

  const items = [
    { id: "migration", label: "Migração da dor para QID", points: 1 },
    { id: "anorexia", label: "Anorexia (perda de apetite)", points: 1 },
    { id: "nausea", label: "Náuseas e/ou vômitos", points: 1 },
    { id: "tenderness", label: "Dor à palpação em QID", points: 2 },
    { id: "rebound", label: "Descompressão brusca dolorosa", points: 1 },
    { id: "temp", label: "Elevação da temperatura (> 37.3°C)", points: 1 },
    { id: "leukocytosis", label: "Leucocitose (> 10.000)", points: 2 },
    { id: "shift", label: "Desvio à esquerda (neutrofilia)", points: 1 },
  ];

  const updateScore = (id, checked) => {
    const newScores = { ...scores, [id]: checked };
    setScores(newScores);
    
    const total = items.reduce((acc, item) => {
      return acc + (newScores[item.id] ? item.points : 0);
    }, 0);
    setTotalScore(total);
  };

  const getInterpretation = (score) => {
    if (score <= 3) return "Baixa probabilidade de apendicite (0-3)";
    if (score <= 6) return "Possível apendicite (4-6) - Observação/Exames";
    return "Alta probabilidade de apendicite (7-10) - Cirurgia provável";
  };

  const getColor = (score) => {
    if (score <= 3) return "bg-green-50 text-green-700 border-green-200";
    if (score <= 6) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const handleReset = () => {
    setScores({
      migration: false,
      anorexia: false,
      nausea: false,
      tenderness: false,
      rebound: false,
      temp: false,
      leukocytosis: false,
      shift: false
    });
    setTotalScore(0);
  };

  const handleSave = () => {
    const activeItems = items.filter(i => scores[i.id]);
    const text = `
ESCOLA DE ALVARADO (APENDICITE)
Pontuação: ${totalScore} pontos
Interpretação: ${getInterpretation(totalScore)}

Critérios Presentes:
${activeItems.map(i => `- ${i.label} (+${i.points})`).join('\n')}
`.trim();

    onSave(text);
  };

  return (
    <FloatingTool 
      tool={{ name: "Escala de Alvarado" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
              <Checkbox 
                id={item.id} 
                checked={scores[item.id]}
                onCheckedChange={(checked) => updateScore(item.id, checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label 
                  htmlFor={item.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {item.label}
                </Label>
                <span className="text-xs text-muted-foreground">
                  +{item.points} ponto{item.points > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={`rounded-lg p-4 border ${getColor(totalScore)} text-center transition-colors duration-300`}>
          <p className="text-3xl font-bold mb-1">{totalScore}</p>
          <p className="text-sm font-medium">{getInterpretation(totalScore)}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </FloatingTool>
  );
}