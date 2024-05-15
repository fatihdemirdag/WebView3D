import * as View360 from './View3D360Library.js';


let viewer = new View360.View3D360(document.body);
function animate(){
  viewer.update();
}

