export type MailAddress = {
  name: string;
  address: string;
};

export type MailMessage = {
  uid: number;
  messageId: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  text: string;
  html?: string;
  date: string;
  flags: string[];
  folder: string;
};

export type MailMessagePreview = {
  uid: number;
  messageId: string;
  from: MailAddress;
  to: MailAddress[];
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  flagged: boolean;
  answered: boolean;
  folder: string;
};

export type MailFolder = {
  name: string;
  path: string;
  total: number;
  unread: number;
  specialUse?: string;
};

export type SendEmailRequest = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
};

export type ReplyRequest = {
  uid: number;
  folder: string;
  text: string;
  html?: string;
  replyAll: boolean;
};

export type ForwardRequest = {
  uid: number;
  folder: string;
  to: string[];
  text: string;
  html?: string;
};

export type FlagUpdateRequest = {
  folder: string;
  add?: string[];
  remove?: string[];
};

export type MoveRequest = {
  fromFolder: string;
  toFolder: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
