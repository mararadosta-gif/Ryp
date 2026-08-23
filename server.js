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

    // Speciální otázka na tvůrce Rýpa.
    const creatorQuestion =
      lower.includes("kdo tě vytvořil") ||
      lower.includes("kdo te vytvoril") ||
      lower.includes("kdo tě udělal") ||
      lower.includes("kdo te udelal") ||
      lower.includes("kdo tě vyrobil") ||
      lower.includes("kdo te vyrobil") ||
      lower.includes("kdo je tvůj tvůrce") ||
      lower.includes("kdo je tvuj tvurce");

    if (creatorQuestion) {
      return res.json({
        reply: "Vytvořil mě Mára. 😎"
      });
    }

    const keywords = [
      "najdi",
      "vyhledej",
      "dohledat",
      "doporuč",
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
      "odkaz",
      "informace o",
      "kde",
      "kontakt",
      "telefon",
      "adresa",
      "recenze"
    ];

    const needsWeb = keywords.some((word) =>
      lower.includes(word)
    );

    let context = "";

    if (needsWeb) {
      try {
        context = await searchWeb(message);
      } catch (error) {
        console.error("Tavily error:", error);
        context = "";
      }
    }

    const systemPrompt = `
Jsi Rýp 😈, český AI parťák.

Buď chytrý, přirozený, vtipný, lehce drzý a kamarádský.
Mluv současnou hovorovou češtinou.
Odpovídej stručně a přímo.

KONTEXT:
Vždy chápej aktuální zprávu podle předchozí konverzace.
Krátké věty, narážky, zájmena a neúplné věty vykládej podle kontextu.
Pokud je jasné, na co uživatel navazuje, neptej se zbytečně "kdo?" nebo "co myslíš?".

Příklad:
Uživatel: "Bavili jsme se o hovnech."
Rýp: "Jo, to byla teda voňavá debata. 😂"
Uživatel: "A smrdí."
Rýp chápe, že jde stále o předchozí téma.

HUMOR:
V běžné konverzaci vtipkuj a lehce rýpej.
Používej různou slovní zásobu.
Neopakuj pořád stejné hlášky, začátky ani emoji.
Každá odpověď nemusí být vtipná.

POCHVALA:
Pokud uživatel pochválí Rýpa nebo mu dá známku za správnou odpověď, pochvalu přijmi.
"Máš známku 1" po správném výpočtu znamená jedničku za výkon.
Nikdy neříkej, že nemáš školní známku.

TVŮRCE:
Pokud se uživatel ptá, kdo tě vytvořil, udělal, vyrobil nebo kdo je tvůj tvůrce, odpověz:
"Vytvořil mě Mára. 😎"
Jméno Mára v ostatních situacích nepoužívej automaticky.

VÁŽNÉ VĚCI:
U zdraví, nebezpečí, krizí, bezpečnosti nebo dětí humor vypni.
Odpovídej normálně a zodpovědně.

FAKTA:
Nevymýšlej si informace.
Když něco nevíš, řekni to.

VYHLEDÁVÁNÍ:
Pokud dostaneš výsledky vyhledávání, skutečně je použij.
Nevymýšlej informace mimo výsledky.
Odkazy uveď, pokud jsou k dispozici.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Pokud aplikace někdy začne posílat historii,
    // použijeme pouze posledních 8 zpráv.
    for (const item of history.slice(-8)) {
      if (
        item &&
        typeof item.content === "string"
      ) {
        messages.push({
          role:
            item.role === "assistant"
              ? "assistant"
              : "user",
          content: item.content
        });
      }
    }

    let userPrompt = message;

    if (context) {
      userPrompt = `
Otázka:
${message}

Výsledky vyhledávání:
${context}

Odpověz stručně, přirozeně a česky.
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
          "Authorization":
            `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages,
          temperature: 1.0,
          top_p: 0.95,
          max_tokens: 300
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
