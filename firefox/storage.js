function BroadcastMessage(item) {
  // Send to "browser runtime" (the window)
  browser.runtime.sendMessage(item).catch((error)=>{});

  // Send to all tabs
  browser.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      browser.tabs.sendMessage(tabs[i].id, item).catch((error)=>{});
    }
  });
}



// message incoming from somewhere
browser.runtime.onMessage.addListener((sentMessage) =>
{
  if ("msgType" in sentMessage) {
    switch (sentMessage.msgType) {
      case "save":
        if ("key" in sentMessage) {
          if ("erase" in sentMessage) {
            browser.storage.local.remove(sentMessage.key);
          }
          else if ("data" in sentMessage) {
            // do this jank because js
            var setParam = {};
            setParam[sentMessage.key] = sentMessage.data;
            browser.storage.local.set(setParam);

            // if save is for the live ruleset, broadcast to youtubes
            if (sentMessage.key == "CurrentRules") {
              BroadcastMessage({"msgType":"saved", "content":sentMessage.data});
            }
          }
        }
        break;
      case "load":
        var gettingItem = browser.storage.local.get();
        gettingItem.then(LoadSettings_OnGot, LoadSettings_OnError);
        break;
      case "importPopup":
        // Send an "import" message to the active tab to open a file dialog there
        // since file dialogs are not supported in the extension's window
        browser.tabs.query({}, function(tabs) {
          var sent = false;
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].active) {
              browser.tabs.sendMessage(tabs[i].id, {"msgType":"import"}).catch((error)=>{
                console.log("Error, no YT");
                BroadcastMessage({"msgType":"importNoYT"});
              });
              sent = true;
              break;
            }
          }

          if (!sent) {
            console.log("Not sent, no YT");
            BroadcastMessage({"msgType":"importNoYT"});
          }
        });
        break;
    }
  }
});


function LoadSettings_OnGot(item) {
  BroadcastMessage({"msgType":"loaded", "content":item});
}

function LoadSettings_OnError(error) {
  BroadcastMessage({"msgType":"loaded", "content":{}});
}
