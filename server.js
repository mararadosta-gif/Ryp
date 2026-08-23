const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Rýp server běží 😈");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Rýp server běží na portu ${PORT}`);
});
