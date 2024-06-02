import * as View360 from './View3D360Library.js';


let viewer = new View360.View3D360(document.body, 'location0/data.xml');
viewer.init();

document.addEventListener('mouseclick', onMouseClick);
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
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

function animate(){
  requestAnimationFrame(animate);
  viewer.update();
}

