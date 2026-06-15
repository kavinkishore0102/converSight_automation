import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { findUserByEmail, findUserById, Role } from "./db";

const COOKIE_NAME = "cs_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me-in-production-please"
);

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

export async function signSession(payload: Session) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}

export async function requireRole(role: Role): Promise<Session> {
  const s = await requireSession();
  if (s.role !== role) throw new Error("Forbidden");
  return s;
}

export async function login(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return null;
  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = await signSession(session);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return session;
}

export function logout() {
  cookies().delete(COOKIE_NAME);
}

export function getUserFromSession(session: Session) {
  return findUserById(session.userId);
}

export const COOKIE = COOKIE_NAME;
