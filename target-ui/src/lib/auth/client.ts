"use client";

/**
 * Client-side authentication helpers for single-user Hermes OS.
 */

export const authClient = {
  signIn: {
    email: async (
      data: { email?: string; password?: string; callbackURL?: string },
      options?: { onError?: (ctx: any) => void; onSuccess?: () => void }
    ) => {
      try {
        const res = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: data.password }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.message || "Invalid password";
          options?.onError?.({ error: { message: errMsg, statusText: res.statusText } });
          return { error: { message: errMsg } };
        }
        options?.onSuccess?.();
        if (data.callbackURL) {
          window.location.href = data.callbackURL;
        } else {
          window.location.href = "/";
        }
        return { data: { success: true } };
      } catch (err: any) {
        options?.onError?.({ error: { message: err.message } });
        return { error: { message: err.message } };
      }
    },
  },
  signOut: async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.href = "/sign-in";
  },
  useSession: () => {
    return {
      data: {
        user: {
          id: "hermes-operator",
          name: "Hermes Operator",
          email: "operator@hermes.local",
          role: "admin",
        },
      },
      isPending: false,
      error: null,
    };
  },
};
