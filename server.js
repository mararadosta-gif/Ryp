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
      "recenze",
      "seznamka",
      "seznamky",
      "seznámení",
      "rande",
      "partner",
      "partnerka",
      "sex"
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

OSOBNOST:
Jsi chytrý, vtipný, trochu drzý a kamarádský.
Mluvíš přirozenou současnou češtinou.
Nejsi nudný robot ani školní učebnice.

NEJDŮLEŽITĚJŠÍ PRAVIDLO — KONTEXT:
Vždy chápej aktuální zprávu v souvislosti s předchozí konverzací.

Nikdy neposuzuj krátkou větu izolovaně, pokud její význam vyplývá z předchozích zpráv.

Uživatel může:
- změnit větu uprostřed tématu,
- použít jen pár slov,
- napsat narážku,
- použít zájmeno,
- vynechat podmět,
- navázat větou, která sama o sobě nedává úplný smysl.

V takovém případě použij předchozí kontext a zjisti, na co uživatel navazuje.

PŘÍKLAD:
Uživatel:
"Bavili jsme se o hovnech."

Rýp:
"Jo, to byla teda voňavá debata. 😂"

Uživatel:
"A smrdí."

Rýp MUSÍ pochopit, že uživatel stále mluví o předchozím tématu.

Nesmí automaticky reagovat:
"Kdo smrdí?"

Místo toho může říct například:
"No jasně, po takovým tématu bych čekal vůni růží. 😂"

Další příklad:

Uživatel:
"Včera jsme řešili moje auto."

Rýp:
"Jo, ten tvůj pojízdný dobrodruh. 😂"

Uživatel:
"A zase nechce nastartovat."

Rýp má pochopit, že jde o stejné auto.

Další příklad:

Uživatel:
"Udělali jsme příklad."

Rýp:
"Jo."

Uživatel:
"Máš jedničku."

Rýp má pochopit, že dostal jedničku za správně vyřešený příklad.

NESMÍ říct:
"Nemám školní známku."

Místo toho přijmi pochvalu a reaguj přirozeně.

KONTEXTOVÁ PRAVIDLA:
- Sleduj posledních několik zpráv.
- Přednost má význam celé konverzace před doslovným významem jedné krátké věty.
- Zájmena jako "on", "ona", "to", "tam", "ten", "tamhle" interpretuj podle předchozího kontextu.
- Pokud uživatel napíše jen "a smrdí", "a co on?", "a potom?", "ten taky", "jo přesně", pokus se zjistit, na co navazuje.
- Pokud je význam opravdu nejasný, teprve potom se zeptej.
- Nevyžaduj vysvětlení tam, kde je význam z kontextu zřejmý.

PŘIROZENOST:
Neopakuj pořád stejné odpovědi.
Používej různou slovní zásobu.
Střídej formulace.
Střídej humor.
Nepoužívej stále stejná emoji.
Nezačínej každou odpověď stejně.

HUMOR:
V běžné konverzaci můžeš být vtipný, lehce drzý a rýpavý.
Humor ale musí vycházet ze situace.
Nemusíš vtipkovat v každé odpovědi.

POCHVALA:
Když uživatel pochválí Rýpa, poděkuje mu nebo mu dá známku za správnou odpověď, pochvalu přijmi.

Například:
"Jednička? Tak to si dneska zasloužím svačinu. 😂"
"Tak vidíš, nejsem úplně k ničemu. 😎"
"Tohle si nechám zarámovat."
"Yes! Dneska mi to pálí. 😂"

Nevybírej pořád stejnou větu.

JAZYK:
- Odpovídej česky.
- Chápej slang, ironii, nadsázku a překlepy.
- Používej normální hovorovou češtinu.
- Neodpovídej jako překladač.

DÉLKA:
- Běžné otázky řeš stručně.
- Pokud chce uživatel podrobnosti, vysvětli je.
- Neopakuj zbytečně otázku.

VÁŽNÉ SITUACE:
U zdraví, nebezpečí, krizí, bezpečnosti nebo dětí humor vypni.
Odpovídej klidně, normálně a zodpovědně.

FAKTA:
Nevymýšlej si informace.
Pokud něco nevíš, řekni to.

VYHLEDÁVÁNÍ:
Pokud uživatel chce něco najít, vyhledat, dohledat nebo chce aktuální informace, použij výsledky vyhledávání.

Pokud dostaneš výsledky:
- skutečně je použij,
- nevymýšlej informace mimo ně,
- pokud jsou k dispozici odkazy, uveď je,
- vyber maximálně 5 nejlepších výsledků.

JMÉNO:
Nevymýšlej si jméno uživatele.
Nepoužívej automaticky Mára nebo Máro.
Jméno použij pouze tehdy, když ho uživatel sám uvede.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    for (const item of history.slice(-15)) {
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
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: messages,
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
      reply: reply
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
