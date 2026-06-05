import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the web app's typed fetch wrapper.
 * Covers Bearer auth from the cookie jar, JSON encoding, error normalization,
 * and the no-content fast path.
 *
 * Runs in the default node environment, so we stub a minimal `document.cookie`
 * shim that satisfies `getSessionToken` (which guards on `typeof document`).
 */

type FetchArgs = [input: string, init?: RequestInit];

function mockFetchOnce(response: { status?: number; body?: unknown; ok?: boolean; contentType?: string }) {
  return vi.fn(async (..._args: FetchArgs) => {
    const status = response.status ?? 200;
    const ok = response.ok ?? (status >= 200 && status < 300);
    // 204/205/304 responses must not have a body; the Response constructor enforces this.
    const isNoContent = status === 204 || status === 205 || status === 304;
    if (isNoContent) {
      return new Response(null, { status });
    }
    const body =
      response.body === undefined
        ? ""
        : typeof response.body === "string"
          ? response.body
          : JSON.stringify(response.body);
    return new Response(body, {
      status,
      headers: { "Content-Type": response.contentType ?? "application/json" },
    });
  });
}

/**
 * Minimal document.cookie shim. `getSessionToken` only checks `typeof document`
 * and reads `document.cookie`, so this is the full surface we need to satisfy.
 */
function installDocumentCookieShim(initialValue = "") {
  let cookieValue = initialValue;
  (globalThis as { document?: { cookie: string } }).document = {
    get cookie() {
      return cookieValue;
    },
    set cookie(_value: string) {
      // no-op: tests should use the returned setter to avoid test interop.
    },
  };
  return {
    set(value: string) {
      cookieValue = value;
    },
  };
}

let cookieShim: ReturnType<typeof installDocumentCookieShim>;

function setCookie(value: string) {
  cookieShim.set(value);
}

async function importFresh() {
  vi.resetModules();
  return import("@/lib/api-client");
}

beforeEach(() => {
  vi.unstubAllGlobals();
  cookieShim = installDocumentCookieShim("");
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api";
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as { document?: unknown }).document;
});

describe("api.get", () => {
  it("issues a GET against the configured API URL with the Bearer token from the cookie jar", async () => {
    setCookie("better-auth.session_token=session_abc; path=/");
    const fetchSpy = mockFetchOnce({ body: { ok: true } });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    const result = await api.get<{ ok: boolean }>("/drafts");

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("http://localhost:4000/api/drafts");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer session_abc");
  });

  it("omits the Authorization header when no session cookie is present", async () => {
    setCookie("");
    const fetchSpy = mockFetchOnce({ body: [] });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    await api.get("/drafts");

    const [, init] = fetchSpy.mock.calls[0]!;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("URL-decodes the cookie token before sending it as Bearer", async () => {
    setCookie("better-auth.session_token=token%20with%20spaces");
    const fetchSpy = mockFetchOnce({ body: null });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    await api.get("/drafts");

    const [, init] = fetchSpy.mock.calls[0]!;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token with spaces");
  });

  it("falls back to the local dev URL when NEXT_PUBLIC_API_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const fetchSpy = mockFetchOnce({ body: null });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    await api.get("/health");

    const [url] = fetchSpy.mock.calls[0]!;
    // The default dev URL is http://localhost:4000/api per api-client.ts
    expect(url).toBe("http://localhost:4000/api/health");
  });
});

describe("api.post", () => {
  it("serializes the body as JSON and sets the Content-Type header", async () => {
    setCookie("");
    const fetchSpy = mockFetchOnce({ status: 201, body: { id: "draft_1" } });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    const result = await api.post<{ id: string }>("/drafts", { title: "New Draft" });

    expect(result).toEqual({ id: "draft_1" });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("http://localhost:4000/api/drafts");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ title: "New Draft" }));
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("does not set Content-Type when no body is provided", async () => {
    setCookie("");
    const fetchSpy = mockFetchOnce({ body: { ok: true } });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    await api.post("/action");

    const [, init] = fetchSpy.mock.calls[0]!;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
  });
});

describe("api.delete", () => {
  it("issues a DELETE request with no body", async () => {
    setCookie("better-auth.session_token=token_xyz");
    const fetchSpy = mockFetchOnce({ status: 204 });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    const result = await api.delete<void>("/drafts/draft_1");

    expect(result).toBeUndefined();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("http://localhost:4000/api/drafts/draft_1");
    expect(init?.method).toBe("DELETE");
    expect(init?.body).toBeUndefined();
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token_xyz");
    expect(headers["Content-Type"]).toBeUndefined();
  });
});

describe("error handling", () => {
  it("throws an ApiError with the response body when the server returns a JSON error with a message", async () => {
    setCookie("");
    const fetchSpy = mockFetchOnce({ status: 401, body: { message: "Invalid session" } });
    vi.stubGlobal("fetch", fetchSpy);

    const { api, ApiError } = await importFresh();

    await expect(api.get("/drafts")).rejects.toBeInstanceOf(ApiError);
    await expect(api.get("/drafts")).rejects.toMatchObject({ status: 401, message: "Invalid session" });
  });

  it("uses the response statusText as the error message when the body is not JSON", async () => {
    setCookie("");
    const fetchSpy = vi.fn(async (..._args: FetchArgs) => {
      return new Response("plain text error", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { api, ApiError } = await importFresh();

    try {
      await api.get("/drafts");
      throw new Error("expected api.get to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(500);
        // The wrapper puts statusText in `message` when JSON parsing fails.
        expect(err.message).toBe("Internal Server Error");
      }
    }
  });

  it("uses a generic message when the error JSON has no message field", async () => {
    setCookie("");
    const fetchSpy = mockFetchOnce({ status: 400, body: { code: "BAD_REQUEST" } });
    vi.stubGlobal("fetch", fetchSpy);

    const { api, ApiError } = await importFresh();

    try {
      await api.get("/drafts");
      throw new Error("expected api.get to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(400);
        expect(err.message).toBe("Request failed: 400");
      }
    }
  });
});

describe("204 No Content", () => {
  it("returns undefined for 204 responses without parsing a body", async () => {
    setCookie("");
    const fetchSpy = mockFetchOnce({ status: 204 });
    vi.stubGlobal("fetch", fetchSpy);

    const { api } = await importFresh();
    const result = await api.delete<void>("/drafts/draft_1");

    expect(result).toBeUndefined();
  });
});
