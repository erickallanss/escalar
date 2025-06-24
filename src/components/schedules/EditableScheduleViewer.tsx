import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Schedule, Assignment, ShiftType, ValidationError } from '../../types';
import { SHIFT_CONFIGS, getDaysInMonth, validateManualEdit } from '../../utils/scheduleGenerator';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { Edit, CheckCircle, Clock, FileText, Table, Save, X, AlertTriangle } from 'lucide-react';

interface EditableScheduleViewerProps {
  schedule: Schedule;
  onSave: (updatedSchedule: Schedule) => void;
  onClose: () => void;
}

export const EditableScheduleViewer: React.FC<EditableScheduleViewerProps> = ({ 
  schedule, 
  onSave, 
  onClose 
}) => {
  const { groups, establishments, dutyWorkers, confirmSchedule } = useData();
  const [editedAssignments, setEditedAssignments] = useState(schedule.assignments);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [isModified, setIsModified] = useState(false);
  
  const group = groups.find(g => g.id === schedule.groupId);
  const establishment = establishments.find(e => e.id === group?.establishmentId);
  const workers = dutyWorkers.filter(w => w.groupId === schedule.groupId);
  
  const [year, monthNum] = schedule.month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  const monthName = new Date(year, monthNum - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Handler para exportação
  const handleExportPDF = () => {
    if (group && establishment) {
      const scheduleForExport = { ...schedule, assignments: editedAssignments };
      exportToPDF({
        schedule: scheduleForExport,
        group,
        establishment,
        workers
      });
    }
  };

  const handleExportExcel = () => {
    if (group && establishment) {
      const scheduleForExport = { ...schedule, assignments: editedAssignments };
      exportToExcel({
        schedule: scheduleForExport,
        group,
        establishment,
        workers
      });
    }
  };

  const handleConfirmSchedule = () => {
    if (window.confirm('Tem certeza que deseja confirmar esta escala? Uma vez confirmada, não poderá ser editada.')) {
      const updatedSchedule = { ...schedule, assignments: editedAssignments };
      onSave(updatedSchedule);
      confirmSchedule(schedule.id);
    }
  };

  const handleSave = () => {
    const updatedSchedule = { ...schedule, assignments: editedAssignments };
    onSave(updatedSchedule);
  };

  const handleCellClick = (workerId: string, day: number) => {
    const dayStr = day.toString();
    const dayAssignments = editedAssignments[dayStr] || [];
    const existingAssignment = dayAssignments.find(a => a.workerId === workerId);
    
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    // Ciclar entre os turnos possíveis para este trabalhador
    const availableShifts = worker.preferences.length > 0 ? worker.preferences : ['D', 'N'];
    
    let newShift: string | null = null;
    
    if (!existingAssignment) {
      // Sem turno atual, adicionar o primeiro da preferência
      newShift = availableShifts[0];
    } else {
      // Já tem turno, ciclar para o próximo ou remover
      const currentIndex = availableShifts.indexOf(existingAssignment.shift);
      if (currentIndex === -1) {
        newShift = availableShifts[0];
      } else if (currentIndex < availableShifts.length - 1) {
        newShift = availableShifts[currentIndex + 1];
      } else {
        newShift = null; // Remover turno
      }
    }

    // Atualizar assignments
    const newAssignments = { ...editedAssignments };
    const newDayAssignments = dayAssignments.filter(a => a.workerId !== workerId);
    
    if (newShift) {
      const shiftConfig = SHIFT_CONFIGS[newShift];
      const newAssignment: Assignment = {
        workerId,
        shift: newShift,
        hours: shiftConfig.hours
      };

      // Validar a edição manual
      const validation = validateManualEdit(
        newAssignment,
        day,
        { ...newAssignments, [dayStr]: [...newDayAssignments, newAssignment] },
        workers,
        year,
        monthNum
      );

      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
      } else {
        setValidationWarnings([]);
      }

      newDayAssignments.push(newAssignment);
    }
    
    if (newDayAssignments.length > 0) {
      newAssignments[dayStr] = newDayAssignments;
    } else {
      delete newAssignments[dayStr];
    }
    
    setEditedAssignments(newAssignments);
    setIsModified(true);
  };

  // Criar array de dias do mês
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calcular estatísticas
  const totalAssignments = Object.values(editedAssignments)
    .reduce((total, dayAssignments) => total + dayAssignments.length, 0);

  const workerStats = workers.map(worker => {
    const assignments = Object.values(editedAssignments)
      .flat()
      .filter(assignment => assignment.workerId === worker.id);
    
    const totalHours = assignments.reduce((sum, assignment) => sum + assignment.hours, 0);
    
    return {
      worker,
      assignments: assignments.length,
      hours: totalHours,
      percentage: worker.monthlyHours > 0 ? (totalHours / worker.monthlyHours) * 100 : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
          <p className="text-gray-600">{group?.name} - {establishment?.name}</p>
          <p className="text-sm text-blue-600 font-medium">Modo de Edição - Clique nas células para alterar turnos</p>
        </div>
        <div className="flex items-center space-x-2">
          {isModified && (
            <div className="flex items-center text-orange-600">
              <Edit className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Modificado</span>
            </div>
          )}
          <div className="flex items-center text-orange-600">
            <Clock className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Rascunho</span>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Avisos de Validação</h3>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>• {warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{totalAssignments}</div>
          <div className="text-sm text-blue-600">Total de plantões</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{workers.length}</div>
          <div className="text-sm text-green-600">Plantonistas</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">{daysInMonth}</div>
          <div className="text-sm text-purple-600">Dias no mês</div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Plantonista
                </th>
                {days.map(day => {
                  const date = new Date(year, monthNum - 1, day);
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  return (
                    <th
                      key={day}
                      className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[60px] ${
                        isWeekend ? 'bg-red-50 text-red-700' : 'text-gray-500'
                      }`}
                    >
                      <div>{day}</div>
                      <div className="text-xs">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][dayOfWeek]}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker, workerIndex) => (
                <tr key={worker.id} className={workerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                    <div className="min-w-[120px]">
                      {worker.name}
                    </div>
                  </td>
                  {days.map(day => {
                    const dayAssignments = editedAssignments[day.toString()] || [];
                    const workerAssignment = dayAssignments.find(a => a.workerId === worker.id);
                    
                    return (
                      <td key={day} className="px-2 py-3 text-center">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${
                            workerAssignment 
                              ? 'text-white font-bold text-xs'
                              : 'border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          style={workerAssignment ? { backgroundColor: SHIFT_CONFIGS[workerAssignment.shift].color } : {}}
                          onClick={() => handleCellClick(worker.id, day)}
                          title={workerAssignment 
                            ? `${SHIFT_CONFIGS[workerAssignment.shift].label} - ${workerAssignment.hours}h (Clique para alterar)`
                            : 'Clique para adicionar turno'
                          }
                        >
                          {workerAssignment ? workerAssignment.shift : '+'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Estatísticas por Plantonista</h3>
        <div className="space-y-2">
          {workerStats.map(stat => (
            <div key={stat.worker.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{stat.worker.name}</span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{stat.assignments} plantões</span>
                <span className="text-gray-600">{stat.hours}h / {stat.worker.monthlyHours}h</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stat.percentage >= 100 ? 'bg-green-500' : 
                      stat.percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-medium ${
                  stat.percentage >= 100 ? 'text-green-600' : 
                  stat.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stat.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Legenda dos Turnos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(SHIFT_CONFIGS).map(config => (
            <div key={config.type} className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded text-xs font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: config.color }}
              >
                {config.type}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{config.label}</div>
                <div className="text-xs text-gray-500">{config.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button variant="ghost" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="ghost" onClick={handleExportExcel}>
            <Table className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
        <div className="flex space-x-3">
          {isModified && (
            <Button variant="secondary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
          )}
          <Button onClick={handleConfirmSchedule}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar Escala
          </Button>
        </div>
      </div>
    </div>
  );
};
