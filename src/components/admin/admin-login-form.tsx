"use client";

import { useActionState } from "react";
import {
  loginAction,
  type LoginState,
} from "@/src/services/auth/actions";

const initialState: LoginState = { error: null };

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={nextPath} />

      <label className="flex flex-col gap-2 text-sm font-medium uppercase text-accent">
        Email
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          className="border border-foreground/20 bg-background px-3 py-2 text-base font-normal normal-case text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium uppercase text-accent">
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="border border-foreground/20 bg-background px-3 py-2 text-base font-normal normal-case text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      {state.error ? (
        <p className="text-sm font-medium text-accent" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-accent px-4 py-3 text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
