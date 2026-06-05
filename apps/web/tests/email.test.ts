import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("email templates", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it("renders an email verification template with subject, html, and text", async () => {
        const { renderEmailVerification } = await import("@/lib/email/templates");
        const result = renderEmailVerification({ name: "Maria", url: "https://example.com/verify?token=abc" });

        expect(result.subject).toContain("Verify");
        expect(result.html).toContain("https://example.com/verify?token=abc");
        expect(result.html).toContain("Maria");
        expect(result.html).toContain("LexiGov AI");
        expect(result.text).toContain("https://example.com/verify?token=abc");
    });

    it("escapes html-sensitive characters in user-provided names", async () => {
        const { renderEmailVerification } = await import("@/lib/email/templates");
        const result = renderEmailVerification({ name: "<script>alert(1)</script>", url: "https://x.test" });

        expect(result.html).not.toContain("<script>alert(1)</script>");
        expect(result.html).toContain("&lt;script&gt;");
    });

    it("falls back to a generic greeting when no name is supplied", async () => {
        const { renderEmailVerification, renderPasswordReset, renderTwoFactorCode } = await import(
            "@/lib/email/templates"
        );

        // The default greeting is "Hi," (no name appended).
        const verify = renderEmailVerification({ url: "https://x.test" });
        expect(verify.html).toMatch(/Hi,/);
        expect(verify.html).not.toMatch(/Hi\s+\w/); // not "Hi Something"
        expect(verify.text).toMatch(/^Hi,/m);

        const reset = renderPasswordReset({ url: "https://x.test" });
        expect(reset.html).toMatch(/Hi,/);
        expect(reset.text).toMatch(/^Hi,/m);

        const otp = renderTwoFactorCode({ code: "123456" });
        expect(otp.html).toMatch(/Hi,/);
        expect(otp.text).toMatch(/^Hi,/m);
    });

    it("embeds the 2FA code in the subject line as well as the body", async () => {
        const { renderTwoFactorCode } = await import("@/lib/email/templates");
        const result = renderTwoFactorCode({ code: "987654" });
        // The subject should include the code so users can identify the email
        // in their inbox without opening it.
        expect(result.subject).toContain("987654");
        expect(result.subject.toLowerCase()).toContain("verification");
    });

    it("produces a verification subject that identifies the email type", async () => {
        const { renderEmailVerification, renderPasswordReset } = await import("@/lib/email/templates");
        const verify = renderEmailVerification({ url: "https://x.test" });
        const reset = renderPasswordReset({ url: "https://x.test" });

        expect(verify.subject.toLowerCase()).toContain("verify");
        expect(reset.subject.toLowerCase()).toContain("password");
    });

    it("renders a password reset template that links to the reset url", async () => {
        const { renderPasswordReset } = await import("@/lib/email/templates");
        const result = renderPasswordReset({ url: "https://example.com/reset?token=xyz" });

        expect(result.subject).toContain("password");
        expect(result.html).toContain("https://example.com/reset?token=xyz");
        expect(result.text).toContain("https://example.com/reset?token=xyz");
    });

    it("renders a 2FA code template that surfaces the code in both html and text", async () => {
        const { renderTwoFactorCode } = await import("@/lib/email/templates");
        const result = renderTwoFactorCode({ code: "123456" });

        expect(result.subject).toContain("123456");
        expect(result.html).toContain("123456");
        expect(result.text).toContain("123456");
    });
});

describe("email service", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
        vi.restoreAllMocks();
    });

    it("uses the console provider by default", async () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
        const { sendEmail, getEmailProviderName } = await import("@/lib/email");

        const result = await sendEmail({
            to: "user@example.com",
            subject: "Test",
            html: "<p>hi</p>",
        });

        expect(getEmailProviderName()).toBe("console");
        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalled();
    });

    it("falls back to console when resend is selected without an api key", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        delete process.env.RESEND_API_KEY;

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
        const { sendEmail, getEmailProviderName } = await import("@/lib/email");

        await sendEmail({ to: "user@example.com", subject: "Test", html: "<p>hi</p>" });

        expect(getEmailProviderName()).toBe("console");
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("RESEND_API_KEY"));
        expect(logSpy).toHaveBeenCalled();
    });

    it("uses the resend provider and posts to the api when configured", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_key";
        process.env.EMAIL_FROM = "LexiGov AI <no-reply@example.com>";

        const fetchSpy = vi.fn(async () =>
            new Response(JSON.stringify({ id: "msg_123" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );
        vi.stubGlobal("fetch", fetchSpy);

        const { sendEmail, getEmailProviderName } = await import("@/lib/email");
        const result = await sendEmail({
            to: "user@example.com",
            subject: "Hello",
            html: "<p>hi</p>",
            text: "hi",
        });

        expect(getEmailProviderName()).toBe("resend");
        expect(result.success).toBe(true);
        expect(result.id).toBe("msg_123");
        expect(fetchSpy).toHaveBeenCalledWith(
            "https://api.resend.com/emails",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    Authorization: "Bearer re_test_key",
                }),
            }),
        );
    });

    it("returns a structured error when the resend api fails", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_key";

        vi.stubGlobal(
            "fetch",
            vi.fn(async () =>
                new Response(JSON.stringify({ error: { message: "domain not verified" } }), {
                    status: 422,
                    headers: { "Content-Type": "application/json" },
                }),
            ),
        );

        const { sendEmail } = await import("@/lib/email");
        const result = await sendEmail({ to: "user@example.com", subject: "Hi", html: "<p>hi</p>" });

        expect(result.success).toBe(false);
        expect(result.error).toBe("domain not verified");
    });

    it("sends a per-message from override and replyTo when supplied", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_key";
        process.env.EMAIL_FROM = "Default <no-reply@example.com>";

        const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response(JSON.stringify({ id: "msg_42" }), { status: 200 }),
        );
        vi.stubGlobal("fetch", fetchSpy);

        const { sendEmail } = await import("@/lib/email");
        await sendEmail({
            to: "user@example.com",
            subject: "Hello",
            html: "<p>hi</p>",
            from: "Override <override@example.com>",
            replyTo: "support@example.com",
        });

        const call = fetchSpy.mock.calls[0];
        expect(call).toBeDefined();
        const init = call?.[1] as RequestInit | undefined;
        expect(init?.body).toBeDefined();
        const body = JSON.parse(String(init?.body));
        expect(body.from).toBe("Override <override@example.com>");
        expect(body.reply_to).toBe("support@example.com");
    });

    it("falls back to the status text when the resend response has no error body", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_key";

        vi.stubGlobal(
            "fetch",
            vi.fn(async () =>
                new Response(null, {
                    status: 500,
                    statusText: "Internal Server Error",
                }),
            ),
        );

        const { sendEmail } = await import("@/lib/email");
        const result = await sendEmail({ to: "user@example.com", subject: "Hi", html: "<p>hi</p>" });
        expect(result.success).toBe(false);
        expect(result.error).toContain("500");
    });

    it("returns a structured error when the network call itself throws", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_key";

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("network unreachable");
            }),
        );

        const { sendEmail } = await import("@/lib/email");
        const result = await sendEmail({ to: "user@example.com", subject: "Hi", html: "<p>hi</p>" });
        expect(result.success).toBe(false);
        expect(result.error).toBe("network unreachable");
    });
});
