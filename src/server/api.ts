import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PlanLimitError, FeatureLockedError } from "@/lib/plans/limits";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, message: string, code?: string) {
  return NextResponse.json({ ok: false, error: { message, code } }, { status });
}

/** Wrap a route handler with consistent error mapping. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            ok: false,
            error: { message: "Datos inválidos", code: "VALIDATION", issues: e.flatten() },
          },
          { status: 422 }
        );
      }
      if (e instanceof ApiError) return fail(e.status, e.message, e.code);
      if (e instanceof PlanLimitError) return fail(402, e.message, e.code);
      if (e instanceof FeatureLockedError) return fail(403, e.message, e.code);
      console.error("[API ERROR]", e);
      return fail(500, "Error interno del servidor", "INTERNAL");
    }
  };
}
