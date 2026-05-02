import type { Session } from "next-auth";

import type { RoleKey } from "@/types";

const ADMIN_ROLES: RoleKey[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const USER_MANAGER_ROLES: RoleKey[] = ["SUPER_ADMIN", "ADMIN"];
const SYSTEM_MANAGER_ROLES: RoleKey[] = ["SUPER_ADMIN", "ADMIN"];

export function hasRole(session: Session | null, roles: RoleKey[]) {
  return Boolean(session?.user?.role && roles.includes(session.user.role));
}

export function getRole(session: Session | null) {
  return session?.user?.role ?? null;
}

export function isSuperAdmin(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN"]);
}

export function isAdmin(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN"]);
}

export function canAccessDashboard(session: Session | null) {
  return hasRole(session, ADMIN_ROLES) || hasRole(session, ["WRITER"]);
}

export function canModerateContent(session: Session | null) {
  return hasRole(session, ADMIN_ROLES);
}

export function canPublish(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
}

export function canManageUsers(session: Session | null) {
  return hasRole(session, USER_MANAGER_ROLES);
}

export function canManageSystemSettings(session: Session | null) {
  return hasRole(session, SYSTEM_MANAGER_ROLES);
}

export function canManageTaxonomy(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
}

export function canDeleteTaxonomy(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN"]);
}

export function canReviewWriterApplications(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
}

export function canManageComments(session: Session | null) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
}

export function canManageFeaturedArticles(session: Session | null) {
  return canPublish(session);
}

export function canAssignRole(
  session: Session | null,
  targetRole: RoleKey,
  currentTargetRole?: RoleKey | null,
) {
  if (isSuperAdmin(session)) {
    return true;
  }

  if (!hasRole(session, ["ADMIN"])) {
    return false;
  }

  return targetRole !== "SUPER_ADMIN" && currentTargetRole !== "SUPER_ADMIN";
}

export function canManageUserRole(
  session: Session | null,
  targetRole?: RoleKey | null,
) {
  if (isSuperAdmin(session)) {
    return true;
  }

  if (!hasRole(session, ["ADMIN"])) {
    return false;
  }

  return targetRole !== "SUPER_ADMIN";
}

export function canEditArticle(
  session: Session | null,
  article: { authorId: string; status?: string },
) {
  if (canModerateContent(session)) {
    return true;
  }

  return (
    hasRole(session, ["WRITER"]) &&
    session?.user.id === article.authorId &&
    !["APPROVED", "SCHEDULED", "PUBLISHED"].includes(article.status ?? "")
  );
}

export function canDeleteArticle(
  session: Session | null,
  article: { authorId: string; status: string },
) {
  if (isSuperAdmin(session) || hasRole(session, ["ADMIN"])) {
    return true;
  }

  return (
    hasRole(session, ["WRITER"]) &&
    session?.user.id === article.authorId &&
    ["DRAFT", "NEEDS_REVISION", "REJECTED"].includes(article.status)
  );
}
