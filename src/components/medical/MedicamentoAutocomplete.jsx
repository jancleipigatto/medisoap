import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Pill } from "lucide-react";

export default function MedicamentoAutocomplete({ value, onChange, placeholder }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    loadMedicamentos();
  }, []);

  const loadMedicamentos = async () => {
    try {
      const { Medicamento } = await import("@/entities/Medicamento");
      const data = await Medicamento.list("-created_date");
      setMedicamentos(data);
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error);
    }
  };

  const getCurrentWord = (text, position) => {
    const beforeCursor = text.substring(0, position);
    const lastLineBreak = beforeCursor.lastIndexOf('\n');
    const currentLine = beforeCursor.substring(lastLineBreak + 1);
    
    // Pegar a última palavra/frase antes do cursor
    const words = currentLine.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    return currentWord;
  };

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newPosition);
    
    const currentWord = getCurrentWord(newValue, newPosition);
    
    if (currentWord.length >= 2) {
      const filtered = medicamentos.filter(med =>
        med.nome.toLowerCase().includes(currentWord.toLowerCase())
      );
      
      if (filtered.length > 0) {
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMedicamento = (med) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    
    const lastLineBreak = beforeCursor.lastIndexOf('\n');
    const currentLine = beforeCursor.substring(lastLineBreak + 1);
    const words = currentLine.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    const beforeWord = beforeCursor.substring(0, beforeCursor.length - currentWord.length);
    
    const medText = `${med.nome}${med.apresentacao ? ' - ' + med.apresentacao : ''}
${med.posologia || ''}${med.indicacao ? ' ' + med.indicacao : ''}`;
    
    const newValue = beforeWord + medText + afterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = beforeWord.length + medText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onFocus={(e) => {
          setCursorPosition(e.target.selectionStart);
        }}
        onClick={(e) => {
          setCursorPosition(e.target.selectionStart);
        }}
        placeholder={placeholder}
        className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      
      {showSuggestions && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 shadow-lg border-2 border-pink-200"
        >
          <CardContent className="p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {suggestions.map((med) => (
                <button
                  key={med.id}
                  onClick={() => insertMedicamento(med)}
                  className="w-full text-left p-3 hover:bg-pink-50 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Pill className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">
                          {med.nome}
                        </p>
                        {med.uso_frequente && (
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      {med.apresentacao && (
                        <p className="text-xs text-gray-600 mt-0.5">{med.apresentacao}</p>
                      )}
                      {med.posologia && (
                        <p className="text-xs text-gray-700 mt-1">{med.posologia}</p>
                      )}
                      {med.indicacao && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {med.indicacao}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}