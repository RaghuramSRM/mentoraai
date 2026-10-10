// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearToken, getToken, request, setToken } from "./api";

describe("API client", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("stores and clears authentication tokens", () => {
    setToken("token-123");
    expect(getToken()).toBe("token-123");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("adds the bearer token and returns JSON", async () => {
    setToken("token-123");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(request("/health")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/health"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token-123" }) }));
  });

  it("surfaces API detail messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ detail: "Not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } }));
    await expect(request("/protected")).rejects.toThrow("Not allowed");
  });

  it("handles rate limiting 429 status code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ detail: "Too Many Requests" }), { status: 429, headers: { "Content-Type": "application/json" } }));
    await expect(request("/rate-limited")).rejects.toThrow("Rate limit exceeded");
  });
});
