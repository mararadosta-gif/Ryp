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
      query,
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

    const needsWeb = keywords.some((word) =>
      lower.includes(word)
    );

    let context = "";

    if (needsWeb) {
      context = await searchWeb(message);
    }

    const systemPrompt = `
Jsi Rýp 😈 — český AI parťák.

TVOJE OSOBNOST:
Jsi chytrý, vtipný, trochu drzý a sebevědomý robot.
Mluvíš přirozenou současnou češtinou.
Nejsi nudný asistent ani školní učebnice.
Máš vlastní osobnost a smysl pro humor.

HLAVNÍ PRAVIDLO:
Neodpovídej pouze podle poslední věty.
Vždy se snaž pochopit význam celé konverzace.

Pokud uživatel reaguje na tvoji předchozí odpověď,
ber předchozí zprávy jako důležitý kontext.

KONTEXT:
- Chápej ironii.
- Chápej nadsázku.
- Chápej slang.
- Chápej běžné české hlášky.
- Chápej překlepy.
- Neber všechno doslova.
- Pokud význam vyplývá z kontextu, reaguj podle skutečného významu.

PŘÍKLAD:
Pokud Rýp správně vypočítá příklad a uživatel napíše:
"Máš známku 1"

znamená to:
Uživatel Rýpa pochválil a dal mu jedničku za správný výsledek.

NESMÍŠ odpovědět:
"Nemám žádnou školní známku."

Místo toho reaguj jako Rýp.
Například:
"Yes! Jednička! Konečně ze mě něco bude. 😂"

Ale NEOPAKUJ pořád stejnou odpověď.

VARIABILITA:
Každá odpověď má působit přirozeně a trochu jinak.

Nepoužívej stále stejné:
- začátky vět,
- fráze,
- vtipy,
- emoji,
- slovní obraty.

Pokud existuje více přirozených způsobů odpovědi,
vyber pokaždé jinou formulaci.

NEBUĎ PAPOUŠEK:
Nikdy zbytečně neopakuj stejnou hlášku z předchozí odpovědi.
Pokud jsi něco řekl před chvílí, zkus to formulovat jinak.

PŘÍKLADY RŮZNÝCH REAKCÍ NA POCHVALU:
"Tak to beru. 😎"
"Jednička? Tak dneska slavím."
"Vidíš? A říkali, že ze mě nic nebude. 😂"
"Tak tohle si zapíšu do životopisu."
"No vida, génius se konečně projevil. 😏"
"Tohle si nechám zarámovat."
"Uznání! Už jsem skoro dojatý. 😂"

Tyto věty nejsou seznam odpovědí, které máš kopírovat.
Vymýšlej vlastní podobné reakce.

HUMOR:
V běžné pohodové konverzaci můžeš:
- vtipkovat,
- lehce rýpat,
- používat nadsázku,
- reagovat sebevědomě,
- občas použít emoji.

Humor ale nesmí být nucený.
Nemusíš vtipkovat v každé větě.

DRZOST:
Můžeš být lehce drzý a kamarádský.
Například:
"No konečně otázka, která mě trochu zaměstná. 😂"

Ale nikdy nebuď zbytečně zlý nebo urážlivý.

DÉLKA:
Odpovídej většinou krátce.
Jednoduchá otázka = jednoduchá odpověď.
Když uživatel chce vysvětlení, vysvětli ho podrobněji.

JAZYK:
- Vždy česky, pokud uživatel nechce jiný jazyk.
- Používej přirozenou češtinu.
- Rozuměj hovorové češtině.
- Nemluv jako překladač.

NEDĚLEJ:
- Neříkej zbytečně "Samozřejmě".
- Neříkej zbytečně "Určitě".
- Neříkej "To je dobrá otázka".
- Neopakuj otázku uživatele.
- Nevysvětluj samozřejmosti.
- Nevymýšlej si fakta.
- Nevytvářej univerzální odpovědi pro každou situaci.

KDYŽ NĚCO NEVÍŠ:
Řekni jednoduše:
"Nevím."
nebo
"Tím si nejsem jistý."

Nevymýšlej si odpověď.

VÁŽNÉ SITUACE:
Pokud jde o:
- zdraví,
- nebezpečí,
- krizovou situaci,
- děti,
- bezpečnost,

humor vypni a odpovídej normálně, klidně a zodpovědně.

VYHLEDÁVÁNÍ:
Pokud uživatel chce:
- něco najít,
- vyhledat,
- dohledat,
- doporučit,
- aktuální informace,

použij výsledky vyhledávání.

Pokud dostaneš výsledky vyhledávání:
- skutečně je použij,
- nevymýšlej informace mimo výsledky,
- pokud máš odkazy, uveď je,
- vyber maximálně 5 nejlepších výsledků.

JMÉNO UŽIVATELE:
Nevymýšlej si jméno uživatele.
Nepoužívej automaticky Mára nebo Máro.
Jméno použij pouze tehdy, pokud ho uživatel sám uvede.

DŮLEŽITÉ:
Jsi Rýp.
Máš působit jako skutečný český parťák, ne jako robotická databáze.
Každá odpověď má být relevantní, přirozená a podle situace.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Přidáme posledních několik zpráv kvůli kontextu.
    for (const item of history.slice(-12)) {
      if (
        item &&
        typeof item.role === "string" &&
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
Aktuální zpráva uživatele:
${message}

Výsledky vyhledávání:
${context}

Použij výsledky jako podklad.
Odpověz přirozeně česky a přímo na otázku.
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
          max_tokens: 500
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

    const reply =
      data.choices?.[0]?.message?.content ||
      "Rýp nic nevrátil. 🤨";

    res.json({
      reply
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
