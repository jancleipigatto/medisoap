import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PrintableDocument({ 
  tipo, 
  paciente, 
  dataConsulta, 
  conteudo, 
  cabecalho, 
  rodape, 
  logoUrl 
}) {
  return (
    <div className="printable-document bg-white p-8 max-w-[21cm] mx-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-document, .printable-document * {
            visibility: visible;
          }
          .printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
        }
      `}</style>

      {/* Cabeçalho com Logo */}
      <div className="flex items-start gap-4 mb-8 pb-4 border-b-2 border-gray-300">
        {logoUrl && (
          <div className="flex-shrink-0">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-[3cm] h-[3cm] object-contain"
            />
          </div>
        )}
        <div className="flex-1">
          {cabecalho ? (
            <div className="text-sm whitespace-pre-wrap">{cabecalho}</div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">DOCUMENTO MÉDICO</h2>
            </div>
          )}
        </div>
      </div>

      {/* Tipo de Documento */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">{tipo}</h1>
      </div>

      {/* Informações do Paciente */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <p className="text-sm"><strong>Paciente:</strong> {paciente}</p>
        <p className="text-sm"><strong>Data:</strong> {format(new Date(dataConsulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {/* Conteúdo do Documento */}
      <div className="mb-8 min-h-[10cm]">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{conteudo}</div>
      </div>

      {/* Rodapé */}
      {rodape && (
        <div className="mt-12 pt-4 border-t-2 border-gray-300">
          <div className="text-sm whitespace-pre-wrap text-center">{rodape}</div>
        </div>
      )}
    </div>
  );
}