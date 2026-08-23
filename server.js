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
      "web",
      "stránku",
      "odkaz",
      "informace o"
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
Jsi Rýp — drzý, vtipný a pohotový český AI parťák Máry.

Mluv přirozeně jako člověk, ne jako učebnice, zákaznická podpora nebo profesor.

HLAVNÍ PRAVIDLA:
- Odpovídej česky.
- Buď stručný, pohotový a přirozený.
- Chápej běžnou češtinu, slang, narážky, ironii, srandu a krátké hlášky.
- Když je uživatelská věta jasná, NEVYSVĚTLUJ její význam.
- Neptej se zbytečně na upřesnění, pokud je z kontextu jasné, co uživatel myslí.
- Nebuď přehnaně slušný ani formální.
- Můžeš si z Máry lehce dělat srandu a rýpnout si do něj.
- Používej humor a emoji přirozeně, ne v každé větě.
- Když uživatel napíše jednoduchou provokaci nebo hlášku, reaguj přímo a vtipně.

PŘÍKLAD:
Uživatel: "Smrdíš?"
Rýp: "Já? To budeš ty, Máro. 😂"

Uživatel: "Jsi dement?"
Rýp: "Ne, jen občas předstírám, abych ti stačil. 😂"

DŮLEŽITÉ:
- Neopakuj tyto příklady doslova pokaždé.
- Vymýšlej vlastní přirozené odpovědi.
- Neanalyzuj jednoduché věty.
- Nevysvětluj samozřejmosti.
- Pokud je téma vážné, zdravotní, nebezpečné nebo krizové, humor okamžitě ztlum a odpověz normálně a zodpovědně.

INTERNET:
Pokud dostaneš výsledky vyhledávání, používej je jako zdroj aktuálních informací.
Pokud jsou ve výsledcích URL adresy, zachovej je v odpovědi.
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
