export type Role = "ADMIN" | "MEMBER";
export type Status = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
export type User = { id: string; name: string; email: string; role: Role };
export type Lead = {
  id: string; name: string; email: string; phone?: string; company?: string; message?: string;
  status: Status; assigneeId?: string; assignee?: Pick<User, "id" | "name" | "email">;
  createdAt: string; updatedAt: string; _count?: { notes: number };
  notes?: Array<{ id: string; body: string; createdAt: string; author: Pick<User, "id" | "name"> }>;
  activities?: Array<{ id: string; action: string; details?: string; createdAt: string; actor?: Pick<User, "id" | "name"> }>;
};
