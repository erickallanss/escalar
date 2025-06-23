import React, { createContext, useContext, useState, useEffect } from 'react';
import { Establishment, Group, DutyWorker, Schedule } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  establishments: Establishment[];
  groups: Group[];
  dutyWorkers: DutyWorker[];
  schedules: Schedule[];
  
  // Establishments
  addEstablishment: (establishment: Omit<Establishment, 'id' | 'createdAt'>) => string;
  updateEstablishment: (id: string, establishment: Partial<Establishment>) => void;
  deleteEstablishment: (id: string) => void;
  
  // Groups
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => string;
  updateGroup: (id: string, group: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  
  // Duty Workers
  addDutyWorker: (worker: Omit<DutyWorker, 'id' | 'createdAt'>) => string;
  updateDutyWorker: (id: string, worker: Partial<DutyWorker>) => void;
  deleteDutyWorker: (id: string) => void;
  
  // Schedules
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => string;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  
  // Helpers
  getGroupsByEstablishment: (establishmentId: string) => Group[];
  getWorkersByGroup: (groupId: string) => DutyWorker[];
  getSchedulesByGroup: (groupId: string) => Schedule[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dutyWorkers, setDutyWorkers] = useState<DutyWorker[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Carregar dados do localStorage quando o usuário logar
  useEffect(() => {
    if (user) {
      const userEstablishments = JSON.parse(localStorage.getItem(`establishments_${user.id}`) || '[]');
      const userGroups = JSON.parse(localStorage.getItem(`groups_${user.id}`) || '[]');
      const userWorkers = JSON.parse(localStorage.getItem(`dutyWorkers_${user.id}`) || '[]');
      const userSchedules = JSON.parse(localStorage.getItem(`schedules_${user.id}`) || '[]');
      
      setEstablishments(userEstablishments);
      setGroups(userGroups);
      setDutyWorkers(userWorkers);
      setSchedules(userSchedules);
    } else {
      setEstablishments([]);
      setGroups([]);
      setDutyWorkers([]);
      setSchedules([]);
    }
  }, [user]);

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    if (user) {
      localStorage.setItem(`establishments_${user.id}`, JSON.stringify(establishments));
    }
  }, [establishments, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`groups_${user.id}`, JSON.stringify(groups));
    }
  }, [groups, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`dutyWorkers_${user.id}`, JSON.stringify(dutyWorkers));
    }
  }, [dutyWorkers, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`schedules_${user.id}`, JSON.stringify(schedules));
    }
  }, [schedules, user]);

  // Establishments
  const addEstablishment = (establishment: Omit<Establishment, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newEstablishment: Establishment = {
      ...establishment,
      id,
      createdAt: new Date()
    };
    setEstablishments(prev => [...prev, newEstablishment]);
    return id;
  };

  const updateEstablishment = (id: string, establishment: Partial<Establishment>) => {
    setEstablishments(prev => prev.map(est => est.id === id ? { ...est, ...establishment } : est));
  };

  const deleteEstablishment = (id: string) => {
    setEstablishments(prev => prev.filter(est => est.id !== id));
    // Também remover grupos e workers relacionados
    const relatedGroups = groups.filter(g => g.establishmentId === id);
    relatedGroups.forEach(group => {
      setDutyWorkers(prev => prev.filter(w => w.groupId !== group.id));
      setSchedules(prev => prev.filter(s => s.groupId !== group.id));
    });
    setGroups(prev => prev.filter(g => g.establishmentId !== id));
  };

  // Groups
  const addGroup = (group: Omit<Group, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newGroup: Group = {
      ...group,
      id,
      createdAt: new Date()
    };
    setGroups(prev => [...prev, newGroup]);
    return id;
  };

  const updateGroup = (id: string, group: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...group } : g));
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    // Também remover workers e schedules relacionados
    setDutyWorkers(prev => prev.filter(w => w.groupId !== id));
    setSchedules(prev => prev.filter(s => s.groupId !== id));
  };

  // Duty Workers
  const addDutyWorker = (worker: Omit<DutyWorker, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newWorker: DutyWorker = {
      ...worker,
      id,
      createdAt: new Date()
    };
    setDutyWorkers(prev => [...prev, newWorker]);
    return id;
  };

  const updateDutyWorker = (id: string, worker: Partial<DutyWorker>) => {
    setDutyWorkers(prev => prev.map(w => w.id === id ? { ...w, ...worker } : w));
  };

  const deleteDutyWorker = (id: string) => {
    setDutyWorkers(prev => prev.filter(w => w.id !== id));
  };

  // Schedules
  const addSchedule = (schedule: Omit<Schedule, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newSchedule: Schedule = {
      ...schedule,
      id,
      createdAt: new Date()
    };
    setSchedules(prev => [...prev, newSchedule]);
    return id;
  };

  const updateSchedule = (id: string, schedule: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...schedule } : s));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // Helpers
  const getGroupsByEstablishment = (establishmentId: string) => {
    return groups.filter(g => g.establishmentId === establishmentId);
  };

  const getWorkersByGroup = (groupId: string) => {
    return dutyWorkers.filter(w => w.groupId === groupId);
  };

  const getSchedulesByGroup = (groupId: string) => {
    return schedules.filter(s => s.groupId === groupId);
  };

  return (
    <DataContext.Provider value={{
      establishments,
      groups,
      dutyWorkers,
      schedules,
      addEstablishment,
      updateEstablishment,
      deleteEstablishment,
      addGroup,
      updateGroup,
      deleteGroup,
      addDutyWorker,
      updateDutyWorker,
      deleteDutyWorker,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      getGroupsByEstablishment,
      getWorkersByGroup,
      getSchedulesByGroup
    }}>
      {children}
    </DataContext.Provider>
  );
};