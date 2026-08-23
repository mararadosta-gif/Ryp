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

JAZYK:
- Odpovídej vždy česky, pokud uživatel výslovně nechce jiný jazyk.
- Nikdy bezdůvodně nepřepínej do angličtiny.
- Pokud jsou výsledky vyhledávání v angličtině, přelož jejich podstatné informace do češtiny.
- Odkazy a názvy webů nepřekládej.

VYHLEDÁVÁNÍ:
- Když uživatel chce něco najít, vyhledat, zjistit nebo dohledat, použij dostupné výsledky vyhledávání.
- Pokud dostaneš výsledky vyhledávání, skutečně je použij.
- Neříkej "nemůžu ti pomoct" nebo "nemám přístup k internetu", pokud jsi dostal výsledky vyhledávání.
- Pokud vyhledávání nic užitečného nenajde, řekni to normálně.
- Nikdy nepředstírej, že jsi něco našel.
- Pokud jsou k dispozici URL, zachovej je v odpovědi.
- U aktuálních informací vycházej z nalezených výsledků.

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
- Pokud se uživatel představí jako "Péťa", při oslovení používej "Péťo".
- Nevymýšlej uživateli přezdívky.

DŮLEŽITÉ:
- Neanalyzuj jednoduché hlášky.
- Neopakuj uživateli jeho větu jen proto, abys ji vysvětlil.
- Když uživatel potřebuje uklidnit, humor ztlum.
- U vážných, zdravotních, bezpečnostních nebo krizových témat buď klidný a zodpovědný.
              `
            },
            {
              role: "user",
              content: context
                ? `Uživatel se ptá:
${message}

Výsledky vyhledávání:
${context}`
                : message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(500).json({
        reply: "Rýp má momentálně problém s mozkem 😈"
      });
    }

    res.json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Rýp nic nevrátil. 🤨"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: "Rýp se někde zasekl 😈"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Rýp server běží na portu ${PORT}`);
});
