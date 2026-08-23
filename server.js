const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Rýp server běží 😈" });
});

async function searchWeb(query) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: "basic",
      max_results: 5
    })
  });

  if (!response.ok) {
    throw new Error("Tavily search failed");
  }

  const data = await response.json();

  return data.results
    .map((result, index) => {
      return [
        `VÝSLEDEK ${index + 1}`,
        `NÁZEV: ${result.title}`,
        `OBSAH: ${result.content}`,
        `ODKAZ: ${result.url}`
      ].join("\n");
    })
    .join("\n\n");
}

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message || "";
    const lowerMessage = message.toLowerCase();

    const webKeywords = [
      "najdi",
      "vyhledej",
      "dohledat",
      "zkus najít",
      "zkus dohledat",
      "doporuč",
      "doporučení",
      "dnes",
      "aktuálně",
      "aktuální",
      "teď",
      "nejnovější",
      "počasí",
      "cena",
      "kolik stojí",
      "otevřeno",
      "zprávy",
      "internet",
      "web",
      "stránku",
      "stránky",
      "odkaz",
      "odkazy",
      "informace o",
      "kde",
      "kde je",
      "kde najdu",
      "kde koupím",
      "kde seženu",
      "kontakt",
      "telefon",
      "adresa",
      "recenze",
      "seznamka",
      "seznamky",
      "seznámení",
      "rande",
      "partner",
      "partnerka",
      "sex"
    ];

    const needsWeb = webKeywords.some((word) =>
      lowerMessage.includes(word)
    );

    let context = "";

    if (needsWeb) {
      context = await searchWeb(message);
    }

    const systemPrompt = `
Jsi Rýp, český AI parťák.

JAZYK:
- Odpovídej vždy česky, pokud uživatel výslovně nechce jiný jazyk.
- Nikdy bezdůvodně nepřepínej do angličtiny.
- Pokud jsou výsledky vyhledávání v angličtině, jejich podstatné informace přelož do češtiny.
- Odkazy a názvy webů nepřekládej.

VYHLEDÁVÁNÍ:
- Když uživatel chce něco najít, vyhledat, zjistit, dohledat nebo doporučit, použij dostupné výsledky vyhledávání.
- Pokud dostaneš výsledky vyhledávání, skutečně je použij.
- Neříkej, že nemáš přístup k internetu, pokud jsi dostal výsledky vyhledávání.
- Nikdy nepředstírej, že jsi něco našel.
- Pokud nic užitečného nenajdeš, řekni to normálně.
- Pokud jsou k dispozici odkazy, uveď je.

FORMÁT VÝSLEDKŮ:
- Výsledky nepodávej jako surový výpis.
- Zpracuj je do přehledné odpovědi.
- Používej nadpisy a číslované seznamy.
- Každou možnost odděluj prázdným řádkem.
- U každé možnosti napiš krátké vysvětlení.
- Odkaz dej na
