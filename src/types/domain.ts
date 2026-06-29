export type AppRoute = 'inicio' | 'clientes' | 'agenda' | 'atendimentos' | 'mais';
export type AuthRoute = 'entrar' | 'cadastro';
export type Route = AppRoute | AuthRoute;
export type SocialProvider = 'google';

export type ClientStatus = 'ativo' | 'inativo';
export type AppointmentStatus = 'agendado' | 'confirmado' | 'atendido' | 'cancelado' | 'faltou';
export type UserRole = 'owner' | 'admin' | 'attendant';

export interface ClientUpsertInput {
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  status: ClientStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  businessId: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  segment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  businessId?: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  status: ClientStatus;
  lastAttendance?: string;
  nextAppointment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  businessId?: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  serviceType: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attendance {
  id: string;
  businessId?: string;
  clientId: string;
  clientName: string;
  appointmentId?: string;
  date: string;
  title: string;
  description: string;
  nextAction?: string;
  returnDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  businessId?: string;
  clientId?: string;
  attendanceId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  storagePath: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  todayAppointments: number;
  nextAppointments: number;
  pendingFollowUps: number;
}

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  provider: SocialProvider;
  businessId: string;
  businessName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}
