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
    .map((result) => `${result.title}: ${result.content}`)
    .join("\n\n");
}

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    let context = "";

    // Rýp použije internet hlavně u dotazů na aktuální informace
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
      "najdi"
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
              content:
                "Jsi Rýp, drzý a vtipný český AI parťák. Odpovídej česky, stručně a přirozeně. Pokud dostaneš výsledky z internetu, používej je jako zdroj aktuálních informací."
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
