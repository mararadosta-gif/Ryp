const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Rýp 2.0 běží 😈" });
});

// =====================================================
// WEB VYHLEDÁVÁNÍ – TAVILY
// =====================================================

async function searchWeb(query) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
      max_results: 5,
    }),
  });

  if (!response.ok) {
    throw new Error("Tavily search failed");
  }

  const data = await response.json();

  return (data.results || [])
    .map((result, index) => {
      return [
        `VÝSLEDEK ${index + 1}`,
        `NÁZEV: ${result.title || ""}`,
        `OBSAH: ${result.content || ""}`,
        `URL: ${result.url || ""}`,
      ].join("\n");
    })
    .join("\n\n");
}

// =====================================================
// ROZHODNUTÍ, ZDA JE POTŘEBA WEB
// =====================================================

function needsWebSearch(message) {
  const lower = message.toLowerCase();

  const webKeywords = [
    "najdi",
    "vyhledej",
    "dohledat",
    "ověř",
    "over",
    "prověř",
    "prover",
    "aktuálně",
    "aktualne",
    "aktuální",
    "aktualni",
    "dnes",
    "teď",
    "ted",
    "nejnovější",
    "nejnovejsi",
    "počasí",
    "pocasi",
    "cena",
    "kolik stojí",
    "kolik stoji",
    "otevřeno",
    "otevreno",
    "zprávy",
    "zpravy",
    "internet",
    "web",
    "stránku",
    "stranku",
    "odkaz",
    "kontakt",
    "telefon",
    "adresa",
    "recenze",
    "nabídka",
    "nabidka",
    "prodej",
    "pronájem",
    "pronajem",
    "nemovitost",
    "dům",
    "dum",
    "byt",
    "jízdní řád",
    "jizdni rad",
    "spoj",
    "vlak",
    "autobus",
  ];

  return webKeywords.some((word) => lower.includes(word));
}

// =====================================================
// TVŮRCE
// =====================================================

function isCreatorQuestion(message) {
  const lower = message.toLowerCase();

  return (
    lower.includes("kdo tě vytvořil") ||
    lower.includes("kdo te vytvoril") ||
    lower.includes("kdo tě udělal") ||
    lower.includes("kdo te udelal") ||
    lower.includes("kdo tě vyrobil")
