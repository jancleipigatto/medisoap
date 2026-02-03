import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, MapPin, User, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConfirmAppointment() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [token]);

  const loadAppointment = async () => {
    if (!token) {
      setError("Link inválido ou expirado.");
      setLoading(false);
      return;
    }

    try {
      // Need to find by token. 
      // Note: Filter implies searching, ensure token is unique enough.
      const results = await base44.entities.Agendamento.filter({ confirmation_token: token });
      
      if (results.length === 0) {
        setError("Agendamento não encontrado.");
      } else {
        const appt = results[0];
        setAppointment(appt);
        if (appt.status === "confirmado") {
            setConfirmed(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;
    setLoading(true);
    try {
        await base44.entities.Agendamento.update(appointment.id, { 
            status: "confirmado" 
        });
        setConfirmed(true);
    } catch (err) {
        console.error(err);
        setError("Erro ao confirmar agendamento.");
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center py-10 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Ops!</h2>
                    <p className="text-gray-600">{error}</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Confirmação de Consulta</CardTitle>
            <CardDescription>
                Por favor, confirme sua presença para o agendamento abaixo.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Paciente</p>
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Profissional</p>
                        <p className="font-medium text-gray-900">{appointment.professional_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Data</p>
                        <p className="font-medium text-gray-900 capitalize">
                            {format(parseISO(appointment.data_agendamento), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Horário</p>
                        <p className="font-medium text-gray-900">{appointment.horario_inicio} - {appointment.horario_fim}</p>
                    </div>
                </div>
            </div>

            {confirmed ? (
                <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700">Confirmado!</h3>
                    <p className="text-gray-600 mt-2">Sua presença foi confirmada com sucesso.</p>
                </div>
            ) : (
                <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                    onClick={handleConfirm}
                >
                    Confirmar Presença
                </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}