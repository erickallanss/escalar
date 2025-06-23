import React, { useState } from 'react';
import { Plus, Users, Building2, Edit, Trash2, UserCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { GroupForm } from './GroupForm';
import { Group } from '../../types';

export const GroupsList: React.FC = () => {
  const { groups, establishments, deleteGroup, getWorkersByGroup } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteGroup(id);
    setShowDeleteConfirm(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGroup(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
          <p className="text-gray-600">Gerencie grupos de profissionais</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum grupo cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            Comece criando seu primeiro grupo de profissionais
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const establishment = establishments.find(e => e.id === group.establishmentId);
            const workers = getWorkersByGroup(group.id);
            
            return (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {establishment?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(group)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(group.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Plantonistas:</span>
                    <span className="font-medium flex items-center">
                      <UserCheck className="w-4 h-4 mr-1" />
                      {workers.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Turnos válidos:</span>
                    <div className="flex space-x-1">
                      {group.validShifts.map(shift => (
                        <span key={shift} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {shift}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Carga mensal:</span>
                    <span className="font-medium">{group.defaultMonthlyHours}h</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Carga por plantão:</span>
                    <span className="font-medium">{group.defaultShiftHours}h</span>
                  </div>
                </div>

                {/* Workers Preview */}
                {workers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Plantonistas:</p>
                    <div className="space-y-1">
                      {workers.slice(0, 3).map(worker => (
                        <div key={worker.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{worker.name}</span>
                          <span className="text-xs text-gray-400">{worker.monthlyHours}h</span>
                        </div>
                      ))}
                      {workers.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{workers.length - 3} outros plantonistas
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
      >
        <GroupForm
          group={editingGroup}
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
              Tem certeza que deseja excluir este grupo? Esta ação também removerá 
              todos os plantonistas e escalas relacionados.
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