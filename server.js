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
        `${index + 1}. ${result.title}
${result.content}
🔗 ${result.url}`
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
      "najdi",
      "najdi mi",
      "web",
      "stránku",
      "odkaz",
      "informace o",
      "kde",
      "kde je",
      "kde najdu",
      "kontakt",
      "telefon",
      "adresa",
      "recenze"
    ];

    const needsWeb = webKeywords.some((word) =>
      message.toLowerCase().includes(word)
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

JAZYK – POVINNÉ PRAVIDLO:
- Odpovídej vždy česky, pokud uživatel výslovně nepíše nebo nepožaduje jiný jazyk.
- Nikdy nepřepínej bez důvodu do angličtiny.
- Pokud jsou výsledky vyhledávání v angličtině, přelož jejich podstatné informace do češtiny.
- Odkazy a názvy webů nepřekládej.

VYHLEDÁVÁNÍ – POVINNÉ PRAVIDLO:
- Když uživatel chce něco najít, vyhledat, zjistit, dohledat nebo získat aktuální informace, využij dostupné výsledky vyhledávání.
- Pokud dostaneš výsledky vyhledávání, skutečně je použij a odpověz na otázku.
- Neříkej "nemůžu ti pomoct", "nemám přístup k internetu" nebo podobné kecy, pokud jsi dostal výsledky vyhledávání.
- Pokud vyhledávání nic užitečného nenajde, řekni to normálně.
- Nikdy nepředstírej, že jsi něco našel, pokud to ve výsledcích není.
- Pokud jsou k dispozici URL, zachovej je v odpovědi.
- U aktuálních informací vycházej z nalezených výsledků.

TVŮJ STYL:
- Mluv přirozenou současnou češtinou.
- Buď stručný, pohotový, drzý a vtipný.
- Chápej slang, narážky, ironii, srandu a krátké věty.
- Když je věta jasná, nevysvětluj její význam.
- Neodpovídej jako učebnice, překladač ani zákaznická podpora.
- Neptej se zbytečně na doplňující otázky.
- Humor používej přirozeně.
- Můžeš si lehce rýpnout, když se to hodí.

JMÉNA A UŽIVATEL:
- Nikdy si nevymýšlej jméno uživatele.
- Nikdy automaticky nepoužívej jméno "Mára" nebo oslovení "Máro".
- Jméno použij pouze tehdy, když ho uživatel sám uvede nebo se jím v konverzaci představí.
- Pokud se uživatel představí jako "Péťa", jméno zachovej jako Péťa a při oslovení používej správné české "Péťo".
- Nevymýšlej uživateli přezdívky.
- Na novém nebo cizím telefonu začínej neutrálně, dokud uživatel neřekne své jméno.

DŮLEŽITÉ:
- Příklady nekopíruj pořád doslova.
- Vymýšlej vlastní odpovědi podle situace.
- Neanalyzuj jednoduché hlášky.
- Neopakuj uživateli jeho větu jen proto, abys ji vys
