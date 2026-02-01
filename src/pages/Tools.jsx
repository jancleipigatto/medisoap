import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Baby, Activity, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GestationalAgeCalculator from "../components/tools/GestationalAgeCalculator";
import BMICalculator from "../components/tools/BMICalculator";
import AlvaradoScore from "../components/tools/AlvaradoScore";
import CardiacRiskCalculator from "../components/tools/CardiacRiskCalculator";
import GFRCalculator from "../components/tools/GFRCalculator";
import SimpleCalculator from "../components/tools/SimpleCalculator";
import { AnimatePresence } from "framer-motion";

export default function Tools() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState(null);
  const [results, setResults] = useState([]);

  const tools = [
    {
      id: "gestational_age",
      name: "Idade Gestacional",
      description: "Calcular idade gestacional e DPP",
      icon: Baby,
      color: "from-pink-500 to-rose-600"
    },
    {
      id: "bmi",
      name: "IMC",
      description: "Calcular Índice de Massa Corporal",
      icon: Activity,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "cardiac_risk",
      name: "Risco Cardíaco",
      description: "Risco cardiovascular (Framingham)",
      icon: Heart,
      color: "from-red-500 to-pink-600"
    },
    {
      id: "alvarado",
      name: "Escala Alvarado",
      description: "Probabilidade de apendicite",
      icon: Activity,
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "gfr",
      name: "Taxa Filtração",
      description: "Filtração Glomerular (CKD-EPI)",
      icon: Activity,
      color: "from-emerald-500 to-green-600"
    },
    {
      id: "calculator",
      name: "Calculadora",
      description: "Calculadora simples",
      icon: Calculator,
      color: "from-purple-500 to-indigo-600"
    }
  ];

  const handleToolSave = (result) => {
    setResults([{ text: result, timestamp: new Date() }, ...results]);
    setActiveTool(null);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ferramentas Médicas</h1>
            <p className="text-gray-600 mt-1">Calculadoras e ferramentas auxiliares</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => !tool.disabled && setActiveTool(tool.id)}
              disabled={tool.disabled}
              className="text-left group"
            >
              <Card className={`hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-none overflow-hidden h-full ${tool.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4 ${!tool.disabled && 'group-hover:scale-110'} transition-transform duration-300 shadow-lg`}>
                    <tool.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {tool.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Histórico de Cálculos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    {result.timestamp.toLocaleString('pt-BR')}
                  </p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {result.text}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <AnimatePresence>
        {activeTool === 'gestational_age' && (
          <GestationalAgeCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'bmi' && (
          <BMICalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'alvarado' && (
          <AlvaradoScore 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'cardiac_risk' && (
          <CardiacRiskCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'gfr' && (
          <GFRCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'calculator' && (
          <SimpleCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}