import React, { useState } from 'react';
import { Plus, Calendar, Users, Building2, Eye, Edit, Trash2, Download, CheckCircle, Clock } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { ScheduleGenerator } from './ScheduleGenerator';
import { ScheduleViewer } from './ScheduleViewer';
import { Schedule } from '../../types';

export const SchedulesList: React.FC = () => {
  const { schedules, groups, establishments, deleteSchedule, updateSchedule } = useData();
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const handleView = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowViewerModal(true);
  };

  const handleDelete = (id: string) => {
    deleteSchedule(id);
    setShowDeleteConfirm(null);
  };

  const handleConfirm = (schedule: Schedule) => {
    updateSchedule(schedule.id, { 
      status: 'confirmed',
      confirmedAt: new Date()
    });
  };

  const handleRevoke = (schedule: Schedule) => {
    updateSchedule(schedule.id, { 
      status: 'draft',
      confirmedAt: undefined
    });
  };

  const filteredSchedules = selectedGroupId 
    ? schedules.filter(s => s.groupId === selectedGroupId)
    : schedules;

  const groupOptions = groups.map(group => {
    const establishment = establishments.find(e => e.id === group.establishmentId);
    return {
      value: group.id,
      label: `${group.name} - ${establishment?.name}`
    };
  });

  const sortedSchedules = filteredSchedules.sort((a, b) => {
    // Ordenar por ano/mês decrescente
    if (a.year !== b.year) return b.year - a.year;
    return b.month.localeCompare(a.month);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escalas</h1>
          <p className="text-gray-600">Gerencie as escalas de plantão</p>
        </div>
        <Button onClick={() => setShowGeneratorModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Gerar Escala
        </Button>
      </div>

      {/* Filters */}
      {groups.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <Select
              label="Filtrar por Grupo"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              options={[
                { value: '', label: 'Todos os grupos' },
                ...groupOptions
              ]}
            />
          </div>
        </div>
      )}

      {/* Schedules List */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum grupo cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            Você precisa criar pelo menos um grupo antes de gerar escalas
          </p>
        </div>
      ) : sortedSchedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedGroupId ? 'Nenhuma escala neste grupo' : 'Nenhuma escala gerada'}
          </h3>
          <p className="text-gray-600 mb-6">
            Comece gerando sua primeira escala de plantão
          </p>
          <Button onClick={() => setShowGeneratorModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Gerar Escala
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criada em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantões
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSchedules.map((schedule) => {
                  const group = groups.find(g => g.id === schedule.groupId);
                  const establishment = establishments.find(e => e.id === group?.establishmentId);
                  
                  const totalAssignments = Object.values(schedule.assignments)
                    .reduce((total, dayAssignments) => total + dayAssignments.length, 0);

                  const [year, month] = schedule.month.split('-');
                  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  });

                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {monthName}
                            </div>
                            <div className="text-sm text-gray-500">{schedule.month}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group?.name}</div>
                        <div className="text-sm text-gray-500">{establishment?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.status === 'confirmed' ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Confirmada</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-orange-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Rascunho</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.createdAt.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totalAssignments} plantões
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(schedule)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {schedule.status === 'draft' ? (
                            <button
                              onClick={() => handleConfirm(schedule)}
                              className="text-green-600 hover:text-green-700 transition-colors"
                              title="Confirmar escala"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevoke(schedule)}
                              className="text-orange-600 hover:text-orange-700 transition-colors"
                              title="Revogar confirmação"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Exportar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => setShowDeleteConfirm(schedule.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      <Modal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        title="Gerar Nova Escala"
        size="lg"
      >
        <ScheduleGenerator onClose={() => setShowGeneratorModal(false)} />
      </Modal>

      {/* Viewer Modal */}
      <Modal
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        title="Visualizar Escala"
        size="xl"
      >
        {selectedSchedule && (
          <ScheduleViewer 
            schedule={selectedSchedule} 
            onClose={() => setShowViewerModal(false)} 
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Confirmar Exclusão"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir esta escala? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};