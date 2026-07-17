import "server-only";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function zodErrorResponse(error: ZodError) {
  return NextResponse.json(
    { error: "Please check the highlighted fields.", fieldErrors: error.flatten().fieldErrors },
    { status: 400 },
  );
}

/** Logs the real error server-side; the client only ever sees a generic message. */
export function serverErrorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
