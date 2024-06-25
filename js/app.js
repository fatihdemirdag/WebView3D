import * as View360 from './View3D360Library.js';


let viewer = new View360.View3D360(document.body, 'location0/data.xml');
viewer.init();

document.addEventListener('mouseclick', onMouseClick);
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

document.addEventListener('touchstart', onTouchStart);
document.addEventListener('touchmove', onTouchMove);
document.addEventListener('touchend', onTouchEnd);
requestAnimationFrame(animate);


function onMouseClick(event) {
  viewer.onMouseClick(event);
}

function onMouseDown(event) {
  viewer.onMouseDown(event);
}

function onMouseMove(event) {
  viewer.onMouseMove(event);
}

function onMouseUp(event) {
  viewer.onMouseUp(event);
}


function onTouchStart(event) {
  // Prevent the default behavior of touchstart event
  //event.preventDefault();
  viewer.onMouseDown(event.touches[0]);
}

function onTouchMove(event) {
  // Prevent the default behavior of touchmove event
  //event.preventDefault();
  viewer.onMouseMove(event.touches[0]);
}

function onTouchEnd(event) {
  // Prevent the default behavior of touchend event
  //event.preventDefault();
  viewer.onMouseUp(event.changedTouches[0]);
}

function animate(){
  requestAnimationFrame(animate);
  viewer.update();
}

