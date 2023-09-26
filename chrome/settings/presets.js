var presetDropdownButton = document.querySelector(".dropbtn");

var loadedPresets = {};

function ResetLoadedPresets() {
  loadedPresets = {
    "\u0000General filler": JSON.parse('[[[false,"time seconds","0","60"]],[[false,"progress %","90","100"],[false,"type","video"]],[[false,"type","playlist"]]]'),
    "\u0000Extended music": JSON.parse('[[[false,"time seconds","1785","1815"]],[[false,"time seconds","3575","3625"]],[[false,"time seconds","35990","2592000"]]]'),
    "\u0000Only 'a' allowed": JSON.parse('[[[true,"title","a"]],[[false,"progress %","0","100"]]]')
  };
}

// Message from background.js (or maybe somewhere else, but hope not)
chrome.runtime.onMessage.addListener((sentMessage) => {
  if ("msgType" in sentMessage) {
    switch (sentMessage.msgType) {
      case "loaded":
        if ("content" in sentMessage) {
          ResetLoadedPresets();

          for (var key in sentMessage.content) {
            if (key.startsWith("p")) {
              var presetName = key.substring(1);
              if (presetName.length > 0) {
                loadedPresets[presetName] = sentMessage.content[key];
              }
            }
          }

          presetDropdownButton.style.fontStyle = "";
          presetDropdownButton.innerText = "Load preset...";
          for (var key in loadedPresets) {
            var content = loadedPresets[key];
            var italic = key.startsWith("\u0000");
            if (italic) {
              key = key.substring(1);
            }

            if (JSON.stringify(loadedCurrentRules) == JSON.stringify(content)) {
              presetDropdownButton.innerText = key;
              presetDropdownButton.style.fontStyle = italic ? "italic" : "";
              break;
            }
          }
        }
        break;
    }
  }
});


// Preset dropdown menu setup
function PresetDropdown() {
  var presetDropdownElement = document.getElementById("presetsDropdown");

  presetDropdownElement.innerHTML = "";
  for (var key in loadedPresets) {
    var italic = key.startsWith("\u0000");
    if (italic) {
      key = key.substring(1);
      presetDropdownElement.innerHTML += "<button style='font-style: italic;'></button>";
    }
    else {
      presetDropdownElement.innerHTML += "<button></button>";
    }
  }

  var i = -1; // iterate at the start, so starts at 0
  for (var key in loadedPresets) {
    i++;

    presetDropdownElement.childNodes[i].addEventListener("click", LoadPreset.bind(this, key));
    presetDropdownElement.childNodes[i].addEventListener("contextmenu", DeletePreset.bind(this, key));

    if (key.startsWith("\u0000")) {
      key = key.substring(1);
    }
    presetDropdownElement.childNodes[i].innerText = key;
  }

  DropdownToggle(presetDropdownElement);
}

function DeletePreset(presetName) {
  event.preventDefault();
  if (presetName.startsWith("\u0000")) {
    alert("You can't remove the stock presets!");
    return;
  }

  CloseAllDropdowns();
  if (confirm("Would you like to delete the " + presetName + " preset?")) {
    chrome.runtime.sendMessage({"msgType":"save", "key":"p" + presetName, "erase":true});
    delete loadedPresets[presetName];
  }
}

function LoadPreset(presetName) {
  var presetData = loadedPresets[presetName];

  loaded = false; // make it reload settings
  LoadSettings(presetData);

  var italic = presetName.startsWith("\u0000");
  if (italic) {
    presetName = presetName.substring(1);
  }
  presetDropdownButton.innerText = presetName;
  presetDropdownButton.style.fontStyle = italic ? "italic" : "";
}

function SavePreset(presetName, presetData) {
  loadedPresets[presetName] = presetData;

  chrome.runtime.sendMessage({"msgType":"save", "key":"p" + presetName, "data":presetData});
}
function SavePresetBtn() {
  var presetName = (prompt("Save your rules as:") || "").trim();
  if (presetName.length > 0 && !presetName.startsWith("\u0000")) {
    SavePreset(presetName, GetSaveData());
  }
}


function Download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
function ExportPresetBtn() {
  Download(JSON.stringify(GetSaveData()), "preset.json", "text/plain");
}

function ImportPresetBtn() {
  // tell background script to ask current active youtube window to import a preset for us
  alert("Make sure you're focused on a YouTube window.");
  chrome.runtime.sendMessage({"msgType":"importPopup"});
}

// Bind presets gui events
presetDropdownButton.addEventListener("click", PresetDropdown);
document.getElementById("presetSave").addEventListener("click", SavePresetBtn);
document.getElementById("presetExport").addEventListener("click", ExportPresetBtn);
document.getElementById("presetImport").addEventListener("click", ImportPresetBtn);
