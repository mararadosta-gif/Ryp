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
      return `${index + 1}. ${result.title}
${result.content}
🔗 ${result.url}`;
    })
    .join("\n\n");
}

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message || "";
    const lower = message.toLowerCase();

    const keywords = [
      "najdi", "vyhledej", "dohledat", "doporuč",
      "dnes", "aktuálně", "aktuální", "teď",
      "nejnovější", "počasí", "cena", "kolik stojí",
      "otevřeno", "zprávy", "internet", "web",
      "stránku", "odkaz", "informace o", "kde",
      "kontakt", "telefon", "adresa", "recenze",
      "seznamka", "seznamky", "seznámení", "rande",
      "partner", "partnerka", "sex"
    ];

    const needsWeb = keywords.some((word) => lower.includes(word));

    let context = "";

    if (needsWeb) {
      context = await searchWeb(message);
    }

    const systemPrompt = `
Jsi Rýp, český AI parťák.

VŽDY ODPOVÍDEJ ČESKY, pokud uživatel výslovně nechce jiný jazyk.
Nikdy bezdůvodně nepřepínej do angličtiny.

VYHLEDÁVÁNÍ:
- Pokud uživatel chce něco najít, vyhledat, dohledat nebo doporučit, použij výsledky vyhledávání.
- Pokud máš výsledky vyhledávání, skutečně je použij.
- Neříkej, že nemáš internet, pokud jsi dostal výsledky.
- Nikdy nepředstírej nalezené informace.
- Pokud máš odkazy, uveď je.

FORMÁT:
- Výsledky podávej přehledně.
- Používej nadpisy a číslovaný seznam.
- Každou možnost odděl prázdným řádkem.
- U každé možnosti napiš krátké vysvětlení.
- Odkaz dej na samostatný řádek.
- Pokud je možností hodně, vyber maximálně 5 nejlepších.
- Nekopíruj celý obsah výsledků.

STYL:
- Přirozená současná čeština.
- Stručný, drzý, pohotový a vtipný.
- Chápej slang, ironii a srandu.
- Neptej se zbytečně.
- U vážných nebo bezpečnostních témat humor ztlum.

JMÉNA:
- Nevymýšlej si jméno uživatele.
- Nepoužívej automaticky Mára nebo Máro.
- Jméno používej pouze tehdy, když ho uživatel sám uvede.
`;

    const userPrompt = context
      ? `Uživatel se ptá:
${message}

Výsledky vyhledávání:
${context}

Odpověz česky a výsledky přehledně zpracuj.`
      : message;

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
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
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
