{
  var verNumber = document.getElementById("vernumber");

  if (verNumber) {
    var version = browser.runtime.getManifest().version;
    var verSplit = version.split('.');

    if (verSplit.length > 1) { // e.g. 2.0.1
      version = verSplit[0] + "." + verSplit[1];
    }

    verNumber.innerText = "v" + version;
  }
}
