import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, Printer, Download, FileSpreadsheet, Calendar, 
  Users, Stethoscope, Building2, Search, FileOutput 
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import PermissionGuard from "@/components/PermissionGuard";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("atendimentos");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const printRef = useRef(null);

  // Load Data based on tab and dates
  useEffect(() => {
    loadReportData();
  }, [activeTab, startDate, endDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      let fetchedData = [];

      if (activeTab === "atendimentos") {
        const anamneses = await base44.entities.Anamnesis.list();
        fetchedData = anamneses.filter(a => {
          const d = new Date(a.data_consulta);
          return d >= start && d <= end;
        }).map(a => ({
          id: a.id,
          date: a.data_consulta,
          time: a.horario_consulta,
          patient: a.patient_name,
          doctor: a.creator_id, // Need to fetch doctor name if possible, or user cache
          type: "Consulta",
          status: a.is_cancelled ? "Cancelado" : "Realizado"
        }));
      } 
      else if (activeTab === "agendamentos") {
        const agendamentos = await base44.entities.Agendamento.list();
        fetchedData = agendamentos.filter(a => {
          const d = new Date(a.data_agendamento);
          return d >= start && d <= end;
        }).map(a => ({
          id: a.id,
          date: a.data_agendamento,
          time: a.horario_inicio,
          patient: a.patient_name,
          professional: a.professional_name || a.professional_id,
          status: a.status,
          type: a.tipo
        }));
      }
      else if (activeTab === "produtividade") {
        // Aggregate by professional
        const anamneses = await base44.entities.Anamnesis.list();
        const filtered = anamneses.filter(a => {
            const d = new Date(a.data_consulta);
            return d >= start && d <= end;
        });
        
        // Group by creator
        const groups = {};
        filtered.forEach(a => {
            const doc = a.creator_id || "Desconhecido"; // Ideally fetch user name
            if (!groups[doc]) groups[doc] = { count: 0, patients: new Set() };
            groups[doc].count++;
            groups[doc].patients.add(a.patient_id);
        });

        fetchedData = Object.entries(groups).map(([doc, stats]) => ({
            id: doc,
            name: doc, // Would need user lookup
            attendances: stats.count,
            uniquePatients: stats.patients.size
        }));
      }
      else if (activeTab === "convenios") {
         // Need patients with convenio info
         const patients = await base44.entities.Patient.list();
         const anamneses = await base44.entities.Anamnesis.list();
         
         const filteredAnamneses = anamneses.filter(a => {
             const d = new Date(a.data_consulta);
             return d >= start && d <= end;
         });

         const groups = {};
         filteredAnamneses.forEach(a => {
             const p = patients.find(pat => pat.id === a.patient_id);
             const conv = p?.convenio || "Particular/Sem Convênio";
             if (!groups[conv]) groups[conv] = { count: 0 };
             groups[conv].count++;
         });

         fetchedData = Object.entries(groups).map(([name, stats]) => ({
             id: name,
             name,
             count: stats.count
         }));
      }
      else if (activeTab === "pacientes") {
          const patients = await base44.entities.Patient.list();
          // Filter by search if exists, otherwise recent? Or all?
          // Reports usually list all or filtered.
          // Let's list all for now, client side filtering with 'patientSearch'
          fetchedData = patients;
      }

      setData(fetchedData);

    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    }
    setLoading(false);
  };

  // --- Export Functions ---

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    
    // Use html2canvas + jspdf
    try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`relatorio_${activeTab}_${startDate}.pdf`);
    } catch (e) {
        console.error("Erro ao gerar PDF", e);
        alert("Erro ao gerar PDF");
    }
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    
    // Get headers
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","),
        ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? "" : value)).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${activeTab}_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Prontuário Completo Logic ---
  const handleGenerateProntuario = async (patient) => {
      // 1. Fetch Patient Details
      // 2. Fetch All Anamneses (Anamnesis + Triage)
      // 3. Fetch All Documents
      // 4. Generate PDF
      
      try {
          alert("Gerando Prontuário Completo... Aguarde.");
          
          const anamneses = await base44.entities.Anamnesis.list();
          const patientAnamneses = anamneses
            .filter(a => a.patient_id === patient.id && !a.is_cancelled)
            .sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta));

          const docs = await base44.entities.MedicalDocument.list();
          const patientDocs = docs.filter(d => d.patient_name === patient.nome); // Weak link by name? Should filter by something better if possible, but entity only has patient_name in schema context. Assuming patient_name is unique or we accept this limitation. Ideally MedicalDocument should have patient_id.
          
          // Create a new PDF
          const pdf = new jsPDF();
          let y = 20;

          // Header
          pdf.setFontSize(18);
          pdf.text("Prontuário Médico Completo", 105, y, { align: "center" });
          y += 15;

          // Patient Info
          pdf.setFontSize(12);
          pdf.text(`Paciente: ${patient.nome}`, 20, y);
          y += 7;
          pdf.text(`CPF: ${patient.cpf || 'N/A'} | DN: ${patient.data_nascimento ? format(new Date(patient.data_nascimento), 'dd/MM/yyyy') : 'N/A'}`, 20, y);
          y += 7;
          pdf.text(`Convênio: ${patient.convenio || 'Particular'}`, 20, y);
          y += 15;
          pdf.line(20, y, 190, y);
          y += 10;

          // History
          pdf.setFontSize(14);
          pdf.text("Histórico de Atendimentos", 20, y);
          y += 10;

          patientAnamneses.forEach((a, index) => {
              if (y > 270) { pdf.addPage(); y = 20; }
              
              pdf.setFontSize(11);
              pdf.setFont(undefined, 'bold');
              pdf.text(`${format(new Date(a.data_consulta), 'dd/MM/yyyy')} - ${a.horario_consulta || ''} (Dr. ID: ${a.creator_id})`, 20, y);
              y += 7;
              
              pdf.setFont(undefined, 'normal');
              pdf.setFontSize(10);
              
              if (a.triagem_queixa || a.triagem_pa) {
                   pdf.text(`Triagem: PA: ${a.triagem_pa || '-'} | Temp: ${a.triagem_temperatura || '-'} | Peso: ${a.triagem_peso || '-'}`, 25, y);
                   y += 5;
                   if (a.triagem_queixa) {
                       pdf.text(`Queixa: ${a.triagem_queixa}`, 25, y);
                       y += 5;
                   }
              }

              if (a.texto_original) {
                  const splitText = pdf.splitTextToSize(`Resumo: ${a.texto_original}`, 170);
                  pdf.text(splitText, 25, y);
                  y += (splitText.length * 5) + 5;
              }
              
              // Documents for this attendance?
              // Logic to match documents to attendance might be date based
              const attDocs = patientDocs.filter(d => d.data_consulta === a.data_consulta);
              if (attDocs.length > 0) {
                  pdf.text("Documentos Emitidos:", 25, y);
                  y += 5;
                  attDocs.forEach(d => {
                      pdf.text(`- ${d.tipo.toUpperCase()}`, 30, y);
                      y += 5;
                  });
              }

              y += 5; // Spacer
          });

          pdf.save(`prontuario_${patient.nome.replace(/\s+/g, '_')}.pdf`);

      } catch (e) {
          console.error("Erro ao gerar prontuário", e);
          alert("Erro ao gerar prontuário");
      }
  };

  // --- Render Helpers ---

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Relatórios e Estatísticas
          </h1>
          <p className="text-gray-500">Exportação e visualização de dados do sistema.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={handlePrint} title="Imprimir">
             <Printer className="w-4 h-4" />
           </Button>
           <Button variant="outline" onClick={handleExportPDF} title="Baixar PDF">
             <Download className="w-4 h-4" />
           </Button>
           <Button variant="outline" onClick={handleExportCSV} title="Exportar CSV">
             <FileSpreadsheet className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div>
                 <Label>Período Inicial</Label>
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
             </div>
             <div>
                 <Label>Período Final</Label>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
             </div>
             <div className="md:col-span-2">
                {activeTab === 'pacientes' && (
                    <div>
                        <Label>Buscar Paciente</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input 
                                placeholder="Nome ou CPF..." 
                                className="pl-8"
                                value={patientSearch}
                                onChange={e => setPatientSearch(e.target.value)}
                            />
                        </div>
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* Printable Content Area */}
      <div ref={printRef} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden min-h-[500px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50 px-4 pt-2 print:hidden">
                <TabsList className="bg-transparent h-auto p-0 gap-6">
                    <TabsTrigger value="atendimentos" className="data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-b-0 border border-transparent rounded-t-lg px-4 py-2 text-gray-600 data-[state=active]:text-blue-600 shadow-none">
                        <Stethoscope className="w-4 h-4 mr-2" /> Atendimentos
                    </TabsTrigger>
                    <TabsTrigger value="agendamentos" className="data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-b-0 border border-transparent rounded-t-lg px-4 py-2 text-gray-600 data-[state=active]:text-blue-600 shadow-none">
                        <Calendar className="w-4 h-4 mr-2" /> Agendamentos
                    </TabsTrigger>
                    <TabsTrigger value="produtividade" className="data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-b-0 border border-transparent rounded-t-lg px-4 py-2 text-gray-600 data-[state=active]:text-blue-600 shadow-none">
                        <Users className="w-4 h-4 mr-2" /> Produtividade
                    </TabsTrigger>
                    <TabsTrigger value="convenios" className="data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-b-0 border border-transparent rounded-t-lg px-4 py-2 text-gray-600 data-[state=active]:text-blue-600 shadow-none">
                        <Building2 className="w-4 h-4 mr-2" /> Convênios
                    </TabsTrigger>
                    <TabsTrigger value="pacientes" className="data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-b-0 border border-transparent rounded-t-lg px-4 py-2 text-gray-600 data-[state=active]:text-blue-600 shadow-none">
                        <Users className="w-4 h-4 mr-2" /> Pacientes & Prontuários
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="p-6">
                <div className="mb-4 text-center hidden print:block">
                    <h2 className="text-2xl font-bold">Relatório de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                    <p className="text-gray-500">Período: {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}</p>
                </div>

                {loading ? (
                    <div className="text-center py-10">Carregando dados...</div>
                ) : (
                    <>
                        <TabsContent value="atendimentos" className="mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{format(new Date(row.date), 'dd/MM/yyyy')} {row.time}</TableCell>
                                            <TableCell>{row.patient}</TableCell>
                                            <TableCell>{row.doctor}</TableCell>
                                            <TableCell>{row.status}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">Nenhum registro encontrado.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="agendamentos" className="mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{format(new Date(row.date), 'dd/MM/yyyy')} {row.time}</TableCell>
                                            <TableCell>{row.patient}</TableCell>
                                            <TableCell>{row.professional}</TableCell>
                                            <TableCell>{row.type}</TableCell>
                                            <TableCell>{row.status}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">Nenhum registro encontrado.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        
                        <TabsContent value="produtividade" className="mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead>Atendimentos Realizados</TableHead>
                                        <TableHead>Pacientes Únicos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell>{row.attendances}</TableCell>
                                            <TableCell>{row.uniquePatients}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">Nenhum registro encontrado.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="convenios" className="mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Convênio</TableHead>
                                        <TableHead>Quantidade de Atendimentos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && <TableRow><TableCell colSpan={2} className="text-center">Nenhum registro encontrado.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="pacientes" className="mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>CPF</TableHead>
                                        <TableHead>Data Nasc.</TableHead>
                                        <TableHead>Convênio</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data
                                      .filter(p => p.nome?.toLowerCase().includes(patientSearch.toLowerCase()) || p.cpf?.includes(patientSearch))
                                      .slice(0, 50) // Limit display
                                      .map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{row.nome}</TableCell>
                                            <TableCell>{row.cpf}</TableCell>
                                            <TableCell>{row.data_nascimento ? format(new Date(row.data_nascimento), 'dd/MM/yyyy') : '-'}</TableCell>
                                            <TableCell>{row.convenio}</TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm" 
                                                  className="text-blue-600 hover:bg-blue-50"
                                                  onClick={() => handleGenerateProntuario(row)}
                                                >
                                                    <FileOutput className="w-4 h-4 mr-2" />
                                                    Prontuário Completo (PDF)
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">Nenhum registro encontrado.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                            <p className="text-xs text-gray-500 mt-4 text-center">Exibindo os primeiros 50 resultados. Use a busca para filtrar.</p>
                        </TabsContent>
                    </>
                )}
            </div>
        </Tabs>
      </div>
      
      <style>{`
        @media print {
            body * {
                visibility: hidden;
            }
            .print\\:block {
                display: block !important;
            }
            .print\\:hidden {
                display: none !important;
            }
            div[ref="printRef"], div[ref="printRef"] * {
                visibility: visible;
            }
            div[ref="printRef"] {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
        }
      `}</style>
    </div>
  );
}