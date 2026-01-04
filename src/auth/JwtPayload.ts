export interface AuthTokenPayload {
  id: string;
  email: string;
  role: "admin" | "user";
}
