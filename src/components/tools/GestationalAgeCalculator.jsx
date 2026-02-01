import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FloatingTool from "./FloatingTool";

export default function GestationalAgeCalculator({ onClose, onSave }) {
  const [method, setMethod] = useState("dum"); // "dum" or "usg"
  const [dum, setDum] = useState("");
  const [usgDate, setUsgDate] = useState("");
  const [usgWeeks, setUsgWeeks] = useState("");
  const [usgDays, setUsgDays] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    let weeks = 0;
    let days = 0;
    let dppDate = null;
    let methodUsed = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (method === "dum") {
      if (!dum) return;
      const dumDate = new Date(dum);
      dumDate.setHours(0, 0, 0, 0);
      
      const diffTime = today - dumDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      weeks = Math.floor(diffDays / 7);
      days = diffDays % 7;
      
      // Naegele's rule
      dppDate = new Date(dumDate);
      dppDate.setDate(dppDate.getDate() + 280);
      methodUsed = "DUM";
    } else {
      if (!usgDate || usgWeeks === "") return;
      
      const usgDateObj = new Date(usgDate);
      usgDateObj.setHours(0, 0, 0, 0);
      
      const diffTime = today - usgDateObj;
      const diffDaysSinceUsg = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const gaAtUsgDays = (parseInt(usgWeeks) * 7) + (parseInt(usgDays) || 0);
      const currentTotalDays = gaAtUsgDays + diffDaysSinceUsg;
      
      weeks = Math.floor(currentTotalDays / 7);
      days = currentTotalDays % 7;
      
      // DPP based on USG
      // Total pregnancy is 280 days
      const daysRemaining = 280 - gaAtUsgDays;
      dppDate = new Date(usgDateObj);
      dppDate.setDate(dppDate.getDate() + daysRemaining);
      methodUsed = "USG";
    }

    setResult({
      weeks,
      days,
      dpp: dppDate.toLocaleDateString('pt-BR'),
      trimester: weeks < 13 ? "1º Trimestre" : weeks < 27 ? "2º Trimestre" : "3º Trimestre",
      method: methodUsed
    });
  };

  const handleReset = () => {
    setDum("");
    setUsgDate("");
    setUsgWeeks("");
    setUsgDays("");
    setResult(null);
  };

  const handleSave = () => {
    if (!result) return;
    
    let details = "";
    if (result.method === "DUM") {
      details = `DUM: ${new Date(dum).toLocaleDateString('pt-BR')}`;
    } else {
      details = `USG em: ${new Date(usgDate).toLocaleDateString('pt-BR')} com ${usgWeeks}s ${usgDays || 0}d`;
    }

    const text = `
IDADE GESTACIONAL (${result.method})
${details}
Idade Atual: ${result.weeks} semanas e ${result.days} dias
${result.trimester}
DPP: ${result.dpp}
`.trim();

    onSave(text);
  };

  return (
    <FloatingTool 
      tool={{ name: "Idade Gestacional" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="flex justify-center pb-2">
          <RadioGroup 
            defaultValue="dum" 
            value={method} 
            onValueChange={setMethod}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dum" id="r1" />
              <Label htmlFor="r1">Por DUM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="usg" id="r2" />
              <Label htmlFor="r2">Por USG</Label>
            </div>
          </RadioGroup>
        </div>

        {method === "dum" ? (
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
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="usg-date">Data do Exame (USG)</Label>
              <Input
                id="usg-date"
                type="date"
                value={usgDate}
                onChange={(e) => setUsgDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="usg-weeks" className="text-xs">Semanas (no exame)</Label>
                <Input
                  id="usg-weeks"
                  type="number"
                  min="0"
                  max="45"
                  placeholder="0"
                  value={usgWeeks}
                  onChange={(e) => setUsgWeeks(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="usg-days" className="text-xs">Dias (no exame)</Label>
                <Input
                  id="usg-days"
                  type="number"
                  min="0"
                  max="6"
                  placeholder="0"
                  value={usgDays}
                  onChange={(e) => setUsgDays(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={calculate}
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
        >
          Calcular
        </Button>

        {result && (
          <div className="bg-pink-50 rounded-lg p-4 space-y-2 border border-pink-200 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-700">
                {result.weeks}s {result.days}d
              </p>
              <p className="text-sm text-gray-600 mt-1">{result.trimester}</p>
            </div>
            <div className="border-t border-pink-200 pt-3 text-center">
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