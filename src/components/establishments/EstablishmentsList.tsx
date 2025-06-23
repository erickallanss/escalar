import React, { useState } from 'react';
import { Plus, Building2, Clock, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EstablishmentForm } from './EstablishmentForm';
import { Establishment } from '../../types';

export const EstablishmentsList: React.FC = () => {
  const { establishments, deleteEstablishment, getGroupsByEstablishment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (establishment: Establishment) => {
    setEditingEstablishment(establishment);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteEstablishment(id);
    setShowDeleteConfirm(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEstablishment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
          <p className="text-gray-600">Gerencie suas clínicas e hospitais</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Estabelecimento
        </Button>
      </div>

      {/* Establishments Grid */}
      {establishments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum estabelecimento cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            Comece criando seu primeiro estabelecimento
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Estabelecimento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {establishments.map((establishment) => {
            const groups = getGroupsByEstablishment(establishment.id);
            
            return (
              <div key={establishment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{establishment.name}</h3>
                      <p className="text-sm text-gray-600">{groups.length} grupos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(establishment)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(establishment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Horários de funcionamento:</span>
                  </div>
                  
                  <div className="ml-6 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diurno:</span>
                      <span className="font-medium">{establishment.dayStart} às {establishment.dayEnd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Noturno:</span>
                      <span className="font-medium">{establishment.nightStart} às {establishment.nightEnd}</span>
                    </div>
                  </div>
                </div>

                {/* Groups Preview */}
                {groups.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Grupos:</p>
                    <div className="space-y-1">
                      {groups.slice(0, 3).map(group => (
                        <div key={group.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{group.name}</span>
                          <span className="text-xs text-gray-400">{group.validShifts.join(', ')}</span>
                        </div>
                      ))}
                      {groups.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{groups.length - 3} outros grupos
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
        title={editingEstablishment ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
      >
        <EstablishmentForm
          establishment={editingEstablishment}
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
              Tem certeza que deseja excluir este estabelecimento? Esta ação também removerá 
              todos os grupos, plantonistas e escalas relacionados.
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