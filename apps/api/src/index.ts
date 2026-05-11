import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./lib/env";
import health from "./routes/health";
import auth from "./routes/auth";
import pitch from "./routes/pitch";
import call from "./routes/call";
import audit from "./routes/audit";
import { startAuditWorker } from "./lib/audit/worker";
import { bindWebSocketLifecycle, onWsMessage, onWsClose } from "./lib/call/ws";

const e = env();

const app = new Hono();
app.use("*", logger());
app.use("*", cors({
  origin: [e.APP_BASE_URL, "http://localhost:3000"],
  credentials: true,
}));

app.get("/", (c) => c.text("RevAgent API"));

app.route("/api/health", health);
app.route("/api/auth", auth);
app.route("/api/pitch", pitch);
app.route("/api/call", call);
app.route("/api/audit", audit);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("[api error]", err);
  return c.json({ error: "Internal error", message: err.message }, 500);
});

interface CallStreamData { _callId: string }

const server = Bun.serve<CallStreamData>({
  port: e.PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    const match = url.pathname.match(/^\/api\/call\/([0-9a-f-]+)\/stream$/);
    if (match && req.headers.get("upgrade") === "websocket") {
      const callId = match[1]!;
      const ok = server.upgrade(req, { data: { _callId: callId } });
      if (!ok) return new Response("Failed to upgrade", { status: 426 });
      return undefined as unknown as Response;
    }
    return app.fetch(req, server);
  },
  websocket: {
    open(ws) { bindWebSocketLifecycle(ws); },
    message(ws, msg) { onWsMessage(ws, msg as string | Buffer); },
    close(ws) { onWsClose(ws); },
  },
});

console.log(`✅ RevAgent API on http://localhost:${server.port}`);

// Start the background audit worker (Postgres-backed queue).
void startAuditWorker().catch((err) => console.error("[audit worker]", err));
