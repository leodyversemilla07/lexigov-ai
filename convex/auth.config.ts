import type { AuthConfig } from "convex/server";

function getIssuerDomainFromPublishableKey(publishableKey?: string) {
  if (!publishableKey) {
    return undefined;
  }

  const segments = publishableKey.split("_");
  if (segments.length < 3) {
    return undefined;
  }

  try {
    const encodedDomain = segments.slice(2).join("_");
    const decodedDomain = Buffer.from(encodedDomain, "base64")
      .toString("utf8")
      .replace(/\$$/, "")
      .trim();

    if (!decodedDomain) {
      return undefined;
    }

    return decodedDomain.startsWith("http")
      ? decodedDomain
      : `https://${decodedDomain}`;
  } catch {
    return undefined;
  }
}

const clerkIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ??
  getIssuerDomainFromPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (!clerkIssuerDomain) {
  throw new Error(
    "Missing Clerk issuer domain. Set CLERK_JWT_ISSUER_DOMAIN or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.",
  );
}

export default {
  providers: [
    {
      type: "customJwt",
      issuer: clerkIssuerDomain,
      jwks: `${clerkIssuerDomain}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
