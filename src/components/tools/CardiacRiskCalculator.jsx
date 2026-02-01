import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import FloatingTool from "./FloatingTool";

export default function CardiacRiskCalculator({ onClose, onSave }) {
  // Using Framinghan Score based on BMI (simplified office-based)
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [systolicBP, setSystolicBP] = useState(""); // Pressão Sistólica
  const [treatedBP, setTreatedBP] = useState(false); // Em tratamento para hipertensão?
  const [smoker, setSmoker] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [bmi, setBmi] = useState("");
  
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!age || !systolicBP || !bmi) return;

    // Simplified Framingham Risk Score (BMI-based)
    // Based on D'Agostino et al. 2008
    
    let points = 0;
    const ageNum = parseInt(age);
    const sbp = parseInt(systolicBP);
    const bmiNum = parseFloat(bmi);
    const isMale = gender === "male";

    // Logic is complex, using simplified approximation or look-up tables logic
    // Implementing Simplified Framingham (CV Risk 10 years)
    
    // Male Points
    if (isMale) {
      // Age
      if (ageNum >= 30 && ageNum <= 34) points += 0;
      else if (ageNum <= 39) points += 2;
      else if (ageNum <= 44) points += 5;
      else if (ageNum <= 49) points += 6;
      else if (ageNum <= 54) points += 8;
      else if (ageNum <= 59) points += 10;
      else if (ageNum <= 64) points += 11;
      else if (ageNum <= 69) points += 12;
      else if (ageNum <= 74) points += 14;
      else if (ageNum >= 75) points += 15;

      // BMI
      if (bmiNum < 25) points += 0;
      else if (bmiNum < 30) points += 1;
      else points += 2; // >= 30

      // SBP
      if (!treatedBP) {
        if (sbp < 120) points += 0;
        else if (sbp < 130) points += 0;
        else if (sbp < 140) points += 1;
        else if (sbp < 160) points += 2;
        else points += 3;
      } else {
        if (sbp < 120) points += 0;
        else if (sbp < 130) points += 1;
        else if (sbp < 140) points += 2;
        else if (sbp < 160) points += 2;
        else points += 3;
      }

      // Smoker
      if (smoker) points += 4; // Simplified constant (usually varies by age)

      // Diabetes
      if (diabetes) points += 3; // Simplified
      
    } else {
      // Female Points
      // Age
      if (ageNum >= 30 && ageNum <= 34) points += 0;
      else if (ageNum <= 39) points += 2;
      else if (ageNum <= 44) points += 4;
      else if (ageNum <= 49) points += 5;
      else if (ageNum <= 54) points += 7;
      else if (ageNum <= 59) points += 8;
      else if (ageNum <= 64) points += 9;
      else if (ageNum <= 69) points += 10;
      else if (ageNum <= 74) points += 11;
      else if (ageNum >= 75) points += 12;

      // BMI
      if (bmiNum < 25) points += 0;
      else if (bmiNum < 30) points += 0;
      else points += 1; // >= 30

      // SBP
      if (!treatedBP) {
        if (sbp < 120) points += 0;
        else if (sbp < 130) points += 1;
        else if (sbp < 140) points += 2;
        else if (sbp < 160) points += 3;
        else points += 4;
      } else {
        if (sbp < 120) points += 0;
        else if (sbp < 130) points += 2;
        else if (sbp < 140) points += 3;
        else if (sbp < 160) points += 4;
        else points += 5;
      }

      // Smoker
      if (smoker) points += 3; 

      // Diabetes
      if (diabetes) points += 4; 
    }

    // Risk calculation (approximate)
    let risk = 0;
    if (isMale) {
       if (points <= -2) risk = "< 1%";
       else if (points <= 3) risk = "1-2%";
       else if (points <= 6) risk = "3-4%";
       else if (points <= 9) risk = "5-9%";
       else if (points <= 12) risk = "10-15%";
       else if (points <= 14) risk = "16-20%";
       else if (points <= 16) risk = "21-25%";
       else risk = "> 30%";
    } else {
       if (points <= 2) risk = "< 1%";
       else if (points <= 6) risk = "1-2%";
       else if (points <= 8) risk = "3-4%";
       else if (points <= 11) risk = "5-9%";
       else if (points <= 13) risk = "10-15%";
       else if (points <= 15) risk = "16-20%";
       else if (points <= 17) risk = "21-25%";
       else risk = "> 30%";
    }

    setResult({
      points,
      risk
    });
  };

  const handleReset = () => {
    setAge("");
    setSystolicBP("");
    setBmi("");
    setTreatedBP(false);
    setSmoker(false);
    setDiabetes(false);
    setResult(null);
  };

  const handleSave = () => {
    if (!result) return;
    
    const text = `
RISCO CARDIOVASCULAR (Framingham Simplificado)
Idade: ${age} anos | Sexo: ${gender === 'male' ? 'M' : 'F'}
PAS: ${systolicBP} mmHg (${treatedBP ? 'Em tratamento' : 'Sem tratamento'})
IMC: ${bmi} kg/m²
Tabagista: ${smoker ? 'Sim' : 'Não'} | Diabético: ${diabetes ? 'Sim' : 'Não'}

Risco em 10 anos: ${result.risk}
`.trim();

    onSave(text);
  };

  return (
    <FloatingTool 
      tool={{ name: "Risco Cardiovascular (Framingham)" }} 
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
             <Label className="mb-2 block">Sexo</Label>
             <RadioGroup 
                value={gender} 
                onValueChange={setGender}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="male" id="cv-male" />
                  <Label htmlFor="cv-male">M</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="female" id="cv-female" />
                  <Label htmlFor="cv-female">F</Label>
                </div>
              </RadioGroup>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sbp">PA Sistólica</Label>
            <Input
              id="sbp"
              type="number"
              placeholder="mmHg"
              value={systolicBP}
              onChange={(e) => setSystolicBP(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bmi-cv">IMC</Label>
            <Input
              id="bmi-cv"
              type="number"
              step="0.1"
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
                <Checkbox id="treated" checked={treatedBP} onCheckedChange={setTreatedBP} />
                <Label htmlFor="treated" className="cursor-pointer">Em tratamento para Hipertensão</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="smoker" checked={smoker} onCheckedChange={setSmoker} />
                <Label htmlFor="smoker" className="cursor-pointer">Tabagista</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="diabetes" checked={diabetes} onCheckedChange={setDiabetes} />
                <Label htmlFor="diabetes" className="cursor-pointer">Diabético</Label>
            </div>
        </div>

        <Button 
          onClick={calculate}
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
        >
          Calcular Risco
        </Button>

        {result && (
          <div className="bg-red-50 rounded-lg p-4 space-y-2 border border-red-200 text-center">
             <p className="text-sm text-gray-600">Risco de evento cardiovascular em 10 anos</p>
             <p className="text-3xl font-bold text-red-700">{result.risk}</p>
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