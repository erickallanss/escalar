import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Schedule } from '../../types';
import { SHIFT_CONFIGS, getDaysInMonth } from '../../utils/scheduleGenerator';
import { Download, Edit, CheckCircle, Clock } from 'lucide-react';

interface ScheduleViewerProps {
  schedule: Schedule;
  onClose: () => void;
}

export const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, onClose }) => {
  const { groups, establishments, dutyWorkers } = useData();
  
  const group = groups.find(g => g.id === schedule.groupId);
  const establishment = establishments.find(e => e.id === group?.establishmentId);
  const workers = dutyWorkers.filter(w => w.groupId === schedule.groupId);
  
  const [year, monthNum] = schedule.month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  const monthName = new Date(year, monthNum - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Criar array de dias do mês
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calcular estatísticas
  const totalAssignments = Object.values(schedule.assignments)
    .reduce((total, dayAssignments) => total + dayAssignments.length, 0);

  const workerStats = workers.map(worker => {
    const assignments = Object.values(schedule.assignments)
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
        </div>
        <div className="flex items-center space-x-2">
          {schedule.status === 'confirmed' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Confirmada</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <Clock className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Rascunho</span>
            </div>
          )}
        </div>
      </div>

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
                    const dayAssignments = schedule.assignments[day.toString()] || [];
                    const workerAssignment = dayAssignments.find(a => a.workerId === worker.id);
                    
                    return (
                      <td key={day} className="px-2 py-3 text-center">
                        {workerAssignment && (
                          <div
                            className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold text-white`}
                            style={{ backgroundColor: SHIFT_CONFIGS[workerAssignment.shift].color }}
                            title={`${SHIFT_CONFIGS[workerAssignment.shift].label} - ${workerAssignment.hours}h`}
                          >
                            {workerAssignment.shift}
                          </div>
                        )}
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
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        <Button variant="ghost">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
        <Button variant="ghost">
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
        {schedule.status === 'draft' && (
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Editar Escala
          </Button>
        )}
      </div>
    </div>
  );
};