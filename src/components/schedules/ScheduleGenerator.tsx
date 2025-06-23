import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { generateSchedule, validateScheduleGeneration } from '../../utils/scheduleGenerator';
import { AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface ScheduleGeneratorProps {
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ onClose }) => {
  const { groups, establishments, dutyWorkers, addSchedule, getWorkersByGroup } = useData();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);

  const handleGenerate = async () => {
    if (!selectedGroupId || !selectedMonth) return;

    setIsGenerating(true);
    
    const group = groups.find(g => g.id === selectedGroupId);
    const workers = getWorkersByGroup(selectedGroupId);
    
    if (!group) return;

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateSchedule(group, workers, selectedMonth);
    
    setValidationErrors(result.errors);
    setGeneratedSchedule(result.schedule);
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (generatedSchedule) {
      addSchedule({
        groupId: generatedSchedule.groupId,
        month: generatedSchedule.month,
        year: generatedSchedule.year,
        assignments: generatedSchedule.assignments,
        status: 'draft'
      });
      onClose();
    }
  };

  const groupOptions = groups.map(group => {
    const establishment = establishments.find(e => e.id === group.establishmentId);
    return {
      value: group.id,
      label: `${group.name} - ${establishment?.name}`
    };
  });

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedWorkers = selectedGroupId ? getWorkersByGroup(selectedGroupId) : [];

  // Gerar opções de mês (próximos 12 meses)
  const monthOptions = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    monthOptions.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  const hasErrors = validationErrors.some(e => e.type === 'error');
  const hasWarnings = validationErrors.some(e => e.type === 'warning');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Grupo *"
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            setValidationErrors([]);
            setGeneratedSchedule(null);
          }}
          options={[{ value: '', label: 'Selecione um grupo' }, ...groupOptions]}
        />

        <Select
          label="Mês/Ano *"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setValidationErrors([]);
            setGeneratedSchedule(null);
          }}
          options={[{ value: '', label: 'Selecione o período' }, ...monthOptions]}
        />
      </div>

      {selectedGroup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Informações do Grupo:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p>• Turnos válidos: {selectedGroup.validShifts.join(', ')}</p>
              <p>• Carga padrão: {selectedGroup.defaultMonthlyHours}h/mês</p>
            </div>
            <div>
              <p>• Plantão padrão: {selectedGroup.defaultShiftHours}h</p>
              <p>• Plantonistas: {selectedWorkers.length}</p>
            </div>
          </div>
        </div>
      )}

      {selectedWorkers.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Plantonistas do Grupo:</h4>
          <div className="grid grid-cols-1 gap-2">
            {selectedWorkers.map(worker => (
              <div key={worker.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{worker.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{worker.monthlyHours}h</span>
                  <div className="flex space-x-1">
                    {worker.preferences.map(pref => (
                      <span key={pref} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 p-3 rounded-lg ${
                error.type === 'error' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                error.type === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  error.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {error.type === 'error' ? 'Erro' : 'Aviso'}
                </p>
                <p className={`text-sm ${
                  error.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {error.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated Schedule Summary */}
      {generatedSchedule && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-900">Escala Gerada com Sucesso!</h4>
          </div>
          <div className="text-sm text-green-800">
            <p>• Total de plantões: {Object.values(generatedSchedule.assignments).reduce((total: number, dayAssignments: any) => total + dayAssignments.length, 0)}</p>
            <p>• Período: {selectedMonth}</p>
            {hasWarnings && <p>• Alguns avisos foram encontrados, mas a escala pode ser salva</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        
        {!generatedSchedule ? (
          <Button
            onClick={handleGenerate}
            disabled={!selectedGroupId || !selectedMonth || isGenerating}
            loading={isGenerating}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Gerar Escala
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={hasErrors}
          >
            Salvar Escala
          </Button>
        )}
      </div>
    </div>
  );
};