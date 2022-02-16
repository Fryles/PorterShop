var orders = [];
var loaderRefreshTime = 1000 * 10;
var loader = setInterval(function () {
  $.get("/orderquery", function (data) {
    fillOrders(data, true);
  });
}, loaderRefreshTime);

$(document).ready(function () {
  $.get("/orderquery", function (data) {
    fillOrders(data, false);
  });
});

function validate(e) {
  let id = $(e).siblings(".id").text();
  let order = orders.find((o) => o.id == id);
  $.get(`/validate?order=${encodeURIComponent(JSON.stringify(order))}`).then(
    function (data) {
      location.reload();
    }
  );
}

function remove(e) {
  let id = $(e).siblings(".id").text();
  $.get(`/remove?id=${encodeURIComponent(id)}`).then(function (data) {
    location.reload();
  });
}

function fillOrders(data, refresh) {
  if (refresh) {
    let oldOrders = orders;
    //make id list of old orders
    var oldIds = [];
    for (var i = 0; i < oldOrders.length; i++) {
      oldIds.push(oldOrders[i].id);
    }
  }
  $("#orders").empty();
  for (let i = 0; i < data.length; i++) {
    if (data[i] == null) {
      continue;
    }
    orders.push(data[i]);
    let order = data[i].order;
    let formattedOrder = `${order.name} - Room ${order.room}<br>Comments: ${order.comments}\n`;
    let formattedCart = "";
    for (var j = 0; j < order.cart.length; j++) {
      formattedCart += `${order.cart[j].quantity} ${order.cart[j].name}: $${order.cart[j].price} each<br>`;
    }
    $("#orders").append(
      "<div>" +
        data[i].time +
        "<br>ID: <span class='id'>" +
        data[i].id +
        "</span><br>" +
        formattedOrder +
        "<br>Cart:<br>" +
        formattedCart +
        "Total: $" +
        order.total +
        '<br><button onclick=validate(this) >Validate</button><button class="redbtn" onclick="remove(this)">Remove</button></div><br>'
    );
  }
  if (refresh) {
    //check if new id list contains a new id
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id != undefined) {
        if (oldIds.includes(orders[i].id)) {
          continue;
        } else {
          playSound("/resources/bing.mp3");
          animBG(0, 1000, 3);
        }
      }
    }
  }
}

function animBG(animCount, animTime, maxAnims) {
  $("body").css({
    backgroundColor: "#77ff88",
  });
  $("body").animate(
    {
      backgroundColor: "#313131",
    },
    animTime
  );
  animCount++;
  if (animCount <= maxAnims) {
    setTimeout(function () {
      animBG(animCount, animTime, maxAnims);
    }, animTime);
  }
}

function playSound(url) {
  const audio = new Audio(url);
  audio.play();
}
