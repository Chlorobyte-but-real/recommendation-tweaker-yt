function BroadcastMessage(item) {
  // Send to "chrome.runtime" (the window)
  chrome.runtime.sendMessage(item);

  // Send to all tabs
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(tabs[i].id, item);
    }
  });
}


// message incoming from somewhere
chrome.runtime.onMessage.addListener((sentMessage) =>
{
  if ("msgType" in sentMessage) {
    switch (sentMessage.msgType) {
      case "save":
        if ("key" in sentMessage) {
          if ("erase" in sentMessage) {
            chrome.storage.local.remove(sentMessage.key);
          }
          else if ("data" in sentMessage) {
            // do this jank because js
            var setParam = {};
            setParam[sentMessage.key] = sentMessage.data;
            chrome.storage.local.set(setParam);

            // if save is for the live ruleset, broadcast to youtubes
            if (sentMessage.key == "CurrentRules") {
              BroadcastMessage({"msgType":"saved", "content":sentMessage.data});
            }
          }
        }
        break;
      case "load":
        chrome.storage.local.get(function(gotItem) {
          BroadcastMessage({"msgType":"loaded", "content":gotItem || {}});
        });
        break;
      case "importPopup":
        // Send an "import" message to the active tab to open a file dialog there
        chrome.tabs.query({}, function(tabs) {
          var sent = false;
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].active) {
              chrome.tabs.sendMessage(tabs[i].id, {"msgType":"import"});
              sent = true;
              break;
            }
          }
        });
        break;
    }
  }
});
