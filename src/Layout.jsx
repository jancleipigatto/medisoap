
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Stethoscope, Home, Plus, Users, FileText, LayoutTemplate, Shield, ClipboardList, FileCheck, Send, Trash2 } from "lucide-react";
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

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const navigationItems = [
    {
      title: "Início",
      url: createPageUrl("Home"),
      icon: Home,
      permission: "can_create_anamnesis"
    },
    {
      title: "Nova Anamnese",
      url: createPageUrl("NewAnamnesis"),
      icon: Plus,
      permission: "can_create_anamnesis"
    },
    {
      title: "Histórico",
      url: createPageUrl("History"),
      icon: FileText,
      permission: "can_create_anamnesis"
    },
    {
      title: "Pacientes",
      url: createPageUrl("Patients"),
      icon: Users,
      permission: "can_access_patients"
    },
    {
      title: "Modelos Anamnese",
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
      title: "Lixeira",
      url: createPageUrl("Trash"),
      icon: Trash2,
      permission: "can_create_anamnesis"
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
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">MediSOAP</h2>
                <p className="text-xs text-gray-500">Anamneses Inteligentes</p>
              </div>
            </div>
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

        <main className="flex-1 flex flex-col">
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
