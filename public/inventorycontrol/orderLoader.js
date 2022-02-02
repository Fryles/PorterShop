var orders = [];

$(document).ready(function () {
  $.get("/orderquery", function (data) {
    for (let i = 0; i < data.length; i++) {
      orders.push(data[i]);
      let order = data[i].order;
      let link = `http://626munchies.com/validate?order=${encodeURIComponent(
        JSON.stringify(order.cart)
      )}`;
      let formattedOrder = `${order.name} - Room ${order.room}<br>Comments: ${order.comments}\n`;
      let formattedCart = "";
      for (var j = 0; j < order.cart.length; j++) {
        formattedCart += `${order.cart[j].quantity} ${order.cart[j].name}: $${order.cart[j].price} each<br>`;
      }
      $("#orders").append(
        "<div><b>ID: " +
          data[i].id +
          "</b><br>" +
          formattedOrder +
          "<br>Cart:<br>" +
          formattedCart +
          "Total: $" +
          order.total +
          '<br><button onclick=validate(this) >Validate</button><button class="redbtn" onclick="remove(this)">Remove</button></div><br>'
      );
    }
  });
});

function validate(e) {
  console.log(e);
}
function remove(e) {
  console.log(e);
}
