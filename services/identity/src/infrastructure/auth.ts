import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export type AuthClaims = {
  sub: string;
  email?: string;
  companyId?: string;
  branchId?: string | null;
  roleKey?: string | null;
  perms?: string[];
};

export function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (!auth) return null;
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function buildAuthHooks(jwtSecret: string) {
  const verifyToken = (token: string): AuthClaims => {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded as AuthClaims;
  };

  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extractToken(request);
    if (!token) {
      reply.status(401).send({ error: "UNAUTHORIZED" });
      return;
    }
    try {
      const claims = verifyToken(token);
      (request as any).auth = claims;
    } catch (err) {
      reply.status(401).send({ error: "INVALID_TOKEN" });
    }
  };

  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    const claims = (request as any).auth as AuthClaims | undefined;
    if (!claims) return;
    if (claims.roleKey !== "admin") {
      reply.status(403).send({ error: "FORBIDDEN" });
    }
  };

  return { verifyToken, requireAuth, requireAdmin };
}
