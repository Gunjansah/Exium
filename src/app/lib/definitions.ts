export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}; 