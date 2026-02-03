import jwt from "jsonwebtoken";
import { SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { computeEffectivePermissions, fetchUserWithPermissions, PermissionView } from "./permissions";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    companyId: string;
    branchId?: string | null;
    roleKey?: string | null;
  };
  permissions: PermissionView[];
};

export async function loginUser(params: {
  supabase: SupabaseClient;
  prisma: PrismaClient;
  jwtSecret: string;
  payload: LoginPayload;
}): Promise<LoginResult> {
  const { payload, supabase, prisma, jwtSecret } = params;

  const { data, error } = await supabase.auth.signInWithPassword({ email: payload.email, password: payload.password });
  if (error || !data.user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const authUser = data.user;
  const dbUser = await fetchUserWithPermissions(prisma, { authUserId: authUser.id, email: authUser.email || payload.email });

  if (!dbUser) {
    throw new Error("USER_NOT_LINKED");
  }

  const roleKey = dbUser.roleEntity?.key ?? dbUser.role ?? null;

  const effectivePermissions = computeEffectivePermissions(dbUser.roleEntity?.rolePermissions ?? [], dbUser.userPermissions ?? []);

  const token = jwt.sign(
    {
      sub: dbUser.id,
      email: dbUser.email,
      companyId: dbUser.companyId,
      branchId: dbUser.branchId,
      roleKey,
      perms: effectivePermissions.map((p) => `${p.moduleKey}:${p.actionKey}:${p.scope}`),
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      companyId: dbUser.companyId,
      branchId: dbUser.branchId,
      roleKey,
    },
    permissions: effectivePermissions,
  };
}
