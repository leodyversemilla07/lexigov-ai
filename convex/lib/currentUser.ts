import type { UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type UserLookupCtx = Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">;

async function findUserByClerkId(ctx: UserLookupCtx, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();
}

function getIdentityName(identity: UserIdentity) {
  const fullName = [identity.givenName, identity.familyName].filter(Boolean).join(" ").trim();
  if (identity.name) return identity.name;
  if (fullName) return fullName;
  return identity.nickname ?? identity.preferredUsername ?? undefined;
}

function getIdentityEmail(identity: UserIdentity) {
  return identity.email ?? `${identity.subject}@clerk.local`;
}

export async function getCurrentUser(ctx: UserLookupCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await findUserByClerkId(ctx, identity.subject);
}

export async function getOrCreateUserFromIdentity(
  ctx: MutationCtx,
  identity: UserIdentity,
): Promise<Doc<"users">> {
  const existingUser = await findUserByClerkId(ctx, identity.subject);
  const email = getIdentityEmail(identity);
  const name = getIdentityName(identity);
  const now = Date.now();

  if (existingUser) {
    if (existingUser.email !== email || existingUser.name !== name) {
      await ctx.db.patch(existingUser._id, {
        email,
        name,
        updatedAt: now,
      });

      return {
        ...existingUser,
        email,
        name,
        updatedAt: now,
      };
    }

    return existingUser;
  }

  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    email,
    name,
    role: "LEGISLATIVE_STAFF",
    createdAt: now,
    updatedAt: now,
  });

  const createdUser = await ctx.db.get(userId);
  if (!createdUser) {
    throw new Error("Failed to create user");
  }

  return createdUser;
}

export async function requireCurrentUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  return await getOrCreateUserFromIdentity(ctx, identity);
}
