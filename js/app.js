import * as THREE from '../lib/threejs/Three.js';
import { GLTFLoader } from '../lib/threejs/addons/jsm/loaders/GLTFLoader.js';


document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

let isDragging = false;
let mouseX = 0;
let mouseY = 0;
let camyaw = 0
let campitch = 0;

const raycaster = new THREE.Raycaster();


function onMouseDown(event) {
  isDragging = true;
  mouseX = event.clientX;
  mouseY = event.clientY;

  onMouseClick(event);
}



function onMouseMove(event) {
  if (isDragging) {
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;

    camyaw += deltaX / window.innerWidth * Math.PI;
    campitch += deltaY / window.innerHeight * Math.PI;
    if (campitch > 60.0 * Math.PI / 180.0) campitch = 60.0 * Math.PI / 180.0;
    if (campitch < -60.0 * Math.PI / 180.0) campitch = -60.0 * Math.PI / 180.0;

    const camDir = new THREE.Vector3(0.0, 0.0, 1.0);
    camDir.y = Math.sin(campitch);
    camDir.x = Math.cos(campitch) * Math.sin(camyaw);
    camDir.z = Math.cos(campitch) * Math.cos(camyaw);
    camera.lookAt(new THREE.Vector3(camDir.x, camDir.y, camDir.z));

    mouseX = event.clientX;
    mouseY = event.clientY;
  }
}



function onMouseUp(event) {
  isDragging = false;
  mouseX = event.clientX;
  mouseY = event.clientY;
}



function compareDistances(a, b) {
  const distanceA = a.position.distanceTo(camera.position);
  const distanceB = b.position.distanceTo(camera.position);
  return distanceB - distanceA; // Sort far to near
}




const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });


THREE.ColorManagement.enabled = true;
renderer.setClearColor(0xFFFFFF, 1.);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMappingExposure = THREE.ReinhardToneMapping;
renderer.enableDepthTest = true;

renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.clear(true, true, true);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('../data/location0/img5.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });


const light = new THREE.PointLight( 0xffffff, 2.0, 1000.0, 0.0 );
scene.add( light );

const model = new THREE.Object3D();
const loader = new GLTFLoader(); // Assuming glTF format
loader.load('../sphere.gltf', (gltf) => {
  const model = gltf.scene.children[0]; // Extract the scene from the loaded glTF data
  material.fog = 0.0;
  material.toneMapped = false;
  //model.geometry = tmpmodel.geometry;
  model.material = material;
  model.scale.set(100.0, 100.0, 100.0);
  model.rotation.x = 3.14159265;
  model.name = "room";
  scene.add(model); // Add the model to the scene
}, undefined, (error) => {
  console.error('Error loading model:', error);
});



const geometry = new THREE.SphereGeometry(0.2, 32, 16);
const geometry2 = new THREE.SphereGeometry(0.2, 32, 16);
const geometry3 = new THREE.SphereGeometry(0.2, 32, 16);
const geometry4 = new THREE.SphereGeometry(0.2, 32, 16);
const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe:false, opacity: 0.2, blending: THREE.NormalBlending, transparent: true }); // Green cube
const material22 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe:false, opacity: 0.2, blending: THREE.NormalBlending, transparent: true }); // Green cube
const material23 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe:false, opacity: 0.2, blending: THREE.NormalBlending, transparent: true }); // Green cube
const material24 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe:false, opacity: 0.2, blending: THREE.NormalBlending, transparent: true }); // Green cube
const sph = new THREE.Mesh(geometry, material2);
const sph2 = new THREE.Mesh(geometry2, material22);
const sph3 = new THREE.Mesh(geometry3, material23);
const sph4 = new THREE.Mesh(geometry4, material24);
sph.name = "point";
sph2.name = "point2";
sph3.name = "point3";
sph4.name = "point4";
scene.add(sph);
sph.position.x = 5.0;
sph.position.y = -1.0;
sph.position.z = 1.0;
sph.scale.y = 0.1;

scene.add(sph2);
sph2.position.x = -7.0;
sph2.position.y = -1.0;
sph2.position.z = -1.0;
sph2.scale.y = 0.1;

scene.add(sph3);
sph3.position.x = -3.0;
sph3.position.y = -1.0;
sph3.position.z = -0.8;
sph3.scale.y = 0.1;

scene.add(sph4);
sph4.position.x = -0.9;
sph4.position.y = -1.0;
sph4.position.z = 2.5;
sph4.scale.y = 0.1;

camera.position.x = 0.0;
camera.position.y = 0.0;
camera.position.z = 0.0;
light.position.set(camera.position.x + 0.001, camera.position.y, camera.position.z);

function animate() {
  requestAnimationFrame(animate);

  //camera.rotation.z += 0.01;
  //cube.rotation.y += 0.0;
  scene.children.sort(compareDistances);
  renderer.render(scene, camera);

}


function onMouseClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject.scale.y < 1.0)
    {
      // Perform action on clicked object (e.g., change color)
      clickedObject.material.color.set(0xff0000); // Change to red
    }
  }
}

animate();
