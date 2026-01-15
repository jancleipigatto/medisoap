import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PermissionGuard({ permission, children, fallback }) {
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

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasPermission = user?.[permission] === true;

  if (!hasPermission) {
    if (fallback) return fallback;
    
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Acesso Negado
              </h3>
              <p className="text-gray-600">
                Você não tem permissão para acessar esta funcionalidade. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return children;
}