// Imported libraries //////////////////////////////////////////////////////////////////////////////////////////////////

import * as THREE from '../lib/threejs/Three.js';
import { GLTFLoader } from '../lib/threejs/addons/jsm/loaders/GLTFLoader.js';


// Classes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

class View3D360 {
  constructor(container) {
    let mRenderer: THREE.WebGLRenderer;
    let mScene: THREE.Scene;
    let mCamera: THREE.Camera;
    let mRayCaster: THREE.Raycaster;
    let mTextureLoader: THREE.TextureLoader;
    let m3DViewTexture: THREE.Texture;
    let m3DViewMaterial: THREE.MeshBasicMaterial;
    let m3DViewMesh: THREE.Mesh;
    let mGLTFLoader: GLTFLoader;
    let mLight: THREE.PointLight;

    let mIsDragging: Boolean = false;
    let mMouseX: Number = 0;
    let mMouseY: Number = 0;

    let mContainer = container;

    this.initialize3D();
    this.initializeScene();

    mContainer.appendChild(this.mRenderer.domElement);

    document.addEventListener('mouseclick', this.onMouseClick);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }



  initialize3D() {
    this.mRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.mScene = new THREE.Scene();
    this.mCamera = new THREE.PerspectiveCamera(75,this.mContainer.clientWidth / this.mContainer.clientHeight,
      0.1, 1000);

    THREE.ColorManagement.enabled = true;

    this.mRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.mRenderer.toneMappingExposure = THREE.ReinhardToneMapping;
    //this.mRenderer.enableDepthTest = true;

    this.mRenderer.setSize(this.mContainer.clientWidth, this.mContainer.clientHeight, false);
    //this.mRenderer.clear(true, true, true);

    requestAnimationFrame(this.update);
  }



  initializeScene() {
    this.mTextureLoader = new THREE.TextureLoader();
    this.m3DViewTexture = this.mTextureLoader.load('../data/location0/img5.jpg');
    this.m3DViewTexture.colorSpace = THREE.SRGBColorSpace;
    this.m3DViewMaterial = new THREE.MeshBasicMaterial({ map: this.m3DViewTexture, color: 0xffffff });
    this.m3DViewMaterial.fog = 0.0;
    this.m3DViewMaterial.toneMapped = false;


    this.mLight = new THREE.PointLight( 0xffffff, 2.0, 1000.0, 0.0 );
    this.mScene.add(this.mLight);

    this.m3DViewMesh = new THREE.Object3D();
    this.mGLTFLoader = new GLTFLoader(); // Assuming glTF format
    this.mGLTFLoader.load('../sphere.gltf', (gltf) => {
      const model = gltf.scene.children[0]; // Extract the scene from the loaded glTF data

      model.material = this.m3DViewMaterial;
      model.scale.set(100.0, 100.0, 100.0);
      model.rotation.x = 3.14159265;
      model.name = "room";
      this.mScene.add(model); // Add the model to the scene
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });

    this.mCamera.position.x = 0.0;
    this.mCamera.position.y = 0.0;
    this.mCamera.position.z = 0.0;
    this.mLight.position.set(this.mCamera.position.x + 0.001, this.mCamera.position.y, this.mCamera.position.z);

  }



  compareDistances(a, b) {
    const distanceA = a.position.distanceTo(this.mCamera.position);
    const distanceB = b.position.distanceTo(this.mCamera.position);
    return distanceB - distanceA; // Sort far to near
  }



  onMouseClick(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    this.mRayCaster.setFromCamera(mouse, this.mCamera);
    const intersects = this.mRayCaster.intersectObjects(this.mScene.children, true);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.scale.y < 1.0)
      {
        // Perform action on clicked object (e.g., change color)
        clickedObject.material.color.set(0xff0000); // Change to red
      }
    }
  }



  onMouseDown(event) {
    this.mIsDragging = true;
    this.mMouseX = event.clientX;
    this.mMouseY = event.clientY;

    this.onMouseClick(event);
  }



  onMouseMove(event) {
    if (this.mIsDragging) {
      const deltaX = event.clientX - this.mMouseX;
      const deltaY = event.clientY - this.mMouseY;

      this.mCamYaw += deltaX / window.innerWidth * Math.PI;
      this.mCamPitch += deltaY / window.innerHeight * Math.PI;
      if (this.mCamPitch > 60.0 * Math.PI / 180.0) this.mCamPitch = 60.0 * Math.PI / 180.0;
      if (this.mCamPitch < -60.0 * Math.PI / 180.0) this.mCamPitch = -60.0 * Math.PI / 180.0;

      const camDir = new THREE.Vector3(0.0, 0.0, 1.0);
      camDir.y = Math.sin(this.mCamPitch);
      camDir.x = Math.cos(this.mCamPitch) * Math.sin(this.mCamYaw);
      camDir.z = Math.cos(this.mCamPitch) * Math.cos(this.mCamYaw);
      this.mCamera.lookAt(new THREE.Vector3(camDir.x, camDir.y, camDir.z));

      this.mMouseX = event.clientX;
      this.mMouseY = event.clientY;
    }
  }



  onMouseUp(event) {
    this.misDragging = false;
    this.mMouseX = event.clientX;
    this.mMouseY = event.clientY;
  }



  update() {
    this.mScene.childeren.sort(compareDistances);
    this.mRenderer.render(this.mScene, this.mCamera);
  }
}


export { View3D360 };
