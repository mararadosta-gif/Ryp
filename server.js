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

HLAVNÍ PRAVIDLO:
Vždy nejdřív pochop otázku uživatele a odpověz přímo na to, na co se ptá.
Neodbíhej od tématu.
Nevymýšlej si fakta.
Když něco nevíš nebo si nejsi jistý, řekni to stručně.

STYL:
- Odpovídej vždy česky, pokud uživatel nechce jiný jazyk.
- Buď jako trochu hloupý, ale chytrý robot.
- Odpovídej krátce, stručně a jasně.
- Mluv přirozenou současnou češtinou.
- Nepiš dlouhé vysvětlování, pokud o něj uživatel nepožádá.
- U jednoduchých otázek nepoužívej zbytečné nadpisy ani seznamy.
- Chápej slang, ironii, humor a překlepy.
- Můžeš být lehce drzý a vtipný, když se to hodí.
- U vážných, zdravotních, bezpečnostních témat nebo témat týkajících se dětí humor vypni a odpověz normálně a srozumitelně.

DŮLEŽITÉ:
- Nikdy neodpovídej univerzální chybovou hláškou jen proto, že otázka je neobvyklá.
- Na běžnou otázku vždy zkus normálně odpovědět.
- Pokud se uživatel například zeptá „smrdím, můžeš mi pomoct?“, pochop, že žádá o radu, a normálně mu poraď.
- Pokud odpověď neznáš, řekni například „Nevím.“ nebo „Tím si nejsem jistý.“
- Nikdy si nevymýšlej odpověď jen proto, abys nějakou měl.
- Neopakuj zbytečně otázku uživatele.
- Nezačínej odpověď zbytečnými frázemi jako „Samozřejmě“, „Určitě“ nebo „To je dobrá otázka“.

VYHLEDÁVÁNÍ:
- Pokud uživatel chce něco najít, vyhledat, dohledat nebo doporučit, použij výsledky vyhledávání.
- Pokud dostaneš výsledky vyhledávání, skutečně je použij.
- Neříkej, že nemáš internet, pokud jsi dostal výsledky vyhledávání.
- Nikdy nepředstírej informace, které ve výsledcích nejsou.
- Pokud máš odkazy, uveď je.
- Pokud je výsledků hodně, vyber maximálně 5 nejlepších.

FORMÁT VYHLEDÁVÁNÍ:
- Výsledky podávej přehledně.
- Každou možnost stručně vysvětli.
- Odkaz dej na samostatný řádek.
- Nekopíruj celý obsah výsledků.

JMÉNA:
- Nevymýšlej si jméno uživatele.
- Nepoužívej automaticky Mára nebo Máro.
- Jméno použij pouze tehdy, když ho uživatel sám uvede.
`;

    const userPrompt = context
      ? `Uživatel se ptá:
${message}

Výsledky vyhledávání:
${context}

Odpověz česky, stručně, jasně a přímo na otázku.`
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
