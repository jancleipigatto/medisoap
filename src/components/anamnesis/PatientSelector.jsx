import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Search, Star, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PatientSelector({ selectedPatient, onSelect }) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
        loadInitialPatients();
    }
  }, [searchTerm, open]);

  // Debounce search
  useEffect(() => {
      const timer = setTimeout(() => {
          if (searchTerm) {
              searchPatients(searchTerm);
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadInitialPatients = async () => {
    setLoading(true);
    try {
        // Try to load favorites first
        const favs = await base44.entities.Patient.filter({ is_favorite: true }, "-nome", 10);
        
        // If few favorites, load recent
        if (favs.length < 10) {
            const recents = await base44.entities.Patient.list("-created_date", 20);
            // Merge unique
            const map = new Map();
            favs.forEach(p => map.set(p.id, p));
            recents.forEach(p => {
                if (!map.has(p.id)) map.set(p.id, p);
            });
            setPatients(Array.from(map.values()));
        } else {
            setPatients(favs);
        }
    } catch (e) {
        console.error("Error loading patients", e);
    } finally {
        setLoading(false);
    }
  };

  const searchPatients = async (term) => {
    setLoading(true);
    try {
        // Search using regex for partial match
        const results = await base44.entities.Patient.filter({ nome: { $regex: term, $options: 'i' } }, "nome", 20);
        setPatients(results);
    } catch (e) {
        console.error("Search failed", e);
    } finally {
        setLoading(false);
    }
  };

  const toggleFavorite = async (patient, e) => {
    e.stopPropagation();
    try {
        await base44.entities.Patient.update(patient.id, { is_favorite: !patient.is_favorite });
        // Update local state without reload
        setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, is_favorite: !p.is_favorite } : p));
    } catch(e) {
        console.error("Error toggling favorite", e);
    }
  };
  
  // Use patients directly as they are now filtered from backend
  const filteredPatients = patients;

  const handleSelect = (patient) => {
    onSelect(patient);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div>
      <Label htmlFor="patient">Paciente *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="patient"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal"
          >
            {selectedPatient ? (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>{selectedPatient.nome}</span>
                {selectedPatient.is_favorite && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            ) : (
              <span className="text-gray-500">Selecione um paciente</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            {loading ? (
                 <div className="flex items-center justify-center h-full p-8">
                     <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                 </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum paciente encontrado</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {patient.nome}
                        </p>
                        {patient.is_favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {patient.convenio && (
                        <p className="text-xs text-gray-500 truncate">
                          {patient.convenio}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(patient, e)}
                      className="flex-shrink-0 hover:scale-110 transition-transform p-1"
                    >
                      {patient.is_favorite ? (
                        <span className="text-yellow-500 text-xl">★</span>
                      ) : (
                        <span className="text-gray-300 text-xl hover:text-yellow-400">☆</span>
                      )}
                    </button>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}