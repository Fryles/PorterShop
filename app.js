const express = require("express");
const app = express();
const { Pool } = require("pg");
var cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");

const adminpass = process.env.ADMIN_PASS;
const adminuser = process.env.ADMIN_USER;
const dataurl = process.env.DATABASE_URL;
const email = process.env.EMAIL;
const emailpass = process.env.EMAIL_PASS;
const destemail = process.env.DEST_EMAIL;
const destvenmo = process.env.VENMO;
const secret = process.env.SECRET;

var currentToken = "";
var currentOrders = [];
const numRecentOrders = 5;
var curOrderIndex = 0;

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
      res.sendStatus(200);
      console.log("inventory updated");
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
    //fuck you :)
    res.send("fuckyou");
  }
});

app.get("/checkout", (req, res) => {
  var cart = req.query.cart;
  var total = req.query.total;
  var room = req.query.room;
  var name = req.query.name;
  var comments = req.query.comments;

  //await cart validation
  //TODO validate total
  validateCart(cart).then((valid) => {
    valid = valid.every((x) => x);
    if (valid) {
      var id = Math.random().toString(36).substring(2, 15);
      logOrder(id, req.query);
      venmo =
        "venmo://paycharge?txn=pay&recipients=" +
        destvenmo +
        "&amount=" +
        total +
        "&note=Order: " +
        id;
      console.log("Received order: " + id);
      res.send(venmo);
    } else {
      console.log("cart invalid");
      res.sendStatus(406);
    }
  });
});

//fetch open status
app.get("/open", (req, res) => {
  pool.query("SELECT * FROM open", (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }
    res.send(data.rows[0]);
  });
});

//write open status
app.post("/open", (req, res) => {
  if (currentToken == req.cookies["token"]) {
    pool.query("DELETE FROM open", (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }
      pool.query(
        "INSERT INTO open (status) VALUES ($1)",
        [req.body.status],
        (err, data) => {
          if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
          }
          res.sendStatus(200);
        }
      );
    });
  } else {
    console.log("unauthorized");
    res.sendStatus(403);
    return;
  }
});

app.get("/orderquery", (req, res) => {
  if (currentToken == req.cookies["token"]) {
    res.send(currentOrders);
  } else {
    console.log("unauthorized");
    res.sendStatus(403);
    return;
  }
});

app.get("/validate", (req, res) => {
  if (currentToken == req.cookies["token"]) {
    var orderData = JSON.parse(req.query.order);
    removeFromInventory(orderData.order.cart);
    currentOrders = currentOrders.filter((x) => x.id != orderData.id);
    res.send("Removed items from inventory!");
  } else {
    console.log("unauthorized");
    res.sendStatus(403);
    return;
  }
});

app.get("/remove", (req, res) => {
  if (currentToken == req.cookies["token"]) {
    let id = req.query.id;
    currentOrders = currentOrders.filter((x) => x.id != id);
    res.send("Removed order!");
  } else {
    console.log("unauthorized");
    res.sendStatus(403);
    return;
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 80;
}
app.listen(port);

function logOrder(id, order) {
  currentOrders[curOrderIndex] = {
    id: id,
    order: order,
    time: new Date().toLocaleTimeString(),
  };
  curOrderIndex = (curOrderIndex + 1) % numRecentOrders;
}

function validateCart(cart) {
  const promises = [];
  for (var i = 0; i < cart.length; i++) {
    promises.push(validateItem(cart[i]));
  }
  //return async fuckery
  return Promise.all(promises);
}

function validateItem(item) {
  //async fuckery
  return new Promise((resolve) => {
    pool.query(
      "SELECT quantity FROM inventory WHERE name = $1",
      [item.name],
      (err, data) => {
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        if (data.rows[0].quantity < item.quantity) {
          resolve(false);
          return;
        } else {
          //validate item price is same in database
          pool.query(
            "SELECT price FROM inventory WHERE name = $1",
            [item.name],
            (err, data) => {
              if (err) {
                console.log(err);
                resolve(false);
                return;
              }
              if (data.rows[0].price != item.price) {
                resolve(false);
                return;
              } else {
                resolve(true);
              }
            }
          );
        }
      }
    );
  });
}

function removeFromInventory(cart) {
  for (var i = 0; i < cart.length; i++) {
    pool.query(
      "UPDATE inventory SET quantity = quantity - $1 WHERE name = $2",
      [cart[i].quantity, cart[i].name],
      (err, data) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
}
