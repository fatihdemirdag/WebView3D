import * as View360 from './View3D360Library.js';


let viewer = new View360.View3D360(document.body);
viewer.mScene.add(viewer.mLight);

function animate(){
  viewer.update();
}

