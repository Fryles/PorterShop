var inventory;
var addIndex = 0;
$(document).ready(function () {
  //fill table with inventory
  loadTable();

  //add listener to submit
  $("#submitInventory").on("click", function () {
    submitAdjustments();
    alert("Inventory Updated");
  });

  $("#add").click(function () {
    submitAdjustments();
    inventory.push({
      name: "name" + addIndex,
      price: 0,
      quantity: 0,
    });
    addIndex++;
    fillTable();
  });

  $("#remove").click(function () {
    submitAdjustments();
    //prompt for item to remove
    var item = prompt("Enter item to remove");
    var index = getItemIndex(item);
    if (index != null) {
      inventory.splice(index, 1);
    } else {
      alert("Item " + item + " does not exist");
    }
    fillTable();
  });

  getOpenStatus();

  $("#open").click(function () {
    $.post("/open", { status: true }, function (data) {
      getOpenStatus();
    });
  });

  $("#close").click(function () {
    $.post("/open", { status: false }, function (data) {
      getOpenStatus();
    });
  });
});

function sendAdjustment() {
  $.ajax({
    url: "/adjust",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(inventory),
    success: function (data) {
      console.log(data);
    },
  });
}

function getItemIndex(name) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].name == name) {
      return i;
    }
  }
  return null;
}

function fillTable() {
  $("#inventoryTable tbody").empty();
  var table = $("#inventoryTable tbody");
  for (var i = 0; i < inventory.length; i++) {
    var row = $("<tr>");
    row.append("<td contenteditable='true'>" + inventory[i].name + "</td>");
    row.append("<td contenteditable='true'>" + inventory[i].price + "</td>");
    row.append("<td contenteditable='true'>" + inventory[i].quantity + "</td>");

    table.append(row);
  }
}

function loadTable() {
  $("#inventoryTable tbody").empty();
  $.ajax({
    type: "GET",
    url: "/inventory",
    dataType: "json",
    success: function (data) {
      inventory = data;
      var table = $("#inventoryTable tbody");
      for (var i = 0; i < data.length; i++) {
        var row = $("<tr>");
        row.append("<td contenteditable='true'>" + data[i].name + "</td>");
        row.append("<td contenteditable='true'>" + data[i].price + "</td>");
        row.append("<td contenteditable='true'>" + data[i].quantity + "</td>");
        table.append(row);
      }
    },
  });
}
function submitAdjustments() {
  var table = $("#inventoryTable > tbody");
  var rows = table.find("tr");
  inventory = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cells = row.cells;
    var name = cells[0].innerText;
    var price = cells[1].innerText;
    var quantity = cells[2].innerText;
    //validate input
    if (name == "" || price == "" || quantity == "") {
      alert("Please fill in all fields");
      return;
    }
    inventory.push({
      name: name,
      price: price,
      quantity: quantity,
    });
  }
  //send inventory to server
  sendAdjustment();
  //update local table
  fillTable();
}
function getOpenStatus() {
  $.get("/open", function (data) {
    if (data.status) {
      $("#opens").html("Currently <span style='color:#90EAA9'>open!</span>");
    } else {
      $("#opens").html("Currently <span style='color:#EA9090'>closed.</span>");
    }
  });
}
function addTableHeaders() {
  var table = $("#inventoryTable");
  var row = $("<tr>");
  row.append("<th>Name</th>");
  row.append("<th>Price</th>");
  row.append("<th>Quantity</th>");
  table.append(row);
}
