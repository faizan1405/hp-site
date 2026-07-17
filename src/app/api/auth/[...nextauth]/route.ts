import { handlers } from "@/lib/auth";

/** MongoDB and Auth.js's database session strategy both require Node.js. */
export const runtime = "nodejs";

export const { GET, POST } = handlers;
