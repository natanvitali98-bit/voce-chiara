// Voce Chiara: fa girare il "Cervello sul telefono" (Gemma) in un processo separato,
// così l'app resta fluida mentre l'AI pensa.
import { WebWorkerMLCEngineHandler } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
