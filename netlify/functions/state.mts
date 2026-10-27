// Salvataggio dei progressi di Voce Chiara (un solo utente), protetto dal codice personale.
import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const code = Netlify.env.get("APP_CODE");
  if (!code || (req.headers.get("x-code") || "").trim().toLowerCase() !== code.toLowerCase())
    return Response.json({ code: "bad_code" }, { status: 401 });

  const store = getStore({ name: "voce-chiara", consistency: "strong" });
  if (req.method === "GET") {
    const d = await store.get("state", { type: "json" });
    return Response.json(d || { json: null, updatedAt: 0 });
  }
  const b: any = await req.json().catch(() => null);
  if (!b || typeof b.json !== "string" || b.json.length > 3_000_000)
    return Response.json({ code: "bad_request" }, { status: 400 });
  await store.setJSON("state", { json: b.json, updatedAt: Number(b.updatedAt) || Date.now() });
  return Response.json({ ok: true });
};

export const config: Config = { path: "/api/state", method: ["GET", "PUT"] };
