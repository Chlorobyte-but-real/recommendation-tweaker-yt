// originally rules.js, here for importing
const typeParamList = ["video", "playlist", "live"];

function RequestLoadSettings() {
  browser.runtime.sendMessage({"msgType":"load"}).catch((e) => {RequestLoadSettings();});
}

// instructions
const INSTR_SET_GOOD = 0;
const INSTR_SET_BAD = 1;
const INSTR_COMPARE_EQUALS = 2;
const INSTR_COMPARE_STR_CONTAINS = 3;
const INSTR_COMPARE_NUM_BETWEEN = 4;

var enabled = true;
var quickDelete = false;

var loadedInstructions = [];
var loadedCurrentRules = {};
var loadedRawCurrentRules = {};
var settingsLoaded = false;
function LoadSettings(currentRules) {
  loadedInstructions = [];
  loadedCurrentRules = {};
  loadedRawCurrentRules = {};

  if (currentRules) {
    loadedRawCurrentRules = currentRules;

    // iterate through "rule tables" (groups of rules with & operator)
    for (var i = 0; i < currentRules.length; i++) {
      var ruleTable = currentRules[i];

      if (ruleTable.length > 0 && ruleTable[0] === "settings") {
        enabled = ruleTable[1];
        quickDelete = ruleTable[2];
        if (typeof UpdateSliders === "function") {
          UpdateSliders();
        }

        currentRules.splice(i, 1);
        i--;
        continue;
      }

      // the instruction that is run after the checks
      var endInstruction = INSTR_SET_GOOD;

      // iterate through rows
      for (var j = 0; j < ruleTable.length; j++) {
        var rule = ruleTable[j];
        // it's stored in the row rather than the table, because epic benedani code
        endInstruction = rule[0] ? INSTR_SET_GOOD : INSTR_SET_BAD;

        // add compare instruction corresponding to the stored rule type
        // compare instructions skip all the way until the next INSTR_SET_GOOD or INSTR_SET_BAD if false
        switch (rule[1]) {
          case "title":
            loadedInstructions.push([INSTR_COMPARE_STR_CONTAINS, "title", rule[2]]);
            break;
          case "progress %":
            loadedInstructions.push([INSTR_COMPARE_NUM_BETWEEN, "watchPercent", rule[2], rule[3]]);
            break;
          case "time seconds":
            loadedInstructions.push([INSTR_COMPARE_NUM_BETWEEN, "timeSecs", rule[2], rule[3]]);
            break;
          case "type":
            loadedInstructions.push([INSTR_COMPARE_EQUALS, "type", rule[2]]);
            break;
          case "views":
            loadedInstructions.push([INSTR_COMPARE_NUM_BETWEEN, "views", rule[2], rule[3]]);
            break;
          case "age in days":
            loadedInstructions.push([INSTR_COMPARE_NUM_BETWEEN, "age", rule[2], rule[3]]);
            break;
          case "channel name":
            loadedInstructions.push([INSTR_COMPARE_STR_CONTAINS, "channelName", rule[2]]);
            break;
        }
      }

      loadedCurrentRules = currentRules;

      // the set good or bad instruction is reached if all comparisons are passed,
      // otherwise execution continues past
      loadedInstructions.push([endInstruction]);
    }

    //console.log("Loaded instructions:");
    //console.log(loadedInstructions);
  }

  settingsLoaded = true;
}

// Message from background.js (or maybe somewhere else, but hope not)
browser.runtime.onMessage.addListener((sentMessage) => {
  if ("msgType" in sentMessage) {
    switch (sentMessage.msgType) {
      case "saved":
        if ("content" in sentMessage) {
          console.log("Save event");
          LoadSettings(sentMessage.content);
        }
        break;
      case "loaded":
        if ("content" in sentMessage) {
          console.log("Load event");
          LoadSettings(sentMessage.content.CurrentRules);
        }
        break;
      case "import":
        var input = document.createElement("input");
        input.type = "file";

        input.onchange = e => {
          var file = e.target.files[0];

          var reader = new FileReader();
          reader.readAsText(file, "UTF-8");

          reader.onload = readerEvent => {
            // The object gets loaded here
            var textContent = readerEvent.target.result;
            var object = JSON.parse(textContent);

            // Verify the object
            var scream = false;
            if (object.constructor === Array && object.length > 0 && object.length < 6969) {
              for (var i = 0; !scream && i < object.length; i++) {
                var ruleTable = object[i];
                if (ruleTable.constructor === Array && ruleTable.length > 0 && ruleTable.length <= 5) {
                  for (var j = 0; !scream && j < ruleTable.length; j++) {
                    var row = ruleTable[j];
                    if (row.length > 2 && typeof(row[0]) == typeof(true) && typeof(row[1]) == typeof("")) {
                      switch (row[1]) {
                        case "title":
                        case "channel name":
                          if (row.length != 3 || typeof(row[2]) != typeof("")) {
                            console.log("error title");
                            scream = true;
                          }
                          break;
                        case "progress %":
                        case "time seconds":
                        case "views":
                        case "age":
                          if (row.length != 4 || !Number.isFinite(parseInt(row[2])) && !Number.isFinite(parseInt(row[3]))) {
                            console.log("error range");
                            scream = true;
                          }
                          break;
                        case "type":
                          if (row.length != 3 || typeof(row[2]) != typeof("") || !typeParamList.includes(row[2])) {
                            console.log("error type " + row[2]);
                            console.log(typeParamList);
                            scream = true;
                          }
                          break;
                        default:
                          scream = true;
                          break;
                      }
                    }
                    else {
                      console.log("error row");
                      scream = true;
                      break;
                    }
                  }
                }
                else {
                  console.log("error ruletable");
                  scream = true;
                  break;
                }
              }
            }

            if (!scream) {
              var presetName = prompt("Enter the preset name");
              if (presetName && presetName.length > 0 && !presetName.startsWith("\u0000")) {
                LoadSettings(object);
                SavePreset(presetName, loadedCurrentRules);

                browser.runtime.sendMessage({"msgType":"save", "key":"CurrentRules", "data":loadedRawCurrentRules});
              }
            }
            else {
              alert("Failed to import data as a preset!");
            }
          }
        }

        input.click();
        break;
    }
  }
});

function SavePreset(presetName, presetData) {
  browser.runtime.sendMessage({"msgType":"save", "key":"p" + presetName, "data":presetData});
}



var startTime = new Date();

function Tweak() {
  try {
  // A function that exists on the settings page. By breaking when the function is loaded, the loop doesn't unnecessarily run on the page.
  if (typeof UpdateSliders === "function") {
    return;
  }

  var timeout = 50.0;
  // Divide by CPU thread count
  // Lag poopier PCs less, while being much more responsive on modern hardware where eating a CPU core matters less (& is less effective!)
  timeout /= Math.sqrt(navigator.hardwareConcurrency);
  // additionally, multiply by 8 if not visible (e.g. one of the 653476467456 tabs open in the background). The user should almost never be able to notice this.
  // otherwise, if disabled, multiply by 2 to halve the tickrate of literally just showing all of the videos
  timeout *= (document.hidden ? 8 : (enabled ? 1 : 2));
  // slowly halve the tickrate over 10 seconds; by then, all loading should be done and it shouldn't be necessary to do that many updates anymore
  var timeMul = (new Date() - startTime) / 1000 + 1;
  if (timeMul > 2) timeMul = 2;
  timeout *= timeMul;
  setTimeout(Tweak, timeout);
  // All video recommendation elements

  var elements = document.querySelectorAll("ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-compact-radio-renderer");

  iClearEvents();
  for (var i = 0; i < elements.length; i++) {
    // apparently it is possible to get an element that just doesn't exist. I am also beyond confusion
    if (elements[i].getElementsByTagName("ytd-thumbnail").length < 1) {
      continue;
    }

    if (!enabled) {
      Show(elements[i], true);
      continue;
    }

    // The params that can be used in filters
    var obj = {
      "type": "video",
      "title": "",
      "timeSecs": -1,
      "watchPercent": 0.0,
      "views": 0,
      "age": 0,
      "channelName": ""
    };

    // Detect "type" (video, playlist or live)
    var playlistSidebar = elements[i].getElementsByTagName("ytd-thumbnail-overlay-side-panel-renderer");
    if (playlistSidebar.length == 0) {
      playlistSidebar = elements[i].getElementsByTagName("ytd-thumbnail-overlay-bottom-panel-renderer");
    }
    if (playlistSidebar.length > 0) {
      obj.type = "playlist";
    }
    else {
      var streamBadge = elements[i].getElementsByClassName("badge-style-type-live-now");
      if (streamBadge.length > 0) {
        obj.type = "live";
      }
    }

    // Get time (-1 if not found)
    var time = elements[i].querySelector("ytd-thumbnail-overlay-time-status-renderer span");
    if (time != null) {
      var split = time.innerHTML.trim().split(':');

      obj.timeSecs = 0;
      for (var j = 0; j < split.length; j++) {
        obj.timeSecs += parseInt(split[j]) * Math.pow(60, split.length - j - 1);
      }
    }

    // Get watch progress (the red bar)
    var watchProgress = elements[i].querySelector("ytd-thumbnail-overlay-resume-playback-renderer #progress");
    if (watchProgress != null) {
      obj.watchPercent = parseFloat(watchProgress.style.width.split("%")[0]);
    }

    // Get video title
    var titleString = elements[i].querySelector("#video-title");
    if (titleString != null) {
      obj.title = titleString.innerText;
      // Get views from aria label (more reliable and accurate than trying to parse the metadata)
      if ((obj.type === "video" || obj.type === "live") && titleString.attributes["aria-label"]) {
        obj.views = GetViews(titleString.attributes["aria-label"].value);
      }
    }

    // Get metadata for video age
    /*var metadata = elements[i].querySelectorAll("#metadata-line span");
    if (metadata.length > 1) {
      obj.age = parseTimeAgoInSeconds(metadata[1].innerText) / 86400;
    }*/

    // Get video title
    var channelNameString = elements[i].querySelector("#channel-name a");
    if (channelNameString != null) {
      obj.channelName = channelNameString.innerText;
    }

    // Run the loaded instructions
    var show = true; // whether to have the element shown when done
    var done = false; // set to true by INSTR_SET_GOOD or INSTR_SET_BAD, basically stops execution
    for (var j = 0; !done && j < loadedInstructions.length; j++) {
      var comparisonResult = true;
      var instruction = loadedInstructions[j];

      //console.log("Running instruction " + instruction[0] + " on param " + instruction[1] + " which on the object is " + obj[instruction[1]]);
      switch (instruction[0]) {
        case INSTR_SET_GOOD:
        case INSTR_SET_BAD:
          show = instruction == INSTR_SET_GOOD;
          done = true;
          //console.log("Show: " + show);
          break;
        case INSTR_COMPARE_EQUALS:
          comparisonResult = obj[instruction[1]] == instruction[2];
          //console.log(obj[instruction[1]] + " " + instruction[2] + " -> skip: " + skip);
          break;
        case INSTR_COMPARE_STR_CONTAINS:
          comparisonResult = instruction[2].length != 0 && obj[instruction[1]].toLowerCase().indexOf(instruction[2].toLowerCase()) != -1;
          //console.log(obj[instruction[1]] + " " + instruction[2] + " -> skip: " + skip);
          break;
        case INSTR_COMPARE_NUM_BETWEEN:
          comparisonResult = obj[instruction[1]] >= instruction[2] && obj[instruction[1]] <= instruction[3];
          //console.log(obj[instruction[1]] + " " + instruction[2] + " " + instruction[3] + " -> skip: " + skip);
          break;
      }

      // If comparison returned false, skip all instructions until an INSTR_SET_GOOD
      // or INSTR_SET_BAD is reached, which is not run because of the j++ in the loop
      if (!comparisonResult) {
        while (j < loadedInstructions.length && loadedInstructions[j][0] > INSTR_SET_BAD) {
          j++;
        }
      }
    }

    Show(elements[i], show);
  }
  }
  catch (e) {
    //console.log(e);
  }
}

function GetViews(arialabel) {
  if (!arialabel) return 0;

  var words = arialabel.trim().toLowerCase().split(" ");

  // Views are at the end, so start at end and try to find next number
  for (var i = words.length - 1; i >= 0; i--) {
    var int = ParseIntIgnoringSymbols(words[i]);
    if (int != -1) {
      return int;
    }
  }

  return 0;
}

// -1 is error that the string doesn't contain digits
function ParseIntIgnoringSymbols(string) {
  var newString = "";
  for (var i = 0; i < string.length; i++) {
    if (string[i] >= "0" && string[i] <= "9") {
      newString += string[i];
    }
  }

  return newString.length == 0 ? -1 : parseInt(newString);
}

// some bad thing that only works on the english language
/*function parseTimeAgoInSeconds(string) {
  var words = string.trim().toLowerCase().split(" ");

  var mul = 0;
  switch (words[1]) {
    case "second":
    case "seconds":
      mul = 1;
      break;
    case "minute":
    case "minutes":
      mul = 60;
      break;
    case "hour":
    case "hours":
      mul = 3600;
      break;
    case "day":
    case "days":
      mul = 86400;
      break;
    case "week":
    case "weeks":
      mul = 86400*7;
      break;
    case "month":
    case "months":
      mul = 86400*30;
      break;
    case "year":
    case "years":
      mul = 86400*365;
      break;
  }

  return parseInt(words[0]) * mul;
}*/

function Show(element, visibility) {
  SetVisibility(element, quickDelete ? true : visibility);
  SetQuickDelete(element, quickDelete ? !visibility : false);
}
function SetVisibility(element, visibility) {
  element.style.display = visibility ? "" : "none";
}
function SetQuickDelete(element, isEnabled) {
  element.style.backgroundColor = isEnabled ? "rgba(192, 0, 0, 0.5)" : "";

  var thumbnail = element.getElementsByTagName("ytd-thumbnail")[0];
  var a = thumbnail.getElementsByTagName("a")[0];
  a.style.pointerEvents = isEnabled ? "none" : "";
  a.querySelector("#mouseover-overlay").style.display = isEnabled ? "none" : "";
  a.querySelector("#hover-overlays").style.display = isEnabled ? "none" : "";

  if (isEnabled) {
    iRegisterEvent(thumbnail, "click", QuickDelete.bind(this, element));
  }
}

function QuickDelete(element) {
  element.querySelector("#menu button").click();
  var thing = document.body.querySelector("ytd-menu-popup-renderer tp-yt-paper-listbox");
  if (thing) {
    setTimeout(function() {
      thing.getElementsByTagName("ytd-menu-service-item-renderer")[3].click();
    }, 10);
  }
  element.querySelector("#menu button").click(); // the popup weirdly appears, clicking the button again hides it

  event.preventDefault();
  event.stopPropagation();
}

// i = internal
var iRegisteredEvents = [];
function iRegisterEvent(element, type, func) {
  iRegisteredEvents.push([element, type, func]);
  element.addEventListener(type, func);
}

function iClearEvents() {
  for (var i = 0; i < iRegisteredEvents.length; i++) {
    var event = iRegisteredEvents[i];
    if (event[0]) {
      event[0].removeEventListener(event[1], event[2]);
    }
  }
  iRegisteredEvents = [];
}

RequestLoadSettings();
Tweak();
