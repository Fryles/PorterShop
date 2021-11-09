$(document).ready(function () {
  inventory = JSON.parse(localStorage.getItem("inventory"));
  var cart = JSON.parse(localStorage.getItem("cart"));
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
    console.log(cartItem);
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

  //update delivery status
  $("#deliveryStatus").innerText = "Delivering to " + localStorage.getItem("room");

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
  if (room == "") {
    swal("Please enter a room number");
    return;
  }
  if(!(600 < room <700 )){
    swal("626 Munchies is only delivering to the 6th floor for now.");
    return;
  }
  //check 

}

function openVenmo(price, desc, order) {
  //TODO validate cart server side
  window.open(
    "venmo://paycharge?txn=pay&recipients=fryles&amount=" +
      price +
      "&note=" +
      desc +
      "\n" +
      order
  );
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
