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

export function validateScheduleGeneration(group: Group, workers: DutyWorker[]): ValidationError[] {
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

  // Verificar se há workers disponíveis para os turnos básicos (D e N)
  // P e ND são combinações, então não precisam de validação separada
  const basicShifts = group.validShifts.filter(shift => shift === 'D' || shift === 'N');
  basicShifts.forEach(shift => {
    const availableWorkers = workers.filter(w => 
      w.preferences.includes(shift) || 
      w.preferences.includes('P') || 
      w.preferences.includes('ND')
    );
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
  const errors = validateScheduleGeneration(group, workers);
  
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
  
  // Inicializar contadores
  workers.forEach(worker => {
    workerHours[worker.id] = 0;
  });
  
  // Inicializar assignments para todos os dias
  for (let day = 1; day <= daysInMonth; day++) {
    assignments[day.toString()] = [];
  }

  // Calcular quantos plantões cada worker precisa
  const workerTargetShifts: { [workerId: string]: number } = {};
  workers.forEach(worker => {
    // Assumindo que cada plantão tem a duração padrão do grupo
    workerTargetShifts[worker.id] = Math.floor(worker.monthlyHours / group.defaultShiftHours);
  });

  // Distribuir plantões de forma equilibrada
  let totalAssignmentsNeeded = 0;
  workers.forEach(worker => {
    totalAssignmentsNeeded += workerTargetShifts[worker.id];
  });

  // Algoritmo de distribuição: tentar preencher cada dia com os turnos necessários
  const availableDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Para cada worker, tentar distribuir seus plantões
  workers.forEach(worker => {
    const targetHours = worker.monthlyHours;
    let currentHours = 0;
    
    // Múltiplas tentativas para tentar completar a carga horária
    let attempts = 0;
    const maxAttempts = 10;
    
    while (currentHours < targetHours && attempts < maxAttempts) {
      attempts++;
      
      // Embaralhar os dias para distribuição mais aleatória a cada tentativa
      const shuffledDays = [...availableDays].sort(() => Math.random() - 0.5);
      
      for (const day of shuffledDays) {
        if (currentHours >= targetHours) break;
        
        const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
        
        // Verificar se o worker pode trabalhar neste dia
        if (worker.unavailableWeekdays.includes(dayOfWeek)) continue;
        
        // Verificar restrições específicas do mês
        const monthRestrictions = worker.monthlyRestrictions[month] || [];
        if (monthRestrictions.includes(day)) continue;
        
        // Verificar regra de descanso
        const lastShift = workerLastShift[worker.id];
        if (lastShift) {
          const hoursWorked = SHIFT_CONFIGS[lastShift.shift].hours;
          if (hoursWorked >= 24 && (day - lastShift.day) < 2) continue;
        }
        
        // Verificar se o worker já está trabalhando neste dia
        const dayKey = day.toString();
        const alreadyWorking = assignments[dayKey].some(a => a.workerId === worker.id);
        if (alreadyWorking) continue;
        
        // Tentar encontrar um turno compatível com as preferências do worker
        let assignedShift: ShiftType | null = null;
        
        // Embaralhar as preferências
        const shuffledPreferences = [...worker.preferences].sort(() => Math.random() - 0.5);
        
        for (const shiftType of shuffledPreferences) {
          // Verificar se este turno está nos turnos válidos do grupo
          if (!group.validShifts.includes(shiftType)) continue;
          
          // Verificar se as horas não vão ultrapassar o limite
          const hoursToAdd = SHIFT_CONFIGS[shiftType].hours;
          if (currentHours + hoursToAdd > targetHours) continue;
          
          // Para ND, verificar se não ultrapassa o mês
          if (shiftType === 'ND' && day >= daysInMonth) continue;
          
          // Verificar conflitos no dia atual
          const existingAssignments = assignments[dayKey];
          let hasConflict = false;
          
          for (const assignment of existingAssignments) {
            const existingShift = assignment.shift;
            
            // P ocupa o dia inteiro - não pode coexistir com nada
            if (shiftType === 'P' || existingShift === 'P') {
              hasConflict = true;
              break;
            }
            
            // D e N podem coexistir, mas não com P
            if ((shiftType === 'D' && existingShift === 'D') || 
                (shiftType === 'N' && existingShift === 'N')) {
              hasConflict = true;
              break;
            }
          }
          
          // Verificar regras de descanso obrigatório
          if (!hasConflict) {
            hasConflict = !hasAdequateRest(worker.id, day, shiftType, assignments, daysInMonth);
          }
          
          // Para ND, verificar conflito no dia seguinte
          if (!hasConflict && shiftType === 'ND' && day < daysInMonth) {
            const nextDayKey = (day + 1).toString();
            const nextDayAssignments = assignments[nextDayKey];
            
            // Verificar se o worker já trabalha no próximo dia
            const workerInNextDay = nextDayAssignments.some(a => a.workerId === worker.id);
            if (workerInNextDay) {
              hasConflict = true;
            } else {
              // Verificar se há conflito com D no próximo dia
              const hasDConflict = nextDayAssignments.some(a => a.shift === 'D' || a.shift === 'P');
              if (hasDConflict) {
                hasConflict = true;
              }
            }
          }
          
          if (!hasConflict) {
            assignedShift = shiftType;
            break;
          }
        }
        
        if (assignedShift) {
          // Para ND, criar dois assignments separados: N no dia atual e D no próximo
          if (assignedShift === 'ND' && day < daysInMonth) {
            // N no dia atual
            assignments[day.toString()].push({
              workerId: worker.id,
              shift: 'N',
              hours: 12
            });
            
            // D no dia seguinte
            const nextDay = (day + 1).toString();
            assignments[nextDay].push({
              workerId: worker.id,
              shift: 'D',
              hours: 12
            });
            
            currentHours += 24;
            workerLastShift[worker.id] = { day: day + 1, shift: 'D' };
          } else if (assignedShift === 'P') {
            // Para P, criar dois assignments no mesmo dia: D e N
            assignments[day.toString()].push({
              workerId: worker.id,
              shift: 'D',
              hours: 12
            });
            
            assignments[day.toString()].push({
              workerId: worker.id,
              shift: 'N',
              hours: 12
            });
            
            currentHours += 24;
            workerLastShift[worker.id] = { day, shift: 'P' };
          } else {
            // Turnos simples D ou N
            assignments[day.toString()].push({
              workerId: worker.id,
              shift: assignedShift,
              hours: SHIFT_CONFIGS[assignedShift].hours
            });
            
            currentHours += SHIFT_CONFIGS[assignedShift].hours;
            workerLastShift[worker.id] = { day, shift: assignedShift };
          }
        }
      }
    }
    
    // Atualizar o contador de horas do worker
    workerHours[worker.id] = currentHours;
  });

  // Verificar se todos os workers atingiram sua carga horária EXATA
  workers.forEach(worker => {
    const achieved = workerHours[worker.id];
    const target = worker.monthlyHours;
    
    if (achieved !== target) {
      errors.push({
        type: 'error',
        message: `${worker.name}: carga horária deve ser exatamente ${target}h, mas foi calculada ${achieved}h. Tente gerar a escala novamente.`,
        workerId: worker.id
      });
    }
  });

  // Se algum worker não completou exatamente a carga, retornar erro
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
  assignments: { [day: string]: Assignment[] },
  workers: DutyWorker[],
  year: number,
  monthNum: number
): { warnings: ValidationError[] } {
  const warnings: ValidationError[] = [];
  const worker = workers.find(w => w.id === assignment.workerId);
  
  if (!worker) {
    warnings.push({
      type: 'error',
      message: 'Plantonista não encontrado.'
    });
    return { warnings };
  }

  const daysInMonth = getDaysInMonth(year, monthNum);

  // Verificar preferências
  if (worker.preferences.length > 0 && !worker.preferences.includes(assignment.shift)) {
    warnings.push({
      type: 'warning',
      message: `${worker.name} não tem preferência para turnos do tipo "${SHIFT_CONFIGS[assignment.shift].label}".`,
      workerId: worker.id,
      day
    });
  }

  // Verificar indisponibilidade por dia da semana
  const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
  
  if (worker.unavailableWeekdays.includes(dayOfWeek)) {
    warnings.push({
      type: 'warning',
      message: `${worker.name} está indisponível às ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]}s.`,
      workerId: worker.id,
      day
    });
  }

  // Verificar restrições específicas do mês
  const monthKey = `${year}-${monthNum.toString().padStart(2, '0')}`;
  const monthRestrictions = worker.monthlyRestrictions[monthKey] || [];
  if (monthRestrictions.includes(day)) {
    warnings.push({
      type: 'warning',
      message: `${worker.name} tem restrição específica para o dia ${day}.`,
      workerId: worker.id,
      day
    });
  }

  // Verificar regras de descanso obrigatório
  if (!hasAdequateRest(worker.id, day, assignment.shift, assignments, daysInMonth)) {
    const shiftHours = SHIFT_CONFIGS[assignment.shift].hours;
    const requiredRestDays = shiftHours >= 24 ? 2 : 1;
    warnings.push({
      type: 'warning',
      message: `${worker.name} não tem descanso suficiente (${requiredRestDays} dia${requiredRestDays > 1 ? 's' : ''}) entre plantões.`,
      workerId: worker.id,
      day
    });
  }

  return { warnings };
}

/*
 * REGRAS DE DESCANSO OBRIGATÓRIO IMPLEMENTADAS:
 * 
 * 1. Após plantão de 12h (turnos D ou N): mínimo 1 dia de descanso
 * 2. Após plantão de 24h (turnos P ou ND): mínimo 2 dias de descanso
 * 
 * Essas regras garantem:
 * - Distribuição mais homogênea dos plantões
 * - Qualidade de vida dos plantonistas  
 * - Cumprimento de boas práticas médicas
 * - Prevenção de fadiga excessiva
 * 
 * As regras são aplicadas tanto na geração automática quanto na edição manual.
 */

/**
 * Verifica se um worker tem descanso suficiente entre plantões
 * Regras:
 * - Após 12h de plantão: mínimo 1 dia de descanso
 * - Após 24h de plantão: mínimo 2 dias de descanso
 */
function hasAdequateRest(
  workerId: string, 
  proposedDay: number, 
  proposedShift: ShiftType,
  assignments: { [day: string]: Assignment[] },
  daysInMonth: number
): boolean {
  const proposedHours = SHIFT_CONFIGS[proposedShift].hours;
  
  // Verificar plantões anteriores
  for (let checkDay = Math.max(1, proposedDay - 7); checkDay < proposedDay; checkDay++) {
    const checkDayAssignments = assignments[checkDay.toString()] || [];
    const workerAssignments = checkDayAssignments.filter(a => a.workerId === workerId);
    
    if (workerAssignments.length > 0) {
      // Calcular total de horas trabalhadas neste dia
      const totalHours = workerAssignments.reduce((sum, a) => sum + a.hours, 0);
      
      // Determinar dias de descanso necessários
      let requiredRestDays = 0;
      if (totalHours >= 24) {
        requiredRestDays = 2;
      } else if (totalHours >= 12) {
        requiredRestDays = 1;
      }
      
      // Verificar se há descanso suficiente
      if (requiredRestDays > 0) {
        const daysSinceWork = proposedDay - checkDay - 1; // -1 porque não conta o dia do trabalho
        if (daysSinceWork < requiredRestDays) {
          return false;
        }
      }
    }
  }
  
  // Verificar plantões posteriores (para evitar conflitos futuros)
  const maxCheckDay = Math.min(daysInMonth, proposedDay + 7);
  for (let checkDay = proposedDay + 1; checkDay <= maxCheckDay; checkDay++) {
    const checkDayAssignments = assignments[checkDay.toString()] || [];
    const workerAssignments = checkDayAssignments.filter(a => a.workerId === workerId);
    
    if (workerAssignments.length > 0) {
      // Determinar dias de descanso necessários após o plantão proposto
      let requiredRestDays = 0;
      if (proposedHours >= 24) {
        requiredRestDays = 2;
      } else if (proposedHours >= 12) {
        requiredRestDays = 1;
      }
      
      // Verificar se haverá descanso suficiente
      if (requiredRestDays > 0) {
        const daysBetween = checkDay - proposedDay - 1; // -1 porque não conta o dia do trabalho proposto
        if (daysBetween < requiredRestDays) {
          return false;
        }
      }
    }
  }
  
  return true;
}