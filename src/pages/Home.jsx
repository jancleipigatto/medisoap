import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope,
  Settings,
} from "lucide-react";
import { ALL_DASHBOARD_ITEMS } from "@/components/dashboard/dashboardItems";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    const currentUser = await User.me();
    setUser(currentUser);
    setIsLoading(false);
  };

  const allMenuItems = ALL_DASHBOARD_ITEMS;

  const hasPermission = (item) => {
    if (!user) return false;
    if (item.adminOnly) return user.role === 'admin';
    if (!item.permission) return true;
    return user[item.permission] === true;
  };

  const getDisplayItems = () => {
    // Se o usuário tem dashboard_items personalizado, usar essa ordem
    if (user?.dashboard_items && user.dashboard_items.length > 0) {
      return user.dashboard_items
        .map(key => allMenuItems[key])
        .filter(item => item && hasPermission(item));
    }
    
    // Caso contrário, mostrar todos os itens disponíveis
    return Object.values(allMenuItems).filter(hasPermission);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayItems = getDisplayItems();

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          {/* Header com botão de personalização no canto superior direito */}
          <div className="flex justify-end mb-6">
            <Link to={createPageUrl("DashboardSettings")}>
              <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                <Settings className="w-4 h-4" />
                Personalizar Início
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Bem-vindo ao MediSOAP
            </h1>
            <p className="text-xl text-gray-600">
              Olá, <span className="font-semibold text-indigo-600">{user?.full_name}</span>! O que deseja fazer hoje?
            </p>
          </div>

          {/* Menu Grid */}
          {displayItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayItems.map((item) => (
                <Link key={item.title} to={item.url}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-none overflow-hidden cursor-pointer h-full">
                    <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                    <CardContent className="flex flex-col items-center justify-center py-8 px-4">
                      <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <item.icon className="w-10 h-10 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-center">
                        {item.title}
                      </CardTitle>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="shadow-md border-none">
              <CardContent className="p-12 text-center">
                <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Vazio</h3>
                <p className="text-gray-500 mb-6">Configure seu dashboard para começar</p>
                <Link to={createPageUrl("DashboardSettings")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Personalizar Início
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </PermissionGuard>
  );
}