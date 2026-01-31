import { 
  Plus, 
  Users, 
  LayoutTemplate, 
  ClipboardList, 
  FileCheck, 
  Send, 
  FileText, 
  Settings, 
  Calculator, 
  Pill, 
  Info, 
  Activity,
  Stethoscope,
  Calendar
} from "lucide-react";
import { createPageUrl } from "@/utils";

export const ALL_DASHBOARD_ITEMS = {
  recepcao: {
    id: "recepcao",
    title: "Recepção",
    description: "Gerenciar chegada de pacientes",
    icon: Users,
    url: createPageUrl("Recepcao"),
    color: "from-blue-500 to-cyan-600",
    permission: "can_access_reception"
  },
  consulta: {
    id: "consulta",
    title: "Consulta",
    description: "Atendimentos e Consultas",
    icon: Stethoscope,
    url: createPageUrl("Consulta"),
    color: "from-indigo-500 to-purple-600",
    permission: "can_create_anamnesis"
  },
  triagem: {
    id: "triagem",
    title: "Triagem",
    description: "Realizar triagem de sinais vitais",
    icon: Activity,
    url: createPageUrl("Triagem"),
    color: "from-green-500 to-emerald-600",
    permission: "can_create_anamnesis"
  },
  new_anamnesis: {
    id: "new_anamnesis",
    title: "Novo Atendimento",
    description: "Criar nova consulta médica",
    icon: Plus,
    url: createPageUrl("NewAnamnesis"),
    color: "from-blue-500 to-indigo-600",
    permission: "can_create_anamnesis"
  },
  agenda: {
    id: "agenda",
    title: "Agenda",
    description: "Gerenciar agendamentos e horários",
    icon: Calendar,
    url: createPageUrl("Agenda"),
    color: "from-orange-500 to-amber-600",
    permission: "can_access_agenda"
  },
  history: {
    id: "history",
    title: "Histórico de Consultas",
    description: "Ver histórico de atendimentos",
    icon: FileText,
    url: createPageUrl("History"),
    color: "from-green-500 to-emerald-600",
    permission: "can_create_anamnesis"
  },
  tools: {
    id: "tools",
    title: "Ferramentas",
    description: "Calculadoras e ferramentas médicas",
    icon: Calculator,
    url: createPageUrl("Tools"),
    color: "from-cyan-500 to-blue-600",
    permission: "can_create_anamnesis"
  },
  atestados: {
    id: "atestados",
    title: "Atestados",
    description: "Emitir atestado médico",
    icon: ClipboardList,
    url: createPageUrl("NovoAtestado"),
    color: "from-amber-500 to-orange-600",
    permission: "can_access_templates"
  },
  exames_models: {
    id: "exames_models",
    title: "Exames",
    description: "Solicitar exames",
    icon: FileCheck,
    url: createPageUrl("NovoExame"),
    color: "from-emerald-500 to-teal-600",
    permission: "can_access_templates"
  },
  encaminhamentos: {
    id: "encaminhamentos",
    title: "Encaminhamentos",
    description: "Emitir encaminhamento",
    icon: Send,
    url: createPageUrl("NovoEncaminhamento"),
    color: "from-violet-500 to-purple-600",
    permission: "can_access_templates"
  },
  receitas: {
    id: "receitas",
    title: "Receitas",
    description: "Emitir receita médica",
    icon: Pill,
    url: createPageUrl("NovaReceita"),
    color: "from-pink-500 to-rose-600",
    permission: "can_access_templates"
  },
  patients: {
    id: "patients",
    title: "Pacientes",
    description: "Gerenciar cadastro de pacientes",
    icon: Users,
    url: createPageUrl("Patients"),
    color: "from-purple-500 to-pink-600",
    permission: "can_access_patients"
  },
  cid_management: {
    id: "cid_management",
    title: "Banco de CIDs",
    description: "Consultar base de dados CID-10",
    icon: FileText,
    url: createPageUrl("CIDManagement"),
    color: "from-indigo-500 to-blue-600",
    permission: "can_access_templates"
  },
  orientacoes: {
    id: "orientacoes",
    title: "Orientações",
    description: "Criar orientação ao paciente",
    icon: Info,
    url: createPageUrl("NovaOrientacao"),
    color: "from-cyan-500 to-teal-600",
    permission: "can_access_templates"
  },
  // Templates section
  templates: {
    id: "templates",
    title: "Modelos Anamnese",
    description: "Gerenciar modelos de anamnese",
    icon: LayoutTemplate,
    url: createPageUrl("Templates"),
    color: "from-indigo-500 to-purple-600",
    permission: "can_access_templates"
  },
  atestado: {
    id: "atestado",
    title: "Modelos Atestado",
    description: "Gerenciar modelos de atestado",
    icon: ClipboardList,
    url: createPageUrl("AtestadoTemplates"),
    color: "from-blue-500 to-cyan-600",
    permission: "can_access_templates"
  },
  exames: {
    id: "exames",
    title: "Modelos Exames",
    description: "Gerenciar modelos de exames",
    icon: FileCheck,
    url: createPageUrl("ExameTemplates"),
    color: "from-teal-500 to-green-600",
    permission: "can_access_templates"
  },
  encaminhamento: {
    id: "encaminhamento",
    title: "Modelos Encaminhamento",
    description: "Gerenciar modelos de encaminhamento",
    icon: Send,
    url: createPageUrl("EncaminhamentoTemplates"),
    color: "from-green-500 to-lime-600",
    permission: "can_access_templates"
  },
  receita_models: {
    id: "receita_models",
    title: "Modelos Receita",
    description: "Gerenciar modelos de receita",
    icon: Pill,
    url: createPageUrl("ReceitaTemplates"),
    color: "from-pink-500 to-rose-600",
    permission: "can_access_templates"
  },
  orientacoes_models: {
    id: "orientacoes_models",
    title: "Modelos Orientações",
    description: "Gerenciar modelos de orientações",
    icon: Info,
    url: createPageUrl("OrientacoesTemplates"),
    color: "from-teal-500 to-cyan-600",
    permission: "can_access_templates"
  }
};