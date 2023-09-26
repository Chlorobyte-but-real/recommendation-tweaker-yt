const ruleTableTemplate = '<tbody></tbody>';
const ruleRowIfTemplate = '<td style="width: 7.5%;">If</td><td style="width: 27.5%;"><div class="dropdown"><button id="ruleDropBtn" class="dropbtn"></button><div id="ruleDropdown" class="dropdown-content"></div></div></td>';
const ruleRowAndTemplate = '<td style="width: 7.5%;">&</td><td style="width: 27.5%;"><div class="dropdown"><button id="ruleDropBtn" class="dropbtn"></button><div id="ruleDropdown" class="dropdown-content"></div></div></td>';
const ruleButtonsTemplate = '<td><button id="delete"></button><button id="add"></button></td>'
const propertyTemplates = {
  "title": "<td style='width: 30%;'>contains</td> <td style='width: 100%;'><input id='containsText' style='width: 100%;'></input></td>",

  "progress %": "<td style='width: 30%;'>between</td> <td style='width: 30%;'><input id='from' style='width: 100%;' type='number' min='0' max='100' value='0'></input></td> <td style='width: 10%; padding: 0 3pt;'>and</td> <td style='width: 100%;'><input id='to' style='width: 100%;' type='number' min='0' max='100' value='100'></input></td>",

  "time seconds": "<td style='width: 30%;'>between</td> <td style='width: 30%;'><input id='from' style='width: 100%;' type='number' min='0' max='2592000' value='0'></input></td> <td style='width: 10%; padding: 0 3pt;'>and</td> <td style='width: 100%;'><input id='to' style='width: 100%;' type='number' min='0' max='2592000' value='60'></input></td>",

  "type": "<td style='width: 30%;'>is</td> <td><div class='dropdown'><button id='paramDropBtn' class='dropbtn'></button><div id='paramDropdown' class='dropdown-content'></div></div></td>",

  "views": "<td style='width: 30%;'>between</td> <td style='width: 30%;'><input id='from' style='width: 100%;' type='number' min='0' max='100000000000' value='0'></input></td> <td style='width: 10%; padding: 0 3pt;'>and</td> <td style='width: 100%;'><input id='to' style='width: 100%;' type='number' min='0' max='100000000000' value='0'></input></td>",

  //"age in days": "<td style='width: 30%;'>between</td> <td style='width: 30%;'><input id='from' style='width: 100%;' type='number' min='0' max='10000' value='0'></input></td> <td style='width: 10%; padding: 0 3pt;'>and</td> <td style='width: 100%;'><input id='to' style='width: 100%;' type='number' min='0' max='10000' value='0'></input></td>",

  "channel name": "<td style='width: 30%;'>contains</td> <td style='width: 100%;'><input id='containsText' style='width: 100%;'></input></td>"
};


var rules = document.getElementById("rules");


function AddRule(rows, accept) {
  var tableElement = document.createElement("table");
  tableElement.className = "rule";
  tableElement.innerHTML = ruleTableTemplate;
  rules.insertBefore(tableElement, rules.querySelector(".addRule"));

  var tmpQuery = rules.querySelectorAll("table");
  var ruleTable = tmpQuery[tmpQuery.length - 1];
  ruleTable.style.backgroundColor = accept ? "#008000" : "#800000";

  var firstRow = true;
  for (var k in rows) {
    AddRow(ruleTable, rows[k], firstRow);
    firstRow = false;
  }
}

function AddRow(ruleTable, rowData, firstRow) {
  var ruleTableBody = ruleTable.querySelector("tbody");

  if (!rowData[0] in propertyTemplates) {
    console.log("Warning: property template doesn't exist for type " + rowData[0] + "!");
    return;
  }

  var rowTemplate = firstRow ? ruleRowIfTemplate : ruleRowAndTemplate;

  var rowElement = document.createElement("tr");
  rowElement.innerHTML = rowTemplate;
  ruleTableBody.appendChild(rowElement);

  var dropdownElement = rowElement.querySelector("#ruleDropdown");
  for (var key in propertyTemplates) {
    dropdownElement.innerHTML += "<button>" + key + "</button>";
  }

  var dropdownButton = rowElement.querySelector("#ruleDropBtn");
  dropdownButton.innerText = rowData[0];

  rowElement.innerHTML += "<td id='properties'><table style='width: 100%;'><tr>" + propertyTemplates[rowData[0]] + "</tr></table></td>";

  rowElement.innerHTML += ruleButtonsTemplate;

  switch (rowData[0]) {
    case "title":
    case "channel name":
      rowElement.querySelector("#containsText").value = rowData[1];
      break;
    case "progress %":
    case "time seconds":
    case "views":
    case "age in days":
      rowElement.querySelector("#from").value = rowData[1];
      rowElement.querySelector("#to").value = rowData[2];
      break;
    case "type":
      var dropdownElement = rowElement.querySelector("#paramDropdown");
      for (var i = 0; i < typeParamList.length; i++) {
        dropdownElement.innerHTML += "<button>" + typeParamList[i] + "</button>";
      }

      rowElement.querySelector("#paramDropBtn").innerText = rowData[1];
      break;
  }

  UpdateButtons();
}

function DeleteRow(ruleTable, rowId) {
  var ruleTableBody = ruleTable.querySelector("tbody");
  var rowElement = ruleTableBody.childNodes[rowId];
  rowElement.remove();

  if (rowId == 0 && ruleTableBody.childNodes.length > 0) {
    ruleTableBody.childNodes[0].childNodes[0].innerText = "If";
  }

  if (ruleTableBody.childNodes.length == 0) {
    ruleTable.remove(); // no longer need it
  }

  UpdateButtons();
}

function SwitchRowType(ruleTable, rowId, newType) {
  var ruleTableBody = ruleTable.querySelector("tbody");

  if (!newType in propertyTemplates) {
    console.log("Warning: property template doesn't exist for type " + rowData[0] + "!");
    return;
  }

  var rowElement = ruleTableBody.childNodes[rowId];

  var dropdownButton = rowElement.querySelector("#ruleDropBtn");
  dropdownButton.innerText = newType;

  rowElement.querySelector("#properties").innerHTML = "<table style='width: 100%;'><tr>" + propertyTemplates[newType] + "</tr></table>";
  switch (newType) {
    case "type":
      var dropdownElement = rowElement.querySelector("#paramDropdown");
      for (var i = 0; i < typeParamList.length; i++) {
        dropdownElement.innerHTML += "<button>" + typeParamList[i] + "</button>";
      }

      rowElement.querySelector("#paramDropBtn").innerText = typeParamList[0];
      break;
  }

  UpdateButtons();
}

function GetRowData(ruleTable, rowId) {
  var returnArray = [];

  var ruleTableBody = ruleTable.querySelector("tbody");
  var rowElement = ruleTableBody.childNodes[rowId];

  if (rowElement == null || rowElement.querySelector("#ruleDropBtn") == null) {
    return returnArray;
  }

  returnArray.push(ConvertColor(ruleTable.style.backgroundColor)[1] > 0);

  var type = rowElement.querySelector("#ruleDropBtn").innerText;
  returnArray.push(type);

  switch (type) {
    case "title":
    case "channel name":
      returnArray.push(rowElement.querySelector("#containsText").value);
      break;
    case "progress %":
    case "time seconds":
    case "views":
    case "age in days":
      returnArray.push(rowElement.querySelector("#from").value);
      returnArray.push(rowElement.querySelector("#to").value);
      break;
    case "type":
      returnArray.push(rowElement.querySelector("#paramDropBtn").innerText);
      break;
  }

  return returnArray;
}

function ToggleRowAcceptMode(ruleTable, rowId) {
  if (event.target.matches("input, button")) {
    return;
  }

  var data = GetRowData(ruleTable, rowId);
  if (data.length > 0) {
    var ruleTableBody = ruleTable.querySelector("tbody");
    var rowElement = ruleTableBody.childNodes[rowId];

    var currentAccept = data[0];
    ruleTable.style.backgroundColor = !currentAccept ? "#008000" : "#800000";
  }
}

function SetInnerText(element, newValue) {
  element.innerText = newValue;
}


var registeredEvents = [];
function RegisterEvent(element, type, func) {
  registeredEvents.push([element, type, func]);
  element.addEventListener(type, func);
  //console.log(element + " is now listening to " + func);
}

function ClearEvents() {
  for (var i = 0; i < registeredEvents.length; i++) {
    var event = registeredEvents[i];
    event[0].removeEventListener(event[1], event[2]);
  }
  registeredEvents = [];
}

function UpdateButtons() {
  ClearEvents();

  var ruleTables = rules.querySelectorAll("#rules > table");
  for (var i = 0; i < ruleTables.length; i++) {
    var ruleTable = ruleTables[i];
    var ruleTableBody = ruleTable.querySelector("tbody");

    var rows = ruleTableBody.children;
    for (var k = 0; k < rows.length; k++) {
      //console.log(k + " " + rows[k] + " " + rows.length);
      RegisterEvent(rows[k], "dblclick", ToggleRowAcceptMode.bind(this, ruleTable, k));

      var dropdownElement = rows[k].querySelector("#ruleDropdown");
      RegisterEvent(rows[k].querySelector("#ruleDropBtn"), "click", DropdownToggle.bind(this, dropdownElement));
      var dropdownButtons = dropdownElement.children;
      for (var l = 0; l < dropdownButtons.length; l++) {
        RegisterEvent(dropdownButtons[l], "click", SwitchRowType.bind(this, ruleTable, k, dropdownButtons[l].innerText));
      }

      var paramDropdownButton = rows[k].querySelector("#paramDropBtn");
      var paramDropdown = rows[k].querySelector("#paramDropdown");

      if (paramDropdownButton && paramDropdown) {
        RegisterEvent(paramDropdownButton, "click", DropdownToggle.bind(this, paramDropdown));

        dropdownButtons = paramDropdown.children;
        for (var l = 0; l < dropdownButtons.length; l++) {
          RegisterEvent(dropdownButtons[l], "click", SetInnerText.bind(this, paramDropdownButton, dropdownButtons[l].innerText));
        }
      }

      var deleteButton = rows[k].querySelector("#delete");
      var addButton = rows[k].querySelector("#add");
      var deleteVisible = true;
      var addVisible = k == rows.length - 1 && rows.length < 5;

      if (deleteButton) {
        deleteButton.style.display = deleteVisible ? "" : "none";
        if (deleteVisible) {
          RegisterEvent(deleteButton, "click", DeleteRow.bind(this, ruleTable, k));
        }
      }

      if (addButton) {
        addButton.style.display = addVisible ? "" : "none";
        if (addVisible) {
          RegisterEvent(addButton, "click", AddRow.bind(this, ruleTable, ["title", ""], false));
        }
      }
    }
  }
}


document.querySelector(".addRule").addEventListener("click", AddRule.bind(this, [["title", ""]], false));




// tweaked from website https://permadi.com/tutorial/cssGettingBackgroundColor/index.html
function ConvertColor(color) {
  var rgbColors = new Object();

  switch (color[0]) {
    case "r": // rgb(RRR,GGG,BBB) format
      // Get the part between the ( and the ), which looks like e.g.
      // "255,100,69"
      color = color.substring(color.indexOf('(') + 1, color.indexOf(')'));

      // Now split by comma to get ["255", "100", "69"] with the above example.
      // We know there should be 3 values.
      rgbColors = color.split(',', 3);

      // Now convert the values to int
      for (var i = 0; i < rgbColors.length; i++) {
        rgbColors[i] = parseInt(rgbColors[i]);
      }
      break;
    case "#": // #RRGGBB format
      // Every value is 2 hexadecimal digits, so we can jump right into the loop
      for (var i = 0; i < rgbColors.length; i++) {
        rgbColors[i] = parseInt(color.substring(1 + 2*i, 3 + 2*i));
      }
      break;
  }
  return rgbColors;
}


function GetSaveData(includeSettings) {
  var ruleTables = rules.querySelectorAll("table");

  var finalSaveData = includeSettings ? [["settings", enabled, quickDelete]] : [];

  for (var i = 0; i < ruleTables.length; i++) {
    var ruleTableData = [];

    var j = 0;
    var currentData = [];
    while (true) {
      currentData = GetRowData(ruleTables[i], j);
      j++;
      if (currentData.length > 0) {
        ruleTableData.push(currentData);
        continue;
      }
      break;
    }

    if (ruleTableData.length > 0) {
      finalSaveData.push(ruleTableData);
    }
  }

  return finalSaveData;
}

var loaded = false;
var previousSaveJson = "";
function SaveSettings() {
  setTimeout(SaveSettings, 100);

  if (!loaded) {
    var ruleTables = rules.querySelectorAll("table");
    for (var i = 0; i < ruleTables.length; i++) {
      ruleTables[i].remove();
    }

    if (settingsLoaded) {
      for (var i = 0; i < loadedCurrentRules.length; i++) {
        var ruleTable = loadedCurrentRules[i];
        if (ruleTable.length > 0 && ruleTable[0] === "settings") continue;
        var ruleArray = [];
        var ruleBool = true;

        for (var j = 0; j < ruleTable.length; j++) {
          var rule = ruleTable[j];
          ruleBool = rule[0];

          ruleArray.push(rule.slice(1));
        }

        AddRule(ruleArray, ruleBool);
      }

      loaded = true;

      document.getElementById("loading").style.display = "none";
      document.getElementById("loadinghide").style.display = "";
    }
    return; // Don't save
  }

  var saveData = GetSaveData(true);
  var saveJson = JSON.stringify(saveData);
  if (saveJson != previousSaveJson) {
    browser.runtime.sendMessage({"msgType":"save", "key":"CurrentRules", "data":saveData});
    previousSaveJson = saveJson;
  }
}

SaveSettings();
