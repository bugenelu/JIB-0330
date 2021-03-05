function setRandomColor(obj) {
  var b = getRandomColor();
  obj.style.background = b;
  var c = getRandomColor();
  obj.style.color = c;
}

function getRandomColor() {
  var r = getRandomInt();
  var g = getRandomInt();
  var b = getRandomInt();
  var c = "rgb(" + r + ", " + g + ", " + b + ")";
  return c;
}

function getRandomInt() {
  var x = 256;
  while (x == 256) {
      x = Math.floor(Math.random() * 256);
  }
  return x;
}
