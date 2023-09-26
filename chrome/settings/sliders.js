function UpdateSliders() {
  cb_enabled.checked = enabled;
  cb_enabled.addEventListener("click", function() {
    enabled = cb_enabled.checked;
  });

  cb_quickdel.checked = quickDelete;
  cb_quickdel.addEventListener("click", function() {
    if (!quickDelete && cb_quickdel.checked) {
      alert("Videos will be highlighted instead.\nClick the thumbnail to quickly\nremove them, telling YouTube to\nstop trying to recommend them to you.");
    }
    quickDelete = cb_quickdel.checked;
  });
}
