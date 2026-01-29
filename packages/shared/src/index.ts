export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type UserRole = 'USER' | 'AGENT' | 'ADMIN';

export interface UserDto {
  id: string;
  name: string;
  role: UserRole;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponseDto {
  user: AuthUserDto;
}

export interface CreateTicketDto {
  title: string;
  description?: string;
}

export interface AssignTicketDto {
  assigneeId: string;
}

export interface CreateCommentDto {
  text: string;
}

export interface CommentDto {
  id: string;
  ticketId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface TicketDto {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  creatorId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
}

export interface SlaPolicyDto {
  responseMinutes: number;
  resolveMinutes: number;
}

export interface TicketSlaDto {
  ticketId: string;
  isBreached: boolean;
  responseDueAt: string;
  resolveDueAt: string;
  checkedAt: string;
}

export type AuditEventType =
  | 'TICKET_CREATED'
  | 'SLA_BREACHED'
  | 'TICKET_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'STATUS_CHANGED';

export interface AuditLogDto {
  id: string;
  eventType: AuditEventType;
  entityId: string;
  createdAt: string;
}
