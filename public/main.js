// on document load

var inventory = [];

$(document).ready(function () {
  initCart();
  //send get request to get inventory
  $.get("/inventory", function (data) {
    inventory = data;
    //loop through inventory
    var oos = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].quantity == 0) {
        oos.push(data[i]);
      } else {
        makeItem(data[i], false);
      }
    }

    //add oos items to inventory
    for (var i = 0; i < oos.length; i++) {
      makeItem(oos[i], true);
    }

    //add click event to each item
    $(".item").click(function (a) {
      var name = $(this).find(".itemtitle").text();
      var item = getItem(name);
      var price = item.price;
      var quantity = item.quantity;
      if (quantity > 0) {
        addToCart({ name: name, quantity: quantity, price: price });
      } else {
        alert("This item is out of stock");
      }
    });
  });
  //check if store is open
  $.get("/open", function (data) {
    if (data.status) {
      $("#openstatus").html(
        "We are currently <span style='color:#90EAA9'>open!</span>"
      );
    } else {
      $("#openstatus").html(
        "We are currently <span style='color:#EA9090'>closed.</span>"
      );
    }
  });
});

function initCart() {
  if (localStorage.getItem("cart") == null) {
    localStorage.setItem("cart", "[]");
  }
}

function addToCart(item) {
  var slider = document.createElement("input");
  slider.type = "range";
  slider.min = 1;
  slider.max = parseInt(item.quantity);
  slider.value = 1;
  slider.step = 1;
  slider.className = "slider";
  slider.onchange = function () {
    $(".swal-text")[0].innerText = slider.value;
  };

  swal({
    title: "Add " + item.name + " to cart?",
    text: "1",
    content: slider,
    button: {
      text: "Add to cart",
      closeModal: true,
    },
  }).then((a) => {
    if (a) {
      item.quantity = slider.value;
      var cart = localStorage.getItem("cart");
      cart = JSON.parse(cart);
      cart.push(item);
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  });
}

function getItem(name) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].name == name) {
      return inventory[i];
    }
  }
  return null;
}

function makeItem(s, oos) {
  var item = $("<div>");
  if (oos) {
    item.addClass("nostock");
  }
  var inneritem = $("<div>");
  item.addClass("item");
  var img = $("<img>");
  img.addClass("itemimage");
  img.attr("src", `/resources/${s.name.toLowerCase()}.png`);
  img.attr(
    "onerror",
    `this.onerror=null; this.src='/resources/${s.name.toLowerCase()}.PNG'`
  );
  item.append(img);
  inneritem.addClass("inneritem");
  //add item name to div
  inneritem.append("<p class='itemtitle'>" + s.name + "</p>");
  inneritem.append("<p class='itemprice'>$" + s.price + "</p>");
  // inneritem.append(
  //   "<p class='itemquantity'>Quantity: " + s.quantity + "</p></div>"
  // );
  item.append(inneritem);
  $("#inventory").append(item);
}
