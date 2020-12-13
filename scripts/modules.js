document.addEventListener('DOMContentLoaded', () => {
  includeModules();
});

function getXMLType() {
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        return new XMLHttpRequest();
    }
    else {// code for IE6, IE5
        return new ActiveXObject("Microsoft.XMLHTTP");
    }
}

function includeModules() {
    var z, i, element, file, xhttp;
    //Loop through a collection of all HTML elements
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
      element = z[i];
      //search for elements with a module atrribute
      file = element.getAttribute("module");
      if (file) {
        xhttp = getXMLType();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4) {
            if (this.status == 200) {
              element.innerHTML = this.responseText + element.innerHTML;
              if(applyModalPopups) {
                applyModalPopups(element)
              }
            }
            if (this.status == 404) {element.innerHTML = "Error loading module: " + file;}
            //Remove the attribute, and call this function again
            element.removeAttribute("module");
            includeModules();
          }
        }
        xhttp.open("GET", file, true);
        xhttp.send();
        return;
      }
    }
    if(window.onModulesFinished) {
      window.onModulesFinished()
      window.onModulesFinished = null
      //Sort of a hack at the moment, but needed to make sure bulma stuff is correct
      document.dispatchEvent(new Event("DOMContentLoaded"))
    }
  }