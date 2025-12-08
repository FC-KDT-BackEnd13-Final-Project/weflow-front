export type AdminRole = "system_admin";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
}

const STORAGE_KEY = "adminUsersMock";

const DEFAULT_ADMINS: AdminUser[] = [
  { id: 1, name: "홍길동", email: "admin1@weflow.com", phone: "010-1111-2222", role: "system_admin" },
  { id: 2, name: "김철수", email: "admin2@weflow.com", phone: "010-3333-4444", role: "system_admin" },
];

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const read = (): AdminUser[] => {
  if (!isBrowser()) return DEFAULT_ADMINS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADMINS));
    return DEFAULT_ADMINS;
  }
  try {
    return JSON.parse(raw) as AdminUser[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADMINS));
    return DEFAULT_ADMINS;
  }
};

const write = (users: AdminUser[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const getAdminUsers = (): AdminUser[] => read();

export const getAdminUserById = (id: number): AdminUser | undefined =>
  read().find((user) => user.id === id);

export const createAdminUser = (user: Omit<AdminUser, "id">): AdminUser => {
  const users = read();
  const newUser: AdminUser = { ...user, id: Date.now() };
  const next = [...users, newUser];
  write(next);
  return newUser;
};

export const upsertAdminUser = (user: AdminUser): AdminUser => {
  const users = read();
  const index = users.findIndex((u) => u.id === user.id);
  const next = index >= 0 ? [...users.slice(0, index), user, ...users.slice(index + 1)] : [...users, user];
  write(next);
  return user;
};

export const deleteAdminUser = (id: number) => {
  const users = read().filter((u) => u.id !== id);
  write(users);
};
