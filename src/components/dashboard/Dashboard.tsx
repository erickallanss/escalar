import React from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export const Dashboard: React.FC = () => {
  const { establishments, groups, dutyWorkers, schedules } = useData();

  const stats = [
    {
      name: 'Estabelecimentos',
      value: establishments.length,
      icon: Building2,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Grupos',
      value: groups.length,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Plantonistas',
      value: dutyWorkers.length,
      icon: UserCheck,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Escalas Ativas',
      value: schedules.filter(s => s.status === 'confirmed').length,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  const recentSchedules = schedules
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de escalas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`${stat.bgColor} rounded-xl p-6`}>
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Building2 className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Novo Estabelecimento</h3>
            <p className="text-sm text-gray-600">Cadastrar nova clínica ou hospital</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Novo Grupo</h3>
            <p className="text-sm text-gray-600">Criar grupo de profissionais</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Calendar className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Gerar Escala</h3>
            <p className="text-sm text-gray-600">Criar nova escala de plantões</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schedules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Escalas Recentes</h2>
          
          {recentSchedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma escala encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSchedules.map((schedule) => {
                const group = groups.find(g => g.id === schedule.groupId);
                const establishment = establishments.find(e => 
                  group ? e.id === group.establishmentId : false
                );
                
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {group?.name} - {establishment?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {schedule.month} • {schedule.status === 'confirmed' ? 'Confirmada' : 'Rascunho'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {schedule.status === 'confirmed' ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h2>
          
          <div className="space-y-3">
            {/* Check for groups without workers */}
            {groups.filter(group => {
              const groupWorkers = dutyWorkers.filter(w => w.groupId === group.id);
              return groupWorkers.length === 0;
            }).map(group => {
              const establishment = establishments.find(e => e.id === group.establishmentId);
              return (
                <div key={group.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Grupo sem plantonistas
                    </p>
                    <p className="text-sm text-yellow-600">
                      {group.name} ({establishment?.name}) não possui plantonistas cadastrados
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Check for workers without monthly hours */}
            {dutyWorkers.filter(worker => !worker.monthlyHours || worker.monthlyHours <= 0).map(worker => {
              const group = groups.find(g => g.id === worker.groupId);
              return (
                <div key={worker.id} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Carga horária não definida
                    </p>
                    <p className="text-sm text-red-600">
                      {worker.name} ({group?.name}) sem carga horária mensal
                    </p>
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && establishments.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum alerta no momento</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};