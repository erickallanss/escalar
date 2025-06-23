import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Establishment } from '../../types';

interface EstablishmentFormProps {
  establishment?: Establishment | null;
  onClose: () => void;
}

export const EstablishmentForm: React.FC<EstablishmentFormProps> = ({
  establishment,
  onClose
}) => {
  const { user } = useAuth();
  const { addEstablishment, updateEstablishment } = useData();
  const [formData, setFormData] = useState({
    name: '',
    dayStart: '07:00',
    dayEnd: '19:00',
    nightStart: '19:00',
    nightEnd: '07:00'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (establishment) {
      setFormData({
        name: establishment.name,
        dayStart: establishment.dayStart,
        dayEnd: establishment.dayEnd,
        nightStart: establishment.nightStart,
        nightEnd: establishment.nightEnd
      });
    }
  }, [establishment]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.dayStart) {
      newErrors.dayStart = 'Horário de início do dia é obrigatório';
    }

    if (!formData.dayEnd) {
      newErrors.dayEnd = 'Horário de fim do dia é obrigatório';
    }

    if (!formData.nightStart) {
      newErrors.nightStart = 'Horário de início da noite é obrigatório';
    }

    if (!formData.nightEnd) {
      newErrors.nightEnd = 'Horário de fim da noite é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    if (establishment) {
      updateEstablishment(establishment.id, formData);
    } else {
      addEstablishment({
        ...formData,
        userId: user.id
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nome do Estabelecimento *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex: Clínica São Lucas"
        error={errors.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Início do Turno Diurno *"
          type="time"
          value={formData.dayStart}
          onChange={(e) => setFormData({ ...formData, dayStart: e.target.value })}
          error={errors.dayStart}
        />

        <Input
          label="Fim do Turno Diurno *"
          type="time"
          value={formData.dayEnd}
          onChange={(e) => setFormData({ ...formData, dayEnd: e.target.value })}
          error={errors.dayEnd}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Início do Turno Noturno *"
          type="time"
          value={formData.nightStart}
          onChange={(e) => setFormData({ ...formData, nightStart: e.target.value })}
          error={errors.nightStart}
        />

        <Input
          label="Fim do Turno Noturno *"
          type="time"
          value={formData.nightEnd}
          onChange={(e) => setFormData({ ...formData, nightEnd: e.target.value })}
          error={errors.nightEnd}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Horários Configurados:</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• Diurno (D): {formData.dayStart} às {formData.dayEnd}</p>
          <p>• Noturno (N): {formData.nightStart} às {formData.nightEnd}</p>
          <p>• Plantão (P): {formData.dayStart} às {formData.dayStart} (+24h)</p>
          <p>• Noite/Dia (ND): {formData.nightStart} às {formData.nightStart} (+24h)</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {establishment ? 'Atualizar' : 'Criar'} Estabelecimento
        </Button>
      </div>
    </form>
  );
};