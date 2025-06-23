import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DutyWorker, ShiftType } from '../../types';

interface WorkerFormProps {
  worker?: DutyWorker | null;
  onClose: () => void;
}

const SHIFT_OPTIONS = [
  { value: 'D', label: 'Diurno (D)' },
  { value: 'N', label: 'Noturno (N)' },
  { value: 'P', label: 'Plantão (P)' },
  { value: 'ND', label: 'Noite/Dia (ND)' }
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

export const WorkerForm: React.FC<WorkerFormProps> = ({ worker, onClose }) => {
  const { groups, establishments, addDutyWorker, updateDutyWorker } = useData();
  const [formData, setFormData] = useState({
    name: '',
    groupId: '',
    preferences: [] as ShiftType[],
    unavailableWeekdays: [] as number[],
    monthlyHours: 144,
    monthlyRestrictions: {} as { [month: string]: number[] }
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (worker) {
      setFormData({
        name: worker.name,
        groupId: worker.groupId,
        preferences: worker.preferences,
        unavailableWeekdays: worker.unavailableWeekdays,
        monthlyHours: worker.monthlyHours,
        monthlyRestrictions: worker.monthlyRestrictions
      });
    }
  }, [worker]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.groupId) {
      newErrors.groupId = 'Grupo é obrigatório';
    }

    if (formData.preferences.length === 0) {
      newErrors.preferences = 'Selecione pelo menos uma preferência de plantão';
    }

    if (formData.monthlyHours <= 0) {
      newErrors.monthlyHours = 'Carga horária mensal deve ser maior que zero';
    }

    // Verificar se a carga horária é múltiplo da carga de plantão do grupo
    const selectedGroup = groups.find(g => g.id === formData.groupId);
    if (selectedGroup && formData.monthlyHours % selectedGroup.defaultShiftHours !== 0) {
      newErrors.monthlyHours = `Carga horária deve ser múltiplo de ${selectedGroup.defaultShiftHours}h (carga do grupo)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (worker) {
      updateDutyWorker(worker.id, formData);
    } else {
      addDutyWorker(formData);
    }

    onClose();
  };

  const handlePreferenceToggle = (shift: ShiftType) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(shift)
        ? prev.preferences.filter(s => s !== shift)
        : [...prev.preferences, shift]
    }));
  };

  const handleWeekdayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      unavailableWeekdays: prev.unavailableWeekdays.includes(day)
        ? prev.unavailableWeekdays.filter(d => d !== day)
        : [...prev.unavailableWeekdays, day]
    }));
  };

  const groupOptions = groups.map(group => {
    const establishment = establishments.find(e => e.id === group.establishmentId);
    return {
      value: group.id,
      label: `${group.name} - ${establishment?.name}`
    };
  });

  const selectedGroup = groups.find(g => g.id === formData.groupId);

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Você precisa cadastrar pelo menos um grupo antes de criar um plantonista.
        </p>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nome Completo *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex: Dr. João Silva"
        error={errors.name}
      />

      <Select
        label="Grupo *"
        value={formData.groupId}
        onChange={(e) => {
          const newGroupId = e.target.value;
          const newGroup = groups.find(g => g.id === newGroupId);
          setFormData({ 
            ...formData, 
            groupId: newGroupId,
            monthlyHours: newGroup?.defaultMonthlyHours || 144
          });
        }}
        options={[{ value: '', label: 'Selecione um grupo' }, ...groupOptions]}
        error={errors.groupId}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferências de Plantão *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SHIFT_OPTIONS.map(option => {
            const isAvailable = selectedGroup?.validShifts.includes(option.value as ShiftType) ?? true;
            return (
              <label 
                key={option.value} 
                className={`flex items-center space-x-2 cursor-pointer ${!isAvailable ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.includes(option.value as ShiftType)}
                  onChange={() => handlePreferenceToggle(option.value as ShiftType)}
                  disabled={!isAvailable}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {option.label}
                  {!isAvailable && ' (não disponível no grupo)'}
                </span>
              </label>
            );
          })}
        </div>
        {errors.preferences && (
          <p className="mt-1 text-sm text-red-600">{errors.preferences}</p>
        )}
      </div>

      <Input
        label="Carga Horária Mensal *"
        type="number"
        value={formData.monthlyHours}
        onChange={(e) => setFormData({ ...formData, monthlyHours: parseInt(e.target.value) || 0 })}
        placeholder="144"
        error={errors.monthlyHours}
        helperText={selectedGroup ? `Deve ser múltiplo de ${selectedGroup.defaultShiftHours}h (carga do grupo)` : undefined}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Dias da Semana Indisponíveis
        </label>
        <div className="grid grid-cols-2 gap-3">
          {WEEKDAY_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.unavailableWeekdays.includes(option.value)}
                onChange={() => handleWeekdayToggle(option.value)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedGroup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Resumo do Plantonista:</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>• Grupo: {selectedGroup.name}</p>
            <p>• Preferências: {formData.preferences.join(', ')}</p>
            <p>• Carga mensal: {formData.monthlyHours}h</p>
            <p>• Plantões por mês: {Math.floor(formData.monthlyHours / selectedGroup.defaultShiftHours)}</p>
            {formData.unavailableWeekdays.length > 0 && (
              <p>• Indisponível: {formData.unavailableWeekdays.map(d => WEEKDAY_OPTIONS[d].label).join(', ')}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {worker ? 'Atualizar' : 'Criar'} Plantonista
        </Button>
      </div>
    </form>
  );
};