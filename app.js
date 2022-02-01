const express = require("express");
const app = express();
const { Pool } = require("pg");
var cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");

var adminpass = process.env.ADMIN_PASS;
var adminuser = process.env.ADMIN_USER;
var dataurl = process.env.DATABASE_URL;
var email = process.env.EMAIL;
var emailpass = process.env.EMAIL_PASS;
var destemail = process.env.DEST_EMAIL;
var destvenmo = process.env.VENMO;
var secret = process.env.SECRET;

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
      emailOrder(id, req.query);
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

app.get("/validate", (req, res) => {
  if (req.query.secret == secret) {
    //remove cart from inventory
    var cart = JSON.parse(req.query.order);
    removeFromInventory(cart);
    res.send("Removed items from inventory!");
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 80;
}
app.listen(port);

function emailOrder(id, order) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: emailpass,
    },
  });
  let formattedCart = "";
  for (var i = 0; i < order.cart.length; i++) {
    formattedCart += `${order.cart[i].quantity} X ${order.cart[i].name}: ${order.cart[i].price} each<br>`;
  }
  let link = `
  <center>
   <table align="center" cellspacing="0" cellpadding="0" width="100%">
     <tr>
       <td align="center" style="padding: 10px;">
         <table border="0" class="mobile-button" cellspacing="0" cellpadding="0">
           <tr>
             <td align="center" bgcolor="#269f34" style="background-color: #269f34; margin: auto; max-width: 600px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; padding: 15px 20px; " width="100%">
             <!--[if mso]>&nbsp;<![endif]-->
                 <a href="http://626munchies.com/validate?secret=${secret}&order=${encodeURIComponent(
    JSON.stringify(order.cart)
  )}" target="_blank" style="16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight:normal; text-align:center; background-color: #269f34; text-decoration: none; border: none; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; display: inline-block;">
                     <span style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight:normal; line-height:1.5em; text-align:center;">Validate Cart</span>
               </a>
             <!--[if mso]>&nbsp;<![endif]-->
             </td>
           </tr>
         </table>
       </td>
     </tr>
   </table>
  </center>`;
  let formattedOrder = `${order.name} - Room ${order.room}<br>Comments: ${order.comments}\n`;
  var mailOptions = {
    from: "626 Munchies",
    to: destemail,
    subject: "Order " + id,
    html:
      "<h2>ID: " +
      id +
      "</h2><h3>Total: $" +
      order.total +
      "</h3><p>" +
      formattedOrder +
      "<br>" +
      formattedCart +
      "</p>" +
      link,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent for order: " + id);
    }
  });
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
