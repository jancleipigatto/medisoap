import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
// Patient entity imported via base44 client
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, User, Phone, Mail, MapPin, Edit, ExternalLink, ArrowLeft, FileText } from "lucide-react";
import PatientFormDialog from "./PatientFormDialog";

export default function PatientsContent() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [convenios, setConvenios] = useState([]);
  const [paises, setPaises] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    cpf: "",
    telefone: "",
    email: "",
    nacionalidade: "Brasileira",
    convenio: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",
    endereco_cep: "",
    comorbidades: "",
    medicamentos_uso_continuo: "",
    observacoes: "",
    is_favorite: false
  });

  useEffect(() => {
    loadPatients();
    loadConvenios();
    loadPaises();
    
    // Verificar parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    const isNew = urlParams.get('new');
    
    if (isNew === 'true') {
      setShowForm(true);
    } else if (editId) {
      loadAndEditPatient(editId);
    }
  }, []);

  const loadAndEditPatient = async (id) => {
    try {
      const patient = await base44.entities.Patient.get(id);
      if (patient) {
        setEditingPatient(patient);
        setShowForm(true);
      }
    } catch (e) { console.error(e); }
  };

  const loadPatients = async () => {
    const data = await base44.entities.Patient.list("-created_date");
    setPatients(data);
  };

  const loadConvenios = async () => {
    const data = await base44.entities.Convenio.list("nome");
    setConvenios(data);
  };

  const loadPaises = async () => {
    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/paises');
      const data = await response.json();
      const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome));
      setPaises(sorted);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      nome: patient.nome || "",
      data_nascimento: patient.data_nascimento || "",
      cpf: patient.cpf || "",
      telefone: patient.telefone || "",
      email: patient.email || "",
      nacionalidade: patient.nacionalidade || "Brasileira",
      convenio: patient.convenio || "",
      endereco_rua: patient.endereco_rua || "",
      endereco_numero: patient.endereco_numero || "",
      endereco_complemento: patient.endereco_complemento || "",
      endereco_bairro: patient.endereco_bairro || "",
      endereco_cidade: patient.endereco_cidade || "",
      endereco_estado: patient.endereco_estado || "",
      endereco_cep: patient.endereco_cep || "",
      comorbidades: patient.comorbidades || "",
      medicamentos_uso_continuo: patient.medicamentos_uso_continuo || "",
      observacoes: patient.observacoes || "",
      is_favorite: patient.is_favorite || false
    });
    setShowForm(true);
  };

  const toggleFavorite = async (patient, e) => {
    e.stopPropagation(); // Prevent card edit from being triggered
    await base44.entities.Patient.update(patient.id, { is_favorite: !patient.is_favorite });
    loadPatients();
  };

  // handleSubmit removed (handled by PatientFormDialog)

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getFullAddress = (patient) => {
    const parts = [];
    if (patient.endereco_rua) parts.push(patient.endereco_rua);
    if (patient.endereco_numero) parts.push(patient.endereco_numero);
    if (patient.endereco_bairro) parts.push(patient.endereco_bairro);
    if (patient.endereco_cidade) parts.push(patient.endereco_cidade);
    if (patient.endereco_estado) parts.push(patient.endereco_estado);
    if (patient.endereco_cep) parts.push(`CEP: ${patient.endereco_cep}`);
    return parts.filter(Boolean).join(", ");
  };

  const getGoogleMapsUrl = (patient) => {
    const address = getFullAddress(patient);
    if (!address) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setFormData({
      nome: "",
      data_nascimento: "",
      cpf: "",
      telefone: "",
      email: "",
      nacionalidade: "Brasileira",
      convenio: "",
      endereco_rua: "",
      endereco_numero: "",
      endereco_complemento: "",
      endereco_bairro: "",
      endereco_cidade: "",
      endereco_estado: "",
      endereco_cep: "",
      comorbidades: "",
      medicamentos_uso_continuo: "",
      observacoes: "",
      is_favorite: false
    });
  };

  // Ordenar pacientes: favoritos primeiro
  const sortedPatients = [...patients].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return 0;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
            <p className="text-gray-600 mt-1">Gerencie o cadastro dos seus pacientes</p>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Button
            onClick={() => { setShowForm(true); setEditingPatient(null); }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Paciente
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPatients.map((patient) => {
            const mapsUrl = getGoogleMapsUrl(patient);
            return (
              <Card key={patient.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">{patient.nome}</CardTitle>
                        <button
                          onClick={(e) => toggleFavorite(patient, e)}
                          className="flex-shrink-0 hover:scale-110 transition-transform"
                          title={patient.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          {patient.is_favorite ? (
                            <span className="text-yellow-500 text-xl">★</span>
                          ) : (
                            <span className="text-gray-300 text-xl hover:text-yellow-400">☆</span>
                          )}
                        </button>
                      </div>
                      {patient.data_nascimento && (
                        <p className="text-sm text-gray-500 mt-1">
                          {calculateAge(patient.data_nascimento)} anos
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(createPageUrl(`PatientHistory?patientId=${patient.id}`))}
                        className="flex-shrink-0"
                        title="Ver histórico"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingPatient(patient); setShowForm(true); }}
                        className="flex-shrink-0"
                        title="Editar paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patient.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{patient.telefone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {mapsUrl && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2">{getFullAddress(patient)}</p>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1"
                        >
                          Abrir no mapa
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {patient.convenio && (
                    <div className="mt-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md inline-block">
                      {patient.convenio}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {patients.length === 0 && (
          <Card className="shadow-md border-none">
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum paciente cadastrado</h3>
              <p className="text-gray-500 mb-6">Comece adicionando seu primeiro paciente</p>
              <Button
                onClick={() => { setShowForm(true); setEditingPatient(null); }} // Clear editingPatient when adding new
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Paciente
              </Button>
            </CardContent>
          </Card>
        )}

        <PatientFormDialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingPatient(null);
          }}
          patientToEdit={editingPatient}
          onSuccess={() => {
            loadPatients();
          }}
        />
      </div>
    </div>
  );
}