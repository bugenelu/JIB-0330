// var iframe = document.getElementById("map_iframe");
// var elmnt =   iframe.contentWindow.document.getElementById("map_canvas");

// dragElement(elmnt);

dragElement(document.getElementById('map_canvas'));

// TODO: Limit movement range to slighly less than total map dimension

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
  
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      let y_min = elmnt.getAttribute("y_min_offset");
      let y_max = elmnt.getAttribute("y_max_offset");
      let x_min = elmnt.getAttribute("x_min_offset");
      let x_max = elmnt.getAttribute("x_max_offset");
      elmnt.style.top = Math.min(Math.max((elmnt.offsetTop - pos2), y_min), y_max) + "px";
      elmnt.style.left = Math.min(Math.max((elmnt.offsetLeft - pos1), x_min), x_max) + "px";
    }
  
    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
}