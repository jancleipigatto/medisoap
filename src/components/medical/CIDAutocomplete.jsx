import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Star } from "lucide-react";

export default function CIDAutocomplete({ value, onSelect, placeholder = "Buscar CID..." }) {
  const [open, setOpen] = useState(false);
  const [cids, setCids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCIDs();
  }, []);

  const loadCIDs = async () => {
    setLoading(true);
    const data = await base44.entities.CID.list("-uso_frequente", 500);
    setCids(data);
    setLoading(false);
  };

  const filteredCIDs = cids.filter(
    (cid) =>
      cid.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cid.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCID = cids.find((cid) => cid.codigo === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCID ? (
            <span>
              <span className="font-mono font-bold text-blue-600">{selectedCID.codigo}</span>
              {" - "}
              <span className="text-sm">{selectedCID.descricao}</span>
            </span>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar por código ou descrição..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            autoFocus
          />
          <CommandEmpty>
            {loading ? "Carregando..." : "Nenhum CID encontrado."}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredCIDs.map((cid) => (
              <CommandItem
                key={cid.id}
                value={`${cid.codigo} ${cid.descricao}`}
                onSelect={() => {
                  onSelect(cid.codigo);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === cid.codigo ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-mono font-bold text-blue-600 min-w-[60px]">
                    {cid.codigo}
                  </span>
                  <span className="text-sm">{cid.descricao}</span>
                  {cid.uso_frequente && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 ml-auto" />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}