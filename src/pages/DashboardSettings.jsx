import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  GripVertical,
  Plus,
  Users,
  LayoutTemplate,
  ClipboardList,
  FileCheck,
  Send,
  Trash2,
  FileText,
  Settings,
  Eye,
  EyeOff,
  Calculator,
  Pill
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";

export default function DashboardSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dashboardItems, setDashboardItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState([]);

  const allMenuItems = {
    new_anamnesis: {
      id: "new_anamnesis",
      title: "Nova Anamnese",
      description: "Criar nova consulta",
      icon: Plus,
      color: "from-blue-500 to-indigo-600",
      permission: "can_create_anamnesis"
    },
    history: {
      id: "history",
      title: "Histórico",
      description: "Ver anamneses anteriores",
      icon: FileText,
      color: "from-green-500 to-emerald-600",
      permission: "can_create_anamnesis"
    },
    tools: {
      id: "tools",
      title: "Ferramentas",
      description: "Calculadoras médicas",
      icon: Calculator,
      color: "from-cyan-500 to-blue-600",
      permission: "can_create_anamnesis"
    },
    atestados: {
      id: "atestados",
      title: "Atestados",
      description: "Criar modelos de atestados",
      icon: ClipboardList,
      color: "from-amber-500 to-orange-600",
      permission: "can_access_templates"
    },
    exames_models: {
      id: "exames_models",
      title: "Exames",
      description: "Criar modelos de exames",
      icon: FileCheck,
      color: "from-emerald-500 to-teal-600",
      permission: "can_access_templates"
    },
    encaminhamentos: {
      id: "encaminhamentos",
      title: "Encaminhamentos",
      description: "Criar modelos de encaminhamento",
      icon: Send,
      color: "from-violet-500 to-purple-600",
      permission: "can_access_templates"
    },
    patients: {
      id: "patients",
      title: "Pacientes",
      description: "Gerenciar pacientes",
      icon: Users,
      color: "from-purple-500 to-pink-600",
      permission: "can_access_patients"
    },
    templates: {
      id: "templates",
      title: "Modelos Anamnese",
      description: "Templates de consulta",
      icon: LayoutTemplate,
      color: "from-indigo-500 to-purple-600",
      permission: "can_access_templates"
    },
    atestado: {
      id: "atestado",
      title: "Modelos Atestado",
      description: "Templates de atestado",
      icon: ClipboardList,
      color: "from-blue-500 to-cyan-600",
      permission: "can_access_templates"
    },
    exames: {
      id: "exames",
      title: "Modelos Exames",
      description: "Templates de exames",
      icon: FileCheck,
      color: "from-teal-500 to-green-600",
      permission: "can_access_templates"
    },
    encaminhamento: {
      id: "encaminhamento",
      title: "Modelos Encaminhamento",
      description: "Templates de encaminhamento",
      icon: Send,
      color: "from-green-500 to-lime-600",
      permission: "can_access_templates"
    },
    receita_models: {
      id: "receita_models",
      title: "Modelos Receita",
      description: "Templates de receita",
      icon: Pill,
      color: "from-pink-500 to-rose-600",
      permission: "can_access_templates"
    },
    receitas: {
      id: "receitas",
      title: "Receitas",
      description: "Criar receita médica",
      icon: Pill,
      color: "from-pink-500 to-rose-600",
      permission: "can_access_templates"
    },
    trash: {
      id: "trash",
      title: "Lixeira",
      description: "Anamneses excluídas",
      icon: Trash2,
      color: "from-red-500 to-orange-600",
      permission: "can_create_anamnesis"
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    const currentUser = await User.me();
    setUser(currentUser);
    
    // Inicializar com items salvos ou todos disponíveis
    const availableItems = Object.keys(allMenuItems).filter(key => 
      hasPermission(allMenuItems[key], currentUser)
    );
    
    if (currentUser.dashboard_items && currentUser.dashboard_items.length > 0) {
      // Filtrar apenas itens que o usuário ainda tem permissão
      const validItems = currentUser.dashboard_items.filter(item => 
        availableItems.includes(item)
      );
      setDashboardItems(validItems.map(id => allMenuItems[id]));
      
      // Itens ocultos são aqueles disponíveis mas não salvos
      const hidden = availableItems.filter(id => !validItems.includes(id));
      setHiddenItems(hidden.map(id => allMenuItems[id]));
    } else {
      setDashboardItems(availableItems.map(id => allMenuItems[id]));
      setHiddenItems([]);
    }
    
    setIsLoading(false);
  };

  const hasPermission = (item, userData = user) => {
    if (!userData) return false;
    if (item.adminOnly) return userData.role === 'admin';
    if (!item.permission) return true;
    return userData[item.permission] === true;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(dashboardItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDashboardItems(items);
  };

  const hideItem = (itemId) => {
    const item = dashboardItems.find(i => i.id === itemId);
    if (item) {
      setDashboardItems(items => items.filter(i => i.id !== itemId));
      setHiddenItems(items => [...items, item]);
    }
  };

  const showItem = (itemId) => {
    const item = hiddenItems.find(i => i.id === itemId);
    if (item) {
      setHiddenItems(items => items.filter(i => i.id !== itemId));
      setDashboardItems(items => [...items, item]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const visibleItems = dashboardItems.map(item => item.id);
    
    await User.updateMyUserData({ dashboard_items: visibleItems });
    setIsSaving(false);
    navigate(createPageUrl("Home"));
  };

  const resetToDefault = () => {
    const availableItems = Object.keys(allMenuItems).filter(key => 
      hasPermission(allMenuItems[key])
    );
    setDashboardItems(availableItems.map(id => allMenuItems[id]));
    setHiddenItems([]);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
              className="shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Personalizar Início</h1>
              <p className="text-gray-600 mt-1">Organize e escolha quais funcionalidades aparecem na tela inicial</p>
            </div>
          </div>

          <Card className="shadow-lg border-none mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Itens Visíveis
              </CardTitle>
              <p className="text-sm text-gray-500">
                Arraste para reordenar • Clique no ícone de olho para ocultar
              </p>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="dashboard-items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {dashboardItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-4 p-4 bg-white rounded-lg border-2 transition-all ${
                                snapshot.isDragging
                                  ? 'border-blue-400 shadow-lg'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <item.icon className="w-6 h-6 text-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                <p className="text-sm text-gray-500 truncate">{item.description}</p>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => hideItem(item.id)}
                                className="flex-shrink-0"
                                title="Ocultar item"
                              >
                                <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>

          {hiddenItems.length > 0 && (
            <Card className="shadow-lg border-none mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <EyeOff className="w-5 h-5" />
                  Itens Ocultos
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Clique no ícone de olho para tornar visível
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hiddenItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-100"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 opacity-50`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-600">{item.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{item.description}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => showItem(item.id)}
                        className="flex-shrink-0"
                        title="Mostrar item"
                      >
                        <Eye className="w-5 h-5 text-green-600 hover:text-green-700" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="gap-2"
            >
              Restaurar Padrão
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Home"))}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}