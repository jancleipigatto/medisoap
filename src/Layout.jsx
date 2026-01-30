import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Stethoscope, Home, Plus, Users, FileText, LayoutTemplate, Shield, ClipboardList, FileCheck, Send, Trash2, PanelLeftClose, PanelLeft, Calculator, Pill, LogOut, UserCircle, Edit, Settings, Building2, Info, Calendar, X, Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Se o perfil não está completo, redireciona para completar
      if (currentUser && !currentUser.perfil_completo) {
        if (!window.location.pathname.includes("CompletarPerfil")) {
          window.location.href = createPageUrl("CompletarPerfil");
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
  };

  const navigationItems = [
    {
      title: "Início",
      url: createPageUrl("Home"),
      icon: Home,
      permission: "can_create_anamnesis"
    },
    {
      title: "Recepção",
      url: createPageUrl("Recepcao"),
      icon: Users,
      permission: "can_access_reception"
    },
    {
      title: "Triagem",
      url: createPageUrl("Triagem"),
      icon: Activity,
      permission: "can_perform_triage"
    },
    {
      title: "Novo Atendimento",
      url: createPageUrl("NewAnamnesis"),
      icon: Plus,
      permission: "can_create_anamnesis"
    },
    {
      title: "Histórico de Consultas",
      url: createPageUrl("History"),
      icon: FileText,
      permission: "can_create_anamnesis"
    },
    {
      title: "Ferramentas",
      url: createPageUrl("Tools"),
      icon: Calculator,
      permission: "can_create_anamnesis"
    },
    {
      title: "Agenda",
      url: createPageUrl("Agenda"),
      icon: Calendar,
      permission: "can_create_anamnesis"
    },
    {
      title: "Pacientes",
      url: createPageUrl("Patients"),
      icon: Users,
      permission: "can_access_patients"
    },
    {
      title: "Convênios",
      url: createPageUrl("ConvenioManagement"),
      icon: Building2,
      permission: "can_create_anamnesis"
    },
    {
      title: "Modelos Atendimento",
      url: createPageUrl("Templates"),
      icon: LayoutTemplate,
      permission: "can_access_templates"
    },
    {
      title: "Modelos Atestado",
      url: createPageUrl("AtestadoTemplates"),
      icon: ClipboardList,
      permission: "can_access_templates"
    },
    {
      title: "Modelos Exames",
      url: createPageUrl("ExameTemplates"),
      icon: FileCheck,
      permission: "can_access_templates"
    },
    {
      title: "Modelos Encaminhamento",
      url: createPageUrl("EncaminhamentoTemplates"),
      icon: Send,
      permission: "can_access_templates"
    },
    {
      title: "Modelos Receita",
      url: createPageUrl("ReceitaTemplates"),
      icon: Pill,
      permission: "can_access_templates"
    },
    {
      title: "Banco de Medicamentos",
      url: createPageUrl("MedicamentosDatabase"),
      icon: Pill,
      permission: "can_access_templates"
    },
    {
      title: "Banco de CIDs",
      url: createPageUrl("CIDManagement"),
      icon: FileText,
      permission: "can_access_templates"
    },
    {
      title: "Modelos Orientações",
      url: createPageUrl("OrientacoesTemplates"),
      icon: Info,
      permission: "can_access_templates"
    },

    {
      title: "Gerenciar Perfis",
      url: createPageUrl("ProfileManagement"),
      icon: Shield,
      masterOnly: true
    },
    {
      title: "Gerenciar Usuários",
      url: createPageUrl("UserManagement"),
      icon: Users, // Changed icon from Shield to Users as per outline
      masterOnly: true
    },
    {
      title: "Configurações",
      url: createPageUrl("Settings"),
      icon: Settings,
      permission: "can_create_anamnesis"
    },
    ];

  const hasPermission = (item) => {
    if (loading) return false;
    if (item.masterOnly) return user?.is_master === true;
    if (!item.permission) return true;
    // Apenas verificar permissão específica, não dar acesso automático para admin
    return user?.[item.permission] === true;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-indigo-50">
        {sidebarOpen && (
          <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-gray-100 p-1.5 rounded transition-colors duration-200"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex flex-col items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h2 className="font-bold text-gray-900 text-lg">MediSOAP</h2>
                <p className="text-xs text-gray-500">Anamneses Inteligentes</p>
              </div>
            </div>
            
            {/* User Profile Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.profile_type || 'Perfil Padrão'}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-gray-500">Perfil</p>
                    <p className="text-sm font-medium">{user.role === 'admin' ? 'Admin' : user.profile_type || 'Standard'}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("UserProfile")} className="flex items-center gap-2 cursor-pointer">
                      <Edit className="w-4 h-4" />
                      Atualizar Dados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.filter(hasPermission).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-blue-50 text-blue-700 font-medium' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        )}

        <main className="flex-1 flex flex-col">
          {!sidebarOpen && (
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[60]">
              <button
                onClick={() => setSidebarOpen(true)}
                className="bg-white shadow-lg p-3 rounded-r-lg hover:bg-gray-50 transition-colors duration-200 border-r border-t border-b border-gray-200"
              >
                <PanelLeft className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">MediSOAP</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}