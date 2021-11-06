const express = require('express');
const app = express();
const fs = require('fs');
const nodemailer = require('nodemailer');

app.use("/", express.static("public"));


app.get("/inventory", (req, res) => {
  fs.readFile("./inventory.json", function (err, read) {
    var json = JSON.parse(read);
		res.send(json);
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);
