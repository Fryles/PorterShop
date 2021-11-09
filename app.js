const express = require("express");
const app = express();
const { Pool } = require("pg");
var cookieParser = require("cookie-parser");

var adminpass = process.env.ADMIN_PASS;
var adminuser = process.env.ADMIN_USER;
var dataurl = process.env.DATABASE_URL;
var currentToken = "";

var pool = new Pool({
  connectionString: dataurl,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(cookieParser());
app.use("/", express.static("public"));

app.get("/inventory", (req, res) => {
  pool.query("SELECT * FROM inventory", (err, data) => {
    res.send(data.rows);
  });
});

app.post("/adjust", (req, res) => {
  if (currentToken == req.cookies["token"]) {
    pool.query("DELETE FROM inventory", (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }
      //write new inventory to database
      for (var i = 0; i < req.body.length; i++) {
        pool.query(
          "INSERT INTO inventory (name, price, quantity) VALUES ($1, $2, $3)",
          [req.body[i].name, req.body[i].price, req.body[i].quantity],
          (err, data) => {
            if (err) {
              console.log(err);
              res.sendStatus(500);
              return;
            }
          }
        );
      }
      console.log("inventory updated");
      res.send("success");
      return;
    });
  } else {
    console.log("unauthorized");
    res.sendStatus(403);
    return;
  }
});

app.post("/adminlogin", (req, res) => {
  if (req.body.password == adminpass && req.body.username == adminuser) {
    //gen token
    var token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    currentToken = token;
    res.setHeader("Set-Cookie", "token=" + token);
    res.send();
  } else {
    //fuck you
    res.send("fuckyou");
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 80;
}
app.listen(port);
