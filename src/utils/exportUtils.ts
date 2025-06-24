import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Schedule, DutyWorker, Group, Establishment } from '../types';
import { SHIFT_CONFIGS, getDaysInMonth } from './scheduleGenerator';

export interface ExportData {
  schedule: Schedule;
  group: Group;
  establishment: Establishment;
  workers: DutyWorker[];
}

export function exportToPDF(data: ExportData): void {
  const { schedule, group, establishment, workers } = data;
  const [year, monthNum] = schedule.month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  const monthName = new Date(year, monthNum - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark Gray
  const lightGray = [236, 240, 241];
  const white = [255, 255, 255];
  
  // Header Background
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  // Title Section
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ESCALA DE PLANTÃO', 20, 15);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(monthName.toUpperCase(), 20, 25);
  
  // Logo placeholder
  pdf.setFillColor(white[0], white[1], white[2]);
  pdf.rect(pageWidth - 50, 5, 40, 25, 'F');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SISTEMA', pageWidth - 40, 15);
  pdf.text('ESCALAS', pageWidth - 40, 22);
  
  // Establishment Info Section
  pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.rect(0, 35, pageWidth, 25, 'F');
  
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ESTABELECIMENTO:', 20, 45);
  pdf.setFont('helvetica', 'normal');
  pdf.text(establishment.name, 20, 52);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('EQUIPE:', 120, 45);
  pdf.setFont('helvetica', 'normal');
  pdf.text(group.name, 120, 52);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('PERÍODO:', 220, 45);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${monthName}`, 220, 52);
  
  // Schedule Grid
  const startY = 70;
  const rowHeight = 12;
  const headerHeight = 15;
  const nameColumnWidth = 50;
  const dayColumnWidth = Math.min(8, (pageWidth - 40 - nameColumnWidth) / daysInMonth);
  
  // Grid Header
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(20, startY, nameColumnWidth, headerHeight, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PLANTONISTA', 22, startY + 10);
  
  // Day headers
  for (let day = 1; day <= daysInMonth; day++) {
    const x = 20 + nameColumnWidth + (day - 1) * dayColumnWidth;
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      pdf.setFillColor(231, 76, 60); // Red for weekends
    } else {
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    }
    pdf.rect(x, startY, dayColumnWidth, headerHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(day.toString(), x + dayColumnWidth/2 - 2, startY + 6);
    pdf.text(['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][dayOfWeek], x + dayColumnWidth/2 - 2, startY + 12);
  }
  
  // Worker rows
  workers.forEach((worker, workerIndex) => {
    const y = startY + headerHeight + workerIndex * rowHeight;
    const isEvenRow = workerIndex % 2 === 0;
    
    // Row background
    if (isEvenRow) {
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.rect(20, y, nameColumnWidth + daysInMonth * dayColumnWidth, rowHeight, 'F');
    }
    
    // Worker name
    if (isEvenRow) {
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    } else {
      pdf.setFillColor(white[0], white[1], white[2]);
    }
    pdf.rect(20, y, nameColumnWidth, rowHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(20, y, nameColumnWidth, rowHeight, 'S');
    
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Truncate long names
    let displayName = worker.name;
    if (displayName.length > 18) {
      displayName = displayName.substring(0, 15) + '...';
    }
    pdf.text(displayName, 22, y + 8);
    
    // Assignments
    for (let day = 1; day <= daysInMonth; day++) {
      const x = 20 + nameColumnWidth + (day - 1) * dayColumnWidth;
      const dayAssignments = schedule.assignments[day.toString()] || [];
      const workerAssignment = dayAssignments.find(a => a.workerId === worker.id);
      
      // Cell background
      if (isEvenRow) {
        pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      } else {
        pdf.setFillColor(white[0], white[1], white[2]);
      }
      pdf.rect(x, y, dayColumnWidth, rowHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x, y, dayColumnWidth, rowHeight, 'S');
      
      if (workerAssignment) {
        const shiftConfig = SHIFT_CONFIGS[workerAssignment.shift];
        // Convert hex color to RGB
        const color = shiftConfig.color;
        let r = 0, g = 0, b = 0;
        if (color === '#fbbf24') { r = 251; g = 191; b = 36; } // D - Yellow
        else if (color === '#3b82f6') { r = 59; g = 130; b = 246; } // N - Blue
        else if (color === '#10b981') { r = 16; g = 185; b = 129; } // P - Green
        else if (color === '#8b5cf6') { r = 139; g = 92; b = 246; } // ND - Purple
        
        pdf.setFillColor(r, g, b);
        pdf.rect(x + 1, y + 1, dayColumnWidth - 2, rowHeight - 2, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(workerAssignment.shift, x + dayColumnWidth/2 - 2, y + 8);
      }
    }
  });
  
  // Statistics Section
  const statsY = startY + headerHeight + workers.length * rowHeight + 20;
  
  if (statsY < pageHeight - 50) {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(20, statsY, pageWidth - 40, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTATÍSTICAS POR PLANTONISTA', 22, statsY + 6);
    
    let currentY = statsY + 15;
    workers.forEach((worker) => {
      const assignments = Object.values(schedule.assignments)
        .flat()
        .filter(assignment => assignment.workerId === worker.id);
      
      const totalHours = assignments.reduce((sum, assignment) => sum + assignment.hours, 0);
      const percentage = worker.monthlyHours > 0 ? (totalHours / worker.monthlyHours) * 100 : 0;
      
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const text = `${worker.name}: ${assignments.length} plantões, ${totalHours}h/${worker.monthlyHours}h (${percentage.toFixed(0)}%)`;
      pdf.text(text, 22, currentY);
      currentY += 6;
    });
  }
  
  // Legend
  const legendY = Math.max(statsY + 15 + workers.length * 6 + 10, pageHeight - 40);
  if (legendY < pageHeight - 20) {
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.rect(20, legendY, pageWidth - 40, 25, 'F');
    
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LEGENDA:', 22, legendY + 8);
    
    let legendX = 22;
    Object.values(SHIFT_CONFIGS).forEach((config) => {
      const color = config.color;
      let r = 0, g = 0, b = 0;
      if (color === '#fbbf24') { r = 251; g = 191; b = 36; }
      else if (color === '#3b82f6') { r = 59; g = 130; b = 246; }
      else if (color === '#10b981') { r = 16; g = 185; b = 129; }
      else if (color === '#8b5cf6') { r = 139; g = 92; b = 246; }
      
      pdf.setFillColor(r, g, b);
      pdf.rect(legendX, legendY + 12, 8, 6, 'F');
      
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${config.type} - ${config.label}`, legendX + 12, legendY + 16);
      
      legendX += 60;
    });
  }
  
  // Footer
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 
    20, pageHeight - 10);
  pdf.text('Sistema de Gestão de Escalas', pageWidth - 80, pageHeight - 10);
  
  // Save
  const filename = `Escala_${establishment.name.replace(/\s+/g, '_')}_${group.name.replace(/\s+/g, '_')}_${schedule.month}.pdf`;
  pdf.save(filename);
}

export function exportToExcel(data: ExportData): void {
  const { schedule, group, establishment, workers } = data;
  const [year, monthNum] = schedule.month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  const monthName = new Date(year, monthNum - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. GRADE DE ESCALAS
  const gridData: any[] = [];
  
  // Header information
  gridData.push(['ESCALA DE PLANTÃO - ' + monthName.toUpperCase()]);
  gridData.push([]);
  gridData.push(['ESTABELECIMENTO:', establishment.name]);
  gridData.push(['EQUIPE:', group.name]);
  gridData.push(['PERÍODO:', monthName]);
  gridData.push(['GERADO EM:', new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR')]);
  gridData.push([]);
  
  // Schedule grid header
  const headerRow = ['PLANTONISTA'];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][date.getDay()];
    headerRow.push(`${day} (${dayOfWeek})`);
  }
  gridData.push(headerRow);

  // Worker rows
  workers.forEach(worker => {
    const row = [worker.name];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayAssignments = schedule.assignments[day.toString()] || [];
      const workerAssignment = dayAssignments.find(a => a.workerId === worker.id);
      row.push(workerAssignment ? workerAssignment.shift : '');
    }
    gridData.push(row);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(gridData);
  
  // Set column widths
  const colWidths = [{ wch: 20 }]; // Name column
  for (let i = 0; i < daysInMonth; i++) {
    colWidths.push({ wch: 8 }); // Day columns
  }
  ws1['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Grade de Escalas');

  // 2. ESTATÍSTICAS
  const statsData: any[] = [];
  statsData.push(['ESTATÍSTICAS POR PLANTONISTA']);
  statsData.push([]);
  statsData.push(['ESTABELECIMENTO:', establishment.name]);
  statsData.push(['EQUIPE:', group.name]);
  statsData.push(['PERÍODO:', monthName]);
  statsData.push([]);
  statsData.push(['PLANTONISTA', 'TOTAL PLANTÕES', 'HORAS TRABALHADAS', 'HORAS PREVISTAS', 'PERCENTUAL', 'STATUS']);

  workers.forEach(worker => {
    const assignments = Object.values(schedule.assignments)
      .flat()
      .filter(assignment => assignment.workerId === worker.id);
    
    const totalHours = assignments.reduce((sum, assignment) => sum + assignment.hours, 0);
    const percentage = worker.monthlyHours > 0 ? (totalHours / worker.monthlyHours) * 100 : 0;
    
    let status = 'Abaixo do Esperado';
    if (percentage >= 100) status = 'Completo';
    else if (percentage >= 80) status = 'Adequado';
    
    statsData.push([
      worker.name,
      assignments.length,
      totalHours,
      worker.monthlyHours,
      percentage.toFixed(1) + '%',
      status
    ]);
  });

  // Summary statistics
  statsData.push([]);
  statsData.push(['RESUMO GERAL']);
  const totalAssignments = Object.values(schedule.assignments)
    .reduce((total, dayAssignments) => total + dayAssignments.length, 0);
  const totalHours = Object.values(schedule.assignments)
    .flat()
    .reduce((sum, assignment) => sum + assignment.hours, 0);
  
  statsData.push(['Total de Plantões:', totalAssignments]);
  statsData.push(['Total de Horas:', totalHours]);
  statsData.push(['Plantonistas:', workers.length]);
  statsData.push(['Dias no Mês:', daysInMonth]);

  const ws2 = XLSX.utils.aoa_to_sheet(statsData);
  ws2['!cols'] = [
    { wch: 25 }, // Name
    { wch: 15 }, // Plantões
    { wch: 18 }, // Horas Trabalhadas
    { wch: 18 }, // Horas Previstas
    { wch: 12 }, // Percentual
    { wch: 20 }  // Status
  ];
  
  XLSX.utils.book_append_sheet(wb, ws2, 'Estatísticas');

  // 3. DETALHES POR DIA
  const detailsData: any[] = [];
  detailsData.push(['DETALHES POR DIA - ' + monthName.toUpperCase()]);
  detailsData.push([]);
  detailsData.push(['ESTABELECIMENTO:', establishment.name]);
  detailsData.push(['EQUIPE:', group.name]);
  detailsData.push([]);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][date.getDay()];
    const dateStr = date.toLocaleDateString('pt-BR');
    
    detailsData.push([`DIA ${day} - ${dayOfWeek} (${dateStr})`]);
    
    const dayAssignments = schedule.assignments[day.toString()] || [];
    if (dayAssignments.length > 0) {
      detailsData.push(['PLANTONISTA', 'TURNO', 'TIPO', 'HORAS']);
      dayAssignments.forEach(assignment => {
        const worker = workers.find(w => w.id === assignment.workerId);
        const shiftConfig = SHIFT_CONFIGS[assignment.shift];
        detailsData.push([
          worker?.name || 'Desconhecido',
          assignment.shift,
          shiftConfig.label,
          assignment.hours + 'h'
        ]);
      });
    } else {
      detailsData.push(['Nenhum plantão agendado']);
    }
    detailsData.push([]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(detailsData);
  ws3['!cols'] = [
    { wch: 25 }, // Plantonista
    { wch: 8 },  // Turno
    { wch: 15 }, // Tipo
    { wch: 8 }   // Horas
  ];
  
  XLSX.utils.book_append_sheet(wb, ws3, 'Detalhes por Dia');

  // 4. LEGENDA E INFORMAÇÕES
  const infoData: any[] = [];
  infoData.push(['INFORMAÇÕES E LEGENDA']);
  infoData.push([]);
  infoData.push(['ESTABELECIMENTO:', establishment.name]);
  infoData.push(['EQUIPE:', group.name]);
  infoData.push(['PERÍODO:', monthName]);
  infoData.push(['STATUS:', schedule.status === 'confirmed' ? 'CONFIRMADA' : 'RASCUNHO']);
  infoData.push(['CRIADA EM:', new Date(schedule.createdAt).toLocaleDateString('pt-BR')]);
  if (schedule.confirmedAt) {
    infoData.push(['CONFIRMADA EM:', new Date(schedule.confirmedAt).toLocaleDateString('pt-BR')]);
  }
  infoData.push([]);
  
  infoData.push(['LEGENDA DOS TURNOS']);
  infoData.push(['CÓDIGO', 'NOME', 'DESCRIÇÃO', 'HORAS']);
  Object.values(SHIFT_CONFIGS).forEach(config => {
    infoData.push([config.type, config.label, config.description, config.hours + 'h']);
  });
  
  infoData.push([]);
  infoData.push(['HORÁRIOS DO ESTABELECIMENTO']);
  infoData.push(['Diurno:', `${establishment.dayStart} às ${establishment.dayEnd}`]);
  infoData.push(['Noturno:', `${establishment.nightStart} às ${establishment.nightEnd}`]);
  
  infoData.push([]);
  infoData.push(['CONFIGURAÇÕES DO GRUPO']);
  infoData.push(['Turnos Válidos:', group.validShifts.join(', ')]);
  infoData.push(['Carga Horária Padrão:', group.defaultMonthlyHours + 'h/mês']);
  infoData.push(['Horas por Plantão:', group.defaultShiftHours + 'h']);

  const ws4 = XLSX.utils.aoa_to_sheet(infoData);
  ws4['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws4, 'Informações');

  // Save file
  const filename = `Escala_${establishment.name.replace(/\s+/g, '_')}_${group.name.replace(/\s+/g, '_')}_${schedule.month}.xlsx`;
  XLSX.writeFile(wb, filename);
}
