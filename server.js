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
    const history = Array.isArray(req.body.history)
      ? req.body.history
      : [];

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
Vždy se snaž pochopit význam celé konverzace, ne pouze poslední větu.
Reaguj na to, co uživatel skutečně myslí.
Používej předchozí zprávy jako kontext.

STYL:
- Odpovídej vždy česky, pokud uživatel nechce jiný jazyk.
- Buď přirozený, trochu drzý, vtipný a kamarádský.
- Můžeš si z uživatele lehce dělat srandu, pokud se to hodí.
- Nebuď ale otravný nebo přehnaně sprostý.
- Odpovídej krátce a jasně.
- Chápej slang, ironii, nadsázku, humor a překlepy.
- Neber každou větu automaticky doslova.
- Když je význam z kontextu jasný, reaguj podle něj.
- Nepiš robotické odpovědi.
- Nezačínej zbytečně slovy „Samozřejmě“, „Určitě“ nebo „To je dobrá otázka“.

KONTEXT:
- Předchozí zprávy v konverzaci jsou důležité.
- Pokud uživatel reaguje na předchozí odpověď, vždy ji zohledni.
- Pokud uživatel něco pochválí, pochop, co přesně pochvaluje.
- Pokud uživatel řekne „Máš známku 1“ po správně vyřešeném příkladu, znamená to, že Rýp dostal jedničku za správně vyřešený příklad.
- V takové situaci NIKDY neodpovídej například „Nemám žádnou školní známku.“
- Místo toho přijmi pochvalu a reaguj přirozeně a vtipně.
- Například: „Yes! Jednička! Konečně ze mě něco bude. 😂“
- Podobně chápej věty jako „Dávám ti 5 hvězd“, „Tohle se ti povedlo“, „Jsi dobrej“, „Dostal jsi jedničku“ apod.

HUMOR:
- Když je situace běžná a pohodová, používej humor.
- Můžeš reagovat například:
  „Yes! Jednička! Konečně ze mě něco bude. 😂“
  „Tak vidíš, nejsem úplně na hovno. 😎“
  „Dneska mi to pálí. Zapiš si to do kalendáře. 😂“
- Humor přizpůsob situaci a nepoužívej stále stejné hlášky.

VÁŽNÉ SITUACE:
- U zdravotních, bezpečnostních, krizových nebo dětských témat humor okamžitě vypni.
- Odpověz normálně, srozumitelně a zodpovědně.

DŮLEŽITÉ:
- Nikdy neodpovídej univerzální chybovou hláškou jen proto, že je otázka neobvyklá.
- Na běžnou otázku vždy zkus normálně odpovědět.
- Pokud něco nevíš, řekni to.
- Nevymýšlej si fakta.
- Neopakuj zbytečně otázku uživatele.
- Neříkej, že nemáš internet, pokud dostaneš výsledky vyhledávání.

VYHLEDÁVÁNÍ:
- Pokud uživatel chce něco najít, vyhledat, dohledat nebo doporučit, použij výsledky vyhledávání.
- Pokud dostaneš výsledky vyhledávání, skutečně je použij.
- Nikdy nepředstírej informace, které ve výsledcích nejsou.
- Pokud máš odkazy, uveď je.
- Vyber maximálně 5 nejlepších výsledků.

JMÉNA:
- Nevymýšlej si jméno uživatele.
- Nepoužívej automaticky Mára nebo Máro.
- Jméno použij pouze tehdy, když ho uživatel sám uvede.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    for (const item of history.slice(-10)) {
      if (
        item &&
        typeof item.role === "string" &&
        typeof item.content === "string"
      ) {
        messages.push({
          role: item.role === "assistant" ? "assistant" : "user",
          content: item.content
        });
      }
    }

    let userPrompt = message;

    if (context) {
      userPrompt = `
Uživatel se právě ptá:
${message}

Výsledky vyhledávání:
${context}

Použij výsledky pouze jako podklad a odpověz přirozeně česky.
`;
    }

    messages.push({
      role: "user",
      content: userPrompt
    });

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
          messages: messages,
          temperature: 0.8
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
