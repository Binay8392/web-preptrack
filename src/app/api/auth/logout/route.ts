import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SESSION_COOKIE_NAME = "__session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
