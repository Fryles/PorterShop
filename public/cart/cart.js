var inventory;
var cart;
$(document).ready(function () {
  inventory = $.get("/inventory", function (data) {
    inventory = data;
  });
  cart = JSON.parse(localStorage.getItem("cart"));
  //add cart items to page in list
  cart.forEach((item) => {
    $("#cart").append(
      `<li class="cartItem" name="${item.name}">${item.quantity} ${
        item.name
      }: $${item.quantity * item.price}</li>`
    );
  });

  //add click listeners
  $(".cartItem").click(function (a) {
    var name = $(this)[0].attributes.name.value;
    var cartItem = getItemFromCart(name);
    var item = getItem(name);
    var price = item.price;
    var quantity = item.quantity;
    var cartQuantity = cartItem.quantity;
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = item.quantity;
    slider.value = cartQuantity;
    slider.step = 1;
    slider.className = "slider";
    slider.onchange = function () {
      $(".swal-text")[0].innerText = slider.value;
    };

    swal({
      title: "Adjust " + item.name,
      text: cartQuantity,
      content: slider,
      button: {
        text: "Update cart",
        closeModal: true,
      },
    }).then((a) => {
      cartItem.quantity = slider.value;
      if (cartItem.quantity != 0) {
        cart[cartItem.index] = cartItem;
      } else {
        cart.splice(cartItem.index, 1);
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      location.reload();
    });
  });

  //add total to page
  $("#total").append(
    `Total: $${cart.reduce((acc, item) => {
      return acc + item.quantity * item.price;
    }, 0)}`
  );

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

  //add cleat cart button click listener
  $("#clearCart").click(function () {
    localStorage.setItem("cart", JSON.stringify([]));
    location = "/";
  });

  //add checkout button click listener
  $("#checkout").click(function () {
    checkout();
  });
});

function checkout() {
  //check room number
  var room = $("#room").val();
  var name = $("#name").val();
  var comments = $("#comments").val();
  var order = localStorage.getItem("cart");

  if (room == "" || name == "") {
    swal("Please enter a name and room number");
    return;
  }
  if (!(600 < room && room < 700)) {
    swal("626 Munchies is only delivering to the 6th floor for now.");
    return;
  }
  if (cart.length == 0 || cart == null) {
    swal("Your cart is empty!");
    return;
  }
  if ($("#openstatus > span").innerText == "closed") {
    swal("Sorry, we are closed right now.");
    return;
  }

  var isMobile = false;
  // device detection
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    isMobile = true;
  }

  //gen order data
  var order = {
    name: name,
    room: room,
    comments: comments,
    total: cart.reduce((acc, item) => {
      return acc + item.quantity * item.price;
    }, 0),
    cart: JSON.parse(order),
  };

  //send order to server
  $.get("/checkout", order, function (data) {
    console.log(data);
    if (data && isMobile) {
      swal(
        "Continue to be redirected to Venmo to finish and pay for your order. Do not edit the Venmo payment."
      ).then(() => {
        localStorage.setItem("cart", JSON.stringify([]));
        window.location = data;
      });
    } else if (!isMobile && data) {
      swal(
        "Scan this QR code on your phone to finish your order through Venmo. Do not edit the Venmo payment."
      ).then(() => {
        localStorage.setItem("cart", JSON.stringify([]));
        displayQR(data);
      });
    } else {
      swal("Order failed!", "Please refresh and try again.", "error");
    }
  });
}

function getItemFromCart(name) {
  var cart = JSON.parse(localStorage.getItem("cart"));
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name == name) {
      cart[i].index = i;
      return cart[i];
    }
  }
  return null;
}

function getItem(name) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].name == name) {
      return inventory[i];
    }
  }
  return null;
}

function displayQR(url) {
  var QR_CODE = new QRCode("qrcode", {
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L,
  });
  QR_CODE.makeCode(url);
}

function isOpen() {
  $.get("/open", function (data) {
    return data.status;
  });
}
