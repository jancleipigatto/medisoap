import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FloatingTool from "./FloatingTool";

export default function GFRCalculator({ onClose, onSave }) {
  const [creatinine, setCreatinine] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [race, setRace] = useState("non-black");
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!creatinine || !age) return;

    const scr = parseFloat(creatinine);
    const ageNum = parseInt(age);
    const isFemale = gender === "female";
    const isBlack = race === "black";

    // CKD-EPI 2021 Formula
    // GFR = 142 x min(Scr/K, 1)^a x max(Scr/K, 1)^-1.200 x 0.9938^Age x 1.012 [if Female]
    
    // Constants
    const k = isFemale ? 0.7 : 0.9;
    const a = isFemale ? -0.241 : -0.302;
    
    const minRatio = Math.min(scr / k, 1);
    const maxRatio = Math.max(scr / k, 1);
    
    let gfr = 142 * Math.pow(minRatio, a) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, ageNum);
    
    if (isFemale) {
      gfr *= 1.012;
    }
    
    // Note: CKD-EPI 2021 removed race coefficient, but older versions use it.
    // The user asked for "Taxa de Filtração Renal", usually CKD-EPI.
    // If using 2009 version, black race has 1.159 factor. 
    // If using 2021 (Refit without race), race is ignored.
    // I'll stick to 2021 standard (No race adjustment recommended by NKF/ASN).
    // But I will keep the race input visible if they want MDRD or others later, 
    // but for now I will implement CKD-EPI 2021 which is the current recommendation.
    
    // Let's implement CKD-EPI 2009 just in case as it's still widely used in Brazil?
    // Actually, let's assume CKD-EPI 2021 as it's the gold standard now.
    // Wait, the formula I wrote above is 2021. 
    // 2021 formula does NOT use race.
    
    setResult({
      gfr: gfr.toFixed(1),
      stage: getStage(gfr)
    });
  };

  const getStage = (gfr) => {
    if (gfr >= 90) return "Estágio 1 (Normal ou Alto)";
    if (gfr >= 60) return "Estágio 2 (Levemente diminuído)";
    if (gfr >= 45) return "Estágio 3a (Leve a moderadamente diminuído)";
    if (gfr >= 30) return "Estágio 3b (Moderada a gravemente diminuído)";
    if (gfr >= 15) return "Estágio 4 (Gravemente diminuído)";
    return "Estágio 5 (Falência renal)";
  };

  const getColor = (gfr) => {
    if (gfr >= 60) return "bg-green-50 text-green-700 border-green-200";
    if (gfr >= 45) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (gfr >= 30) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const handleReset = () => {
    setCreatinine("");
    setAge("");
    setResult(null);
  };

  const handleSave = () => {
    if (!result) return;
    
    const text = `
TAXA DE FILTRAÇÃO GLOMERULAR (CKD-EPI 2021)
Creatinina: ${creatinine} mg/dL
Idade: ${age} anos
Sexo: ${gender === 'female' ? 'Feminino' : 'Masculino'}
TFGe: ${result.gfr} mL/min/1.73m²
Estágio: ${result.stage}
`.trim();

    onSave(text);
  };

  return (
    <FloatingTool 
      tool={{ name: "Taxa de Filtração Glomerular" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="creatinine">Creatinina Sérica (mg/dL)</Label>
          <Input
            id="creatinine"
            type="number"
            step="0.01"
            value={creatinine}
            onChange={(e) => setCreatinine(e.target.value)}
            className="mt-2"
            placeholder="Ex: 0.9"
          />
        </div>

        <div>
          <Label htmlFor="age">Idade (anos)</Label>
          <Input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-2"
            placeholder="Ex: 45"
          />
        </div>

        <div>
          <Label className="mb-2 block">Sexo</Label>
          <RadioGroup 
            value={gender} 
            onValueChange={setGender}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="g-male" />
              <Label htmlFor="g-male">Masculino</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="g-female" />
              <Label htmlFor="g-female">Feminino</Label>
            </div>
          </RadioGroup>
        </div>

        <Button 
          onClick={calculate}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Calcular TFGe
        </Button>

        {result && (
          <div className={`rounded-lg p-4 space-y-2 border ${getColor(result.gfr)} text-center`}>
            <div>
              <p className="text-3xl font-bold">
                {result.gfr}
              </p>
              <p className="text-xs opacity-80">mL/min/1.73m²</p>
            </div>
            <div className="border-t border-current/20 pt-2 mt-2">
              <p className="font-medium text-sm">
                {result.stage}
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
            Limpar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!result}
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