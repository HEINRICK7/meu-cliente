import type {
  Appointment,
  Attendance,
  Client,
  DashboardSummary,
  ClientStatus,
  ClientUpsertInput,
} from '../types/domain';

export const mockBusiness = {
  name: 'Meu Cliente Studio',
  segment: 'Serviços recorrentes',
  ownerName: 'João',
};

let mockClients: Client[] = [
  {
    id: 'cli_01',
    name: 'Mariana Costa',
    phone: '(11) 98888-1111',
    email: 'mariana@email.com',
    status: 'ativo',
    lastAttendance: '06/06/2026',
    nextAppointment: 'Hoje, 14:30',
    notes: 'Prefere avisos por mensagem.',
  },
  {
    id: 'cli_02',
    name: 'Carlos Lima',
    phone: '(11) 97777-2222',
    status: 'ativo',
    lastAttendance: '15/06/2026',
    nextAppointment: 'Amanhã, 10:00',
  },
  {
    id: 'cli_03',
    name: 'Fernanda Alves',
    phone: '(11) 96666-3333',
    status: 'ativo',
    lastAttendance: '25/06/2026',
  },
  {
    id: 'cli_04',
    name: 'Ricardo Souza',
    phone: '(11) 95555-4444',
    status: 'inativo',
    lastAttendance: '12/05/2026',
  },
  {
    id: 'cli_05',
    name: 'Patricia Nogueira',
    phone: '(11) 94444-5555',
    status: 'ativo',
    nextAppointment: '28/06, 17:00',
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt_01',
    clientId: 'cli_01',
    clientName: 'Mariana Costa',
    date: '28/06/2026',
    time: '14:30',
    serviceType: 'Retorno',
    status: 'agendado',
    notes: 'Chegar com 10 min de antecedencia.',
  },
  {
    id: 'apt_02',
    clientId: 'cli_02',
    clientName: 'Carlos Lima',
    date: '28/06/2026',
    time: '10:00',
    serviceType: 'Atendimento inicial',
    status: 'confirmado',
  },
  {
    id: 'apt_03',
    clientId: 'cli_05',
    clientName: 'Patricia Nogueira',
    date: '28/06/2026',
    time: '17:00',
    serviceType: 'Manutencao',
    status: 'atendido',
  },
  {
    id: 'apt_04',
    clientId: 'cli_03',
    clientName: 'Fernanda Alves',
    date: '30/06/2026',
    time: '09:00',
    serviceType: 'Acompanhamento',
    status: 'confirmado',
  },
];

export const mockAttendances: Attendance[] = [
  {
    id: 'att_01',
    clientId: 'cli_03',
    clientName: 'Fernanda Alves',
    date: '25/06/2026',
    title: 'Sessão realizada',
    description: 'Atendimento concluído com orientações finais.',
    nextAction: 'Retorno em 15 dias',
    returnDate: '10/07/2026',
  },
  {
    id: 'att_02',
    clientId: 'cli_01',
    clientName: 'Mariana Costa',
    date: '06/06/2026',
    title: 'Revisao',
    description: 'Ajustes executados com acompanhamento de rotina.',
  },
  {
    id: 'att_03',
    clientId: 'cli_02',
    clientName: 'Carlos Lima',
    date: '15/06/2026',
    title: 'Primeiro atendimento',
    description: 'Cadastro inicial e alinhamento de expectativa.',
  },
];

export function getDashboardSummary(): DashboardSummary {
  return {
    todayAppointments: 3,
    nextAppointments: 4,
    pendingFollowUps: 1,
  };
}

export function getTodayAppointments() {
  return mockAppointments.filter((appointment) => appointment.date === '28/06/2026');
}

export function getUpcomingAppointments() {
  return mockAppointments.filter((appointment) => appointment.date !== '28/06/2026');
}

export function getRecentClients() {
  return mockClients.slice(0, 2);
}

export function searchClients(query: string, status: 'todos' | ClientStatus) {
  const normalizedQuery = query.trim().toLowerCase();

  return mockClients.filter((client) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [client.name, client.phone, client.email ?? ''].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    const matchesStatus = status === 'todos' || client.status === status;

    return matchesQuery && matchesStatus;
  });
}

export function listClients() {
  return [...mockClients];
}

export function getClientById(id: string) {
  return mockClients.find((client) => client.id === id) ?? null;
}

export function createClient(input: ClientUpsertInput) {
  const now = new Date().toISOString();
  const client: Client = {
    id: `cli_${Date.now()}`,
    name: input.name,
    phone: input.phone,
    email: input.email,
    birthDate: input.birthDate,
    notes: input.notes,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  mockClients = [client, ...mockClients];

  return client;
}

export function updateClient(id: string, input: ClientUpsertInput) {
  const now = new Date().toISOString();
  let updatedClient: Client | null = null;

  mockClients = mockClients.map((client) => {
    if (client.id !== id) {
      return client;
    }

    updatedClient = {
      ...client,
      name: input.name,
      phone: input.phone,
      email: input.email,
      birthDate: input.birthDate,
      notes: input.notes,
      status: input.status,
      updatedAt: now,
    };

    return updatedClient;
  });

  return updatedClient;
}

export function getAgendaAppointments(view: 'hoje' | 'proximos' | 'semana') {
  if (view === 'hoje') {
    return getTodayAppointments();
  }

  if (view === 'proximos') {
    return getUpcomingAppointments();
  }

  return mockAppointments;
}
