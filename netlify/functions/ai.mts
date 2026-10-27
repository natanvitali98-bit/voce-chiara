// Cervello di Voce Chiara: chiama Gemini con la chiave gratuita dell'utente (MY_GEMINI_KEY).
// Va direttamente a Google, non passa dall'AI Gateway di Netlify: così non consuma crediti Netlify.
import type { Config } from "@netlify/functions";

const GEMINI = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_AUDIO_B64 = 4_000_000; // circa 3 MB di audio, ~90 secondi a 16 kHz

function models(): string[] {
  const list = [Netlify.env.get("GEMINI_MODEL") || "gemini-flash-latest", "gemini-2.5-flash"];
  return [...new Set(list)];
}

export default async (req: Request) => {
  const key = Netlify.env.get("MY_GEMINI_KEY");
  if (req.method === "GET") return Response.json({ ready: !!key });

  const code = Netlify.env.get("APP_CODE");
  if (!code || (req.headers.get("x-code") || "").trim().toLowerCase() !== code.toLowerCase())
    return Response.json({ code: "bad_code" }, { status: 401 });
  if (!key) return Response.json({ code: "no_key" }, { status: 503 });

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ code: "bad_request" }, { status: 400 }); }
  const { input, json, audio } = body || {};
  if (audio && (typeof audio.data !== "string" || audio.data.length > MAX_AUDIO_B64))
    return Response.json({ code: "audio_too_big" }, { status: 413 });

  let contents: any[];
  if (Array.isArray(input)) {
    contents = input.slice(-24).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 8000) }],
    }));
  } else {
    contents = [{ role: "user", parts: [{ text: String(input || "").slice(0, 20000) }] }];
  }
  if (audio) contents[contents.length - 1].parts.unshift({ inline_data: { mime_type: audio.mime || "audio/wav", data: audio.data } });

  const base: any = { temperature: 0.7, maxOutputTokens: 2048 };
  if (json) base.responseMimeType = "application/json";

  for (const model of models()) {
    for (const fast of [true, false]) {
      const generationConfig = fast ? { ...base, thinkingConfig: { thinkingBudget: 0 } } : base;
      const r = await fetch(`${GEMINI}/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents, generationConfig }),
      });
      if (r.status === 404) break;            // modello non disponibile: prova il prossimo
      if (r.status === 400 && fast) continue; // il modello non accetta thinkingBudget: riprova senza
      if (r.status === 429) return Response.json({ code: "rate_limited" }, { status: 429 });
      const d: any = await r.json().catch(() => null);
      if (!r.ok) {
        console.log("gemini error", model, r.status, JSON.stringify(d).slice(0, 600));
        return Response.json({ code: r.status === 400 || r.status === 403 ? "no_key" : "ai_error" }, { status: 502 });
      }
      const text = (d?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("").trim();
      if (!json) return Response.json({ text });
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) try { parsed = JSON.parse(m[0]); } catch { /* resta null */ }
      }
      return Response.json({ json: parsed, text });
    }
  }
  return Response.json({ code: "ai_error" }, { status: 502 });
};

export const config: Config = { path: "/api/ai", method: ["GET", "POST"] };
