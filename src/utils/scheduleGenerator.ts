import { DutyWorker, Schedule, Assignment, ShiftType, Group, ValidationError } from '../types';

export const SHIFT_CONFIGS = {
  D: { type: 'D' as ShiftType, label: 'Diurno', hours: 12, color: '#fbbf24', description: '07h às 19h' },
  N: { type: 'N' as ShiftType, label: 'Noturno', hours: 12, color: '#3b82f6', description: '19h às 07h' },
  P: { type: 'P' as ShiftType, label: 'Plantão', hours: 24, color: '#10b981', description: '07h às 07h' },
  ND: { type: 'ND' as ShiftType, label: 'Noite/Dia', hours: 24, color: '#8b5cf6', description: '19h às 19h' }
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function validateScheduleGeneration(group: Group, workers: DutyWorker[], month: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (workers.length === 0) {
    errors.push({
      type: 'error',
      message: 'Não há plantonistas cadastrados no grupo.'
    });
    return errors;
  }

  // Verificar se todos os workers têm carga horária definida
  const workersWithoutHours = workers.filter(w => !w.monthlyHours || w.monthlyHours <= 0);
  if (workersWithoutHours.length > 0) {
    workersWithoutHours.forEach(worker => {
      errors.push({
        type: 'error',
        message: `${worker.name} não tem carga horária mensal definida.`,
        workerId: worker.id
      });
    });
  }

  // Verificar se carga horária é múltiplo da carga de plantão
  workers.forEach(worker => {
    if (worker.monthlyHours % group.defaultShiftHours !== 0) {
      errors.push({
        type: 'error',
        message: `${worker.name}: carga horária mensal (${worker.monthlyHours}h) deve ser múltiplo da carga de plantão (${group.defaultShiftHours}h).`,
        workerId: worker.id
      });
    }
  });

  // Verificar se há workers disponíveis para cada turno
  group.validShifts.forEach(shift => {
    const availableWorkers = workers.filter(w => w.preferences.includes(shift));
    if (availableWorkers.length === 0) {
      errors.push({
        type: 'error',
        message: `Nenhum plantonista está disponível para turnos do tipo "${SHIFT_CONFIGS[shift].label}".`
      });
    }
  });

  return errors;
}

export function generateSchedule(
  group: Group, 
  workers: DutyWorker[], 
  month: string
): { schedule: Schedule; errors: ValidationError[] } {
  const errors = validateScheduleGeneration(group, workers, month);
  
  if (errors.some(e => e.type === 'error')) {
    return { 
      schedule: {
        id: '',
        groupId: group.id,
        month,
        year: parseInt(month.split('-')[0]),
        assignments: {},
        status: 'draft',
        createdAt: new Date()
      }, 
      errors 
    };
  }

  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  
  // Preparar estrutura de dados
  const assignments: { [day: string]: Assignment[] } = {};
  const workerHours: { [workerId: string]: number } = {};
  const workerLastShift: { [workerId: string]: { day: number; shift: ShiftType } } = {};
  
  workers.forEach(worker => {
    workerHours[worker.id] = 0;
  });

  // Gerar assignments para cada dia
  for (let day = 1; day <= daysInMonth; day++) {
    assignments[day.toString()] = [];
    
    const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
    
    // Para cada turno válido no grupo
    group.validShifts.forEach(shiftType => {
      const availableWorkers = workers.filter(worker => {
        // Verificar preferências
        if (!worker.preferences.includes(shiftType)) return false;
        
        // Verificar indisponibilidade por dia da semana
        if (worker.unavailableWeekdays.includes(dayOfWeek)) return false;
        
        // Verificar restrições específicas do mês
        const monthRestrictions = worker.monthlyRestrictions[month] || [];
        if (monthRestrictions.includes(day)) return false;
        
        // Verificar se já atingiu a carga horária mensal
        if (workerHours[worker.id] >= worker.monthlyHours) return false;
        
        // Verificar regra de descanso (no mínimo 1 plantão completo após 24h)
        const lastShift = workerLastShift[worker.id];
        if (lastShift) {
          const hoursWorked = SHIFT_CONFIGS[lastShift.shift].hours;
          if (hoursWorked >= 24 && (day - lastShift.day) < 2) return false;
        }
        
        return true;
      });
      
      if (availableWorkers.length === 0) {
        errors.push({
          type: 'warning',
          message: `Dia ${day}: Nenhum plantonista disponível para o turno ${SHIFT_CONFIGS[shiftType].label}.`,
          day
        });
        return;
      }
      
      // Ordenar por menor carga horária atual (distribuição equitativa)
      availableWorkers.sort((a, b) => workerHours[a.id] - workerHours[b.id]);
      
      // Selecionar o primeiro (com menor carga)
      const selectedWorker = availableWorkers[0];
      const shiftHours = SHIFT_CONFIGS[shiftType].hours;
      
      // Verificar se não ultrapassa a carga mensal
      if (workerHours[selectedWorker.id] + shiftHours <= selectedWorker.monthlyHours) {
        assignments[day.toString()].push({
          workerId: selectedWorker.id,
          shift: shiftType,
          hours: shiftHours
        });
        
        workerHours[selectedWorker.id] += shiftHours;
        workerLastShift[selectedWorker.id] = { day, shift: shiftType };
        
        // Se for ND, ocupar também o turno D do dia seguinte
        if (shiftType === 'ND' && day < daysInMonth) {
          const nextDay = (day + 1).toString();
          if (!assignments[nextDay]) assignments[nextDay] = [];
          // Marcar como ocupado, mas não adicionar horas extras
        }
      }
    });
  }

  // Verificar se todos os workers atingiram sua carga horária
  workers.forEach(worker => {
    const achieved = workerHours[worker.id];
    const target = worker.monthlyHours;
    
    if (achieved < target) {
      errors.push({
        type: 'warning',
        message: `${worker.name}: carga horária não completada (${achieved}/${target}h).`,
        workerId: worker.id
      });
    }
  });

  const schedule: Schedule = {
    id: Date.now().toString(),
    groupId: group.id,
    month,
    year,
    assignments,
    status: 'draft',
    createdAt: new Date()
  };

  return { schedule, errors };
}

export function validateManualEdit(
  assignment: Assignment,
  day: number,
  group: Group,
  workers: DutyWorker[],
  currentSchedule: Schedule
): ValidationError[] {
  const errors: ValidationError[] = [];
  const worker = workers.find(w => w.id === assignment.workerId);
  
  if (!worker) {
    errors.push({
      type: 'error',
      message: 'Plantonista não encontrado.'
    });
    return errors;
  }

  // Verificar preferências
  if (!worker.preferences.includes(assignment.shift)) {
    errors.push({
      type: 'warning',
      message: `${worker.name} não tem preferência para turnos do tipo "${SHIFT_CONFIGS[assignment.shift].label}".`,
      workerId: worker.id
    });
  }

  // Verificar indisponibilidade por dia da semana
  const [year, monthNum] = currentSchedule.month.split('-').map(Number);
  const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
  
  if (worker.unavailableWeekdays.includes(dayOfWeek)) {
    errors.push({
      type: 'warning',
      message: `${worker.name} está indisponível às ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]}s.`,
      workerId: worker.id
    });
  }

  // Verificar restrições específicas do mês
  const monthRestrictions = worker.monthlyRestrictions[currentSchedule.month] || [];
  if (monthRestrictions.includes(day)) {
    errors.push({
      type: 'warning',
      message: `${worker.name} tem restrição específica para o dia ${day}.`,
      workerId: worker.id
    });
  }

  return errors;
}