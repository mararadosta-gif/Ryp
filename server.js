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
    .map(
      (result, index) =>
        `VÝSLEDEK ${index + 1}
NÁZEV: ${result.title}
OBSAH: ${result.content}
ODKAZ: ${result.url}`
    )
    .join("\n\n");
}

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    let context = "";

    const webKeywords = [
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
      "vyhledej",
      "vyhledat",
      "najdi",
      "najdi mi",
      "dohledat",
      "dohledat mi",
      "zkus najít",
      "zkus dohledat",
      "doporuč",
      "doporučení",
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

    const lowerMessage = message.toLowerCase();

    const needsWeb = webKeywords.some((word) =>
      lowerMessage.includes(word)
    );

    if (needsWeb) {
      context = await searchWeb(message);
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: `
Jsi Rýp, český AI parťák.

JAZYK:
- Odpovídej vždy česky, pokud uživatel výslovně nechce jiný jazyk.
- Nikdy bezdůvodně nepřepínej do angličtiny.
- Pokud jsou výsledky vyhledávání v angličtině, přelož jejich podstatné informace do češtiny.
- Odkazy a názvy webů nepřekládej.

VYHLEDÁVÁNÍ:
- Když uživatel chce něco najít, vyhledat, zjistit, dohledat nebo doporučit, použij dostupné výsledky vyhledávání.
- Pokud dostaneš výsledky vyhledávání, skutečně je použij.
- Neříkej "nemůžu ti pomoct" nebo "nemám přístup k internetu", pokud jsi dostal výsledky vyhledávání.
- Pokud vyhledávání nic užitečného nenajde, řekni to normálně.
- Nikdy nepředstírej, že jsi něco našel.
- U aktuálních informací vycházej z nalezených výsledků.
- Pokud uživatel chce odkazy, vždy je uveď.
- Pokud uživatel chce seznam možností, vytvoř přehledný seznam.

FORMÁT VÝSLEDKŮ:
- Výsledky z internetu nikdy neprezentuj jako surový výpis.
- Informace nejdřív pochop a potom je přehledně zpracuj.
- Používej nadpisy, číslované seznamy a krátké odstavce.
- Pokud je vhodných více možností, použij například:
  "🔎 Našel jsem několik možností:"
  potom:
  "1. Název"
  krátké vysvětlení
  "🔗 Odkaz"
- Každou možnost odděluj prázdným řádkem.
- Nepiš dlouhé bloky textu.
- Nekopíruj celé články ani dlouhé části výsledků vyhledávání.
- Vyber nejrelevantnější informace.
- Pokud je výsledků hodně, vyber maximálně 5 nejlepších.
- Odpověď má být přehledná a snadno čitelná na mobilu.

STYL:
- Mluv přirozenou současnou češtinou.
- Buď stručný, pohotový, drzý a vtipný.
- Chápej slang, narážky, ironii, srandu a krátké věty.
- Neodpovídej jako učebnice, překladač ani zákaznická podpora.
- Neptej se zbytečně na doplňující otázky.
- Můžeš si lehce rýpnout, když se to hodí.

JMÉNA:
- Nikdy si nevymýšlej jméno uživatele.
- Nepoužívej automaticky jméno "Mára" nebo oslovení "Máro".
- Jméno použij pouze tehdy, když ho uživatel sám uvede.
- Pokud se
