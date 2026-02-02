import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, CalendarX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function BlockManager({ user }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    is_all_day: true,
    reason: ""
  });

  useEffect(() => {
    loadBlocks();
  }, [user]);

  const loadBlocks = async () => {
    if (!user) return;
    try {
      const data = await base44.entities.ScheduleBlock.filter({
        professional_id: user.id
      }, "-start_date");
      setBlocks(data);
    } catch (error) {
      console.error("Error loading blocks:", error);
      toast.error("Erro ao carregar bloqueios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja remover este bloqueio?")) return;
    try {
      await base44.entities.ScheduleBlock.delete(id);
      setBlocks(blocks.filter(b => b.id !== id));
      toast.success("Bloqueio removido");
    } catch (error) {
      toast.error("Erro ao remover bloqueio");
    }
  };

  const handleSave = async () => {
    if (!newBlock.start_date || !newBlock.end_date || !newBlock.reason) {
      toast.error("Preencha as datas e o motivo");
      return;
    }

    try {
      const blockData = {
        professional_id: user.id,
        ...newBlock
      };
      const created = await base44.entities.ScheduleBlock.create(blockData);
      setBlocks([created, ...blocks]);
      setIsDialogOpen(false);
      setNewBlock({
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        is_all_day: true,
        reason: ""
      });
      toast.success("Bloqueio adicionado");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar bloqueio");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Bloqueios e Ausências</h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Bloqueio
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motivo</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum bloqueio cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-medium">{block.reason}</TableCell>
                    <TableCell>
                      {moment(block.start_date).format("DD/MM/YYYY")}
                      {!block.is_all_day && block.start_time && ` às ${block.start_time}`}
                    </TableCell>
                    <TableCell>
                      {moment(block.end_date).format("DD/MM/YYYY")}
                      {!block.is_all_day && block.end_time && ` às ${block.end_time}`}
                    </TableCell>
                    <TableCell>
                      {block.is_all_day ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Dia Todo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Parcial
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(block.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Bloqueio de Agenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Motivo</Label>
              <Input 
                placeholder="Ex: Férias, Congresso, Consulta Pessoal" 
                value={newBlock.reason}
                onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data Início</Label>
                <Input 
                  type="date" 
                  value={newBlock.start_date}
                  onChange={(e) => setNewBlock({...newBlock, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data Fim</Label>
                <Input 
                  type="date" 
                  value={newBlock.end_date}
                  onChange={(e) => setNewBlock({...newBlock, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={newBlock.is_all_day}
                onCheckedChange={(checked) => setNewBlock({...newBlock, is_all_day: checked})}
              />
              <Label>Bloquear dia todo</Label>
            </div>

            {!newBlock.is_all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hora Início</Label>
                  <Input 
                    type="time" 
                    value={newBlock.start_time}
                    onChange={(e) => setNewBlock({...newBlock, start_time: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Hora Fim</Label>
                  <Input 
                    type="time" 
                    value={newBlock.end_time}
                    onChange={(e) => setNewBlock({...newBlock, end_time: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Bloqueio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}