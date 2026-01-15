
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
  EyeOff
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
      setDashboardItems(validItems.map(id => ({
        ...allMenuItems[id],
        visible: true
      })));
    } else {
      setDashboardItems(availableItems.map(id => ({
        ...allMenuItems[id],
        visible: true
      })));
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

  const toggleVisibility = (itemId) => {
    setDashboardItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const visibleItems = dashboardItems
      .filter(item => item.visible)
      .map(item => item.id);
    
    await User.updateMyUserData({ dashboard_items: visibleItems });
    setIsSaving(false);
    navigate(createPageUrl("Home"));
  };

  const resetToDefault = () => {
    const availableItems = Object.keys(allMenuItems).filter(key => 
      hasPermission(allMenuItems[key])
    );
    setDashboardItems(availableItems.map(id => ({
      ...allMenuItems[id],
      visible: true
    })));
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
                Itens do Dashboard
              </CardTitle>
              <p className="text-sm text-gray-500">
                Arraste para reordenar • Clique no olho para mostrar/ocultar
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
                                  : item.visible
                                  ? 'border-gray-200 hover:border-gray-300'
                                  : 'border-gray-100 opacity-50'
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

                              <Badge
                                variant="outline"
                                className={item.visible ? "bg-green-50 text-green-700 border-green-200" : ""}
                              >
                                {item.visible ? "Visível" : "Oculto"}
                              </Badge>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleVisibility(item.id)}
                                className="flex-shrink-0"
                              >
                                {item.visible ? (
                                  <Eye className="w-5 h-5 text-green-600" />
                                ) : (
                                  <EyeOff className="w-5 h-5 text-gray-400" />
                                )}
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
