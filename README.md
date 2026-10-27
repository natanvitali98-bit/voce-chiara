# Voce Chiara

App personale (sito installabile su iPhone) per allenarsi a parlare italiano a voce e per la memoria.

- `public/` – l'app (una pagina, installabile dalla schermata Home)
- `netlify/functions/ai.mts` – il Cervello: chiama Gemini con la chiave in `MY_GEMINI_KEY`
- `netlify/functions/state.mts` – salva i progressi (Netlify Blobs)

Variabili d'ambiente su Netlify: `APP_CODE` (codice personale), `MY_GEMINI_KEY` (chiave gratuita di Google AI Studio).
