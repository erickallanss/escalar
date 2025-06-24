import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Group, ShiftType } from '../../types';

interface GroupFormProps {
  group?: Group | null;
  onClose: () => void;
}

const SHIFT_OPTIONS = [
  { value: 'D', label: 'Diurno (D)' },
  { value: 'N', label: 'Noturno (N)' },
  { value: 'P', label: 'Plantão (P)' },
  { value: 'ND', label: 'Noite/Dia (ND)' }
];

export const GroupForm: React.FC<GroupFormProps> = ({ group, onClose }) => {
  const { establishments, addGroup, updateGroup } = useData();
  const [formData, setFormData] = useState({
    name: '',
    establishmentId: '',
    validShifts: ['D', 'N', 'P', 'ND'] as ShiftType[],
    defaultMonthlyHours: 144,
    defaultShiftHours: 12
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        establishmentId: group.establishmentId,
        validShifts: group.validShifts,
        defaultMonthlyHours: group.defaultMonthlyHours,
        defaultShiftHours: group.defaultShiftHours
      });
    }
  }, [group]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.establishmentId) {
      newErrors.establishmentId = 'Estabelecimento é obrigatório';
    }

    if (formData.validShifts.length === 0) {
      newErrors.validShifts = 'Selecione pelo menos um turno válido';
    }

    if (formData.defaultMonthlyHours <= 0) {
      newErrors.defaultMonthlyHours = 'Carga horária mensal deve ser maior que zero';
    }

    if (formData.defaultShiftHours <= 0) {
      newErrors.defaultShiftHours = 'Carga horária por plantão deve ser maior que zero';
    }

    if (formData.defaultMonthlyHours % formData.defaultShiftHours !== 0) {
      newErrors.defaultMonthlyHours = 'Carga mensal deve ser múltiplo da carga por plantão';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (group) {
      updateGroup(group.id, formData);
    } else {
      addGroup(formData);
    }

    onClose();
  };

  const handleShiftToggle = (shift: ShiftType) => {
    setFormData(prev => ({
      ...prev,
      validShifts: prev.validShifts.includes(shift)
        ? prev.validShifts.filter(s => s !== shift)
        : [...prev.validShifts, shift]
    }));
  };

  const establishmentOptions = establishments.map(est => ({
    value: est.id,
    label: est.name
  }));

  if (establishmentOptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Você precisa cadastrar pelo menos um estabelecimento antes de criar um grupo.
        </p>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nome do Grupo *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex: Técnicos em Radiologia"
        error={errors.name}
      />

      <Select
        label="Estabelecimento *"
        value={formData.establishmentId}
        onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
        options={[{ value: '', label: 'Selecione um estabelecimento' }, ...establishmentOptions]}
        error={errors.establishmentId}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Turnos Válidos *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SHIFT_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.validShifts.includes(option.value as ShiftType)}
                onChange={() => handleShiftToggle(option.value as ShiftType)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.validShifts && (
          <p className="mt-1 text-sm text-red-600">{errors.validShifts}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Carga Horária Mensal Padrão *"
          type="number"
          value={formData.defaultMonthlyHours}
          onChange={(e) => setFormData({ ...formData, defaultMonthlyHours: parseInt(e.target.value) || 0 })}
          placeholder="144"
          error={errors.defaultMonthlyHours}
        />

        <Input
          label="Carga Horária por Plantão *"
          type="number"
          value={formData.defaultShiftHours}
          onChange={(e) => setFormData({ ...formData, defaultShiftHours: parseInt(e.target.value) || 0 })}
          placeholder="12"
          error={errors.defaultShiftHours}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Configurações do Grupo:</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• Turnos válidos: {formData.validShifts.join(', ')}</p>
          <p>• Carga mensal padrão: {formData.defaultMonthlyHours}h</p>
          <p>• Carga por plantão: {formData.defaultShiftHours}h</p>
          <p>• Plantões por mês: {Math.floor(formData.defaultMonthlyHours / formData.defaultShiftHours)}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {group ? 'Atualizar' : 'Criar'} Grupo
        </Button>
      </div>
    </form>
  );
};