/*
Author: Matt Fishel, 2017

A reasonably simple learning project leveraging onmousemove events to create a
simple interactive graphic. The color of the background and middle circle
update based on mouse position relative to center. Angle determines hue and
distance to center determines luminance and saturation. The color of the
center circle is the opposite hue and saturation of the background.
*/

function boxInit() {
	colorInit();
	circleInit();
}

function colorInit() {
	var h = window.innerHeight;
	var w = window.innerWidth;
	var color = "grey";
	var heightInit = h + "px";
	var widthInit = w + "px";
	document.getElementById("box").style.background = color;
	document.getElementById("box").style.height = heightInit;
	document.getElementById("box").style.width = widthInit;
}

function circleInit() {
	document.getElementById("centerCircle").style.left =
		(window.innerWidth * 0.5) + "px";
	document.getElementById("centerCircle").style.top =
		(window.innerHeight * 0.5) + "px";
}

function boxResize() {
	var h = window.innerHeight;
	var w = window.innerWidth;
	var newHeight = h + "px";
	var newWidth = w + "px";
	document.getElementById("box").style.height = newHeight;
	document.getElementById("box").style.width = newWidth;
}

function circleResize(radius) {
	var newDiameter =
		Math.max(Math.min(window.innerWidth, window.innerHeight) - (2 * radius), 0);
	var lesserDimension = Math.min(window.innerWidth, window.innerHeight);
	var finalDiameter = Math.min(newDiameter, lesserDimension);
	var xPos = (window.innerWidth * 0.5) - (finalDiameter * 0.5);
	var yPos = (window.innerHeight * 0.5) - (finalDiameter * 0.5);
	document.getElementById("centerCircle").style.left = xPos + "px";
	document.getElementById("centerCircle").style.top = yPos + "px";
	document.getElementById("centerCircle").style.width = finalDiameter + "px";
	document.getElementById("centerCircle").style.height = finalDiameter + "px";
}

function colorShift(e) {
	var mouseX = e.clientX;
	var mouseY = e.clientY;
	var newDiameter = 2 * findRadFromCenter(mouseX, mouseY);
	var coordX = convertToCenterOrigin(mouseX,window.innerWidth);
	var coordY = convertToCenterOrigin(mouseY,window.innerHeight);
	var radiusFromCenter = findRadFromCenter(coordX,coordY);
	var windowRadMax = findRadFromCenterMax(window.innerWidth,window.innerHeight);
	var radiusNormal = findRadFromCenterNormal(radiusFromCenter,windowRadMax);
	var color = findColorAngle(coordX,coordY);
	var saturation = radiusNormal * 100;
	var luminance = 100 - (50 * radiusNormal);
	var colorUpdate = "hsl(" + color + "," + saturation + "%," + luminance + "%)";
	var circleColorUpdate = flipColor(color, saturation, luminance);
	circleResize(radiusFromCenter);
	document.getElementById("centerCircle").style.background =
	    circleColorUpdate;
	document.getElementById("box").style.background = colorUpdate;
}

function flipColor(color, saturation, luminance) {
	color = (color + 180) % 360;
	saturation = 100 - saturation;
	luminance = 150 - luminance;
	return "hsl(" + color + "," + saturation + "%," + luminance + "%)";
}

function convertToCenterOrigin (x,maxX) {
	var coord = x - (maxX/2);
	return coord;
}

function findRadFromCenter(x,y) {
	var radFromCenter = Math.sqrt(x*x + y*y);
	return radFromCenter;
}

function findRadFromCenterMax (h,w){
	var radFromCenterMax;
	if (h<=w){
		radFromCenterMax = h / 2;
	} else {
		radFromCenterMax = w / 2;
	}
	return radFromCenterMax;
}

function findRadFromCenterNormal (r, m) {
	if (r <= m){
		radFromCenterNormal = r / m;
	} else {
		radFromCenterNormal = 1;
	}
	return radFromCenterNormal;
}

function findColorAngle(x, y) {
	x *= -1; // up: red, down: cyan, left: yellow-green, right: violet
	var halfPI = Math.PI / 2;
	var twoPI = Math.PI * 2;
	var theta;
	if (x == 0) {
		theta = (y >= 0 ? halfPI : 3 * halfPI);
	} else {
		theta = Math.atan(y / x);
		if (x < 0) theta += Math.PI;
	}
	theta = (theta + twoPI) % twoPI + halfPI;
	colorAngle = (theta / twoPI) * 360;
	return colorAngle;
}
