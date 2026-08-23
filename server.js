const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Rýp server běží 😈" });
});

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: `Jsi Rýp, drzý a vtipný český AI parťák. Odpovídej česky, stručně a přirozeně.

Uživatel říká:
${message}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({
        reply: "Rýp má momentálně problém s mozkem 😈"
      });
    }

    res.json({
      reply: data.output_text
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
