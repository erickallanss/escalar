import React, { useState } from 'react';
import { Plus, UserCheck, Users, Edit, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { WorkerForm } from './WorkerForm';
import { DutyWorker } from '../../types';

export const WorkersList: React.FC = () => {
  const { dutyWorkers, groups, establishments, deleteDutyWorker } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<DutyWorker | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const handleEdit = (worker: DutyWorker) => {
    setEditingWorker(worker);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteDutyWorker(id);
    setShowDeleteConfirm(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWorker(null);
  };

  const filteredWorkers = selectedGroupId 
    ? dutyWorkers.filter(w => w.groupId === selectedGroupId)
    : dutyWorkers;

  const groupOptions = groups.map(group => {
    const establishment = establishments.find(e => e.id === group.establishmentId);
    return {
      value: group.id,
      label: `${group.name} - ${establishment?.name}`
    };
  });

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantonistas</h1>
          <p className="text-gray-600">Gerencie os profissionais de plantão</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plantonista
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

      {/* Workers List */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum grupo cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            Você precisa criar pelo menos um grupo antes de cadastrar plantonistas
          </p>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedGroupId ? 'Nenhum plantonista neste grupo' : 'Nenhum plantonista cadastrado'}
          </h3>
          <p className="text-gray-600 mb-6">
            Comece cadastrando seu primeiro plantonista
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plantonista
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantonista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preferências
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carga Horária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indisponibilidades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkers.map((worker) => {
                  const group = groups.find(g => g.id === worker.groupId);
                  const establishment = establishments.find(e => e.id === group?.establishmentId);
                  const hasIssues = !worker.monthlyHours || worker.monthlyHours <= 0 || 
                    (group && worker.monthlyHours % group.defaultShiftHours !== 0);

                  return (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group?.name}</div>
                        <div className="text-sm text-gray-500">{establishment?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {worker.preferences.map(pref => (
                            <span key={pref} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {pref}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{worker.monthlyHours}h</span>
                          {group && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({Math.floor(worker.monthlyHours / group.defaultShiftHours)} plantões)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {worker.unavailableWeekdays.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {worker.unavailableWeekdays.map(day => (
                                <span key={day} className="px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                                  {WEEKDAYS[day]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">Nenhuma</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasIssues ? (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            <span className="text-xs">Configuração inválida</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs">Configurado</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(worker)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(worker.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingWorker ? 'Editar Plantonista' : 'Novo Plantonista'}
        size="lg"
      >
        <WorkerForm
          worker={editingWorker}
          onClose={closeModal}
        />
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
              Tem certeza que deseja excluir este plantonista? Esta ação também removerá 
              todas as escalas relacionadas.
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