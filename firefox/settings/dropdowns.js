function UpdateDropdowns() {
  window.requestAnimationFrame(UpdateDropdowns);

  // For all dropdowns...
  var dropdowns = document.getElementsByClassName("dropdown-content");
  for (var i = 0; i < dropdowns.length; i++) {
    var openDropdown = dropdowns[i];
    var pos = openDropdown.parentElement.getBoundingClientRect().top;

    // Flip dropdown position if on the bottom half of the screen,
    // responsive & prevents dropdowns from clipping out
    openDropdown.style.bottom = pos > (150 / 0.75) ? "100%" : "";
  }
}
UpdateDropdowns();

function CloseAllDropdowns() {
  // For all dropdowns...
  var dropdowns = document.getElementsByClassName("dropdown-content");
  for (var i = 0; i < dropdowns.length; i++) {
    var openDropdown = dropdowns[i];
    // if visible,
    if (openDropdown.classList.contains("dropdown-visible")) {
      // hide
      openDropdown.classList.remove("dropdown-visible");
    }
  }
}

// When the button is clicked, show/hide the dropdown menu
function DropdownToggle(element) {
  CloseAllDropdowns(); // in case a dropdown is open
  element.classList.toggle("dropdown-visible"); // toggle clicked dropdown

  // setup scroll if necessary
  if (element.childElementCount > 7) {
    element.style.height = "161pt";
    element.style.overflowY = "auto";
  }
  else {
    element.style.height = "";
    element.style.overflowY = "";
  }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches(".dropbtn")) {
    CloseAllDropdowns();
  }
}
