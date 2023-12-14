const { exec } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const port = 4444;
const app = express();

app.use(bodyParser.json());

app.post("/exec", (req, res) => {
  const { command } = req.body;
  console.log("Executing :", command);
  exec(command, (error, stdout) => {
    if (error) return void res.status(500).send(error.message);
    res.status(200).send(stdout);
  })
});

app.listen(port, (err) => {
  if (err) return void console.error(err);
  console.log("Exec helper listening on port " + port);
});
