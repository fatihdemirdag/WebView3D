// Imported libraries //////////////////////////////////////////////////////////////////////////////////////////////////

import * as THREE from '../lib/threejs/Three.js';
import { GLTFLoader } from '../lib/threejs/addons/jsm/loaders/GLTFLoader.js';


// Classes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class View3D360 {
  constructor(container) {
    this.isInitialized = false;
    this.mScene = null;
    this.mCamera = null;
    this.mRayCaster = null;
    this.mTextureLoader = null;
    this.m3DViewTexture = null;
    this.m3DViewMaterial = null;
    this.m3DViewMesh = null;
    this.mGLTFLoader = null;
    this.mLight = null;
    this.mRenderer = null;

    this.mContainer = document;
    this.mIsDragging = null;
    this.mMouseX = null;
    this.mMouseY = null;

    this.initialize3D();
    this.initializeScene();

    this.mContainer.appendChild(this.mRenderer.domElement);

    document.addEventListener('mouseclick', this.onMouseClick);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    this.isInitialized = true;
  }



  initialize3D() {
    console.log('Initializing 3D...');
    this.mRenderer = new THREE.WebGLRenderer({ antialias: true });
    console.log('  Renderer Type: ' + this.mRenderer);
    this.mScene = new THREE.Scene();
    this.mCamera = new THREE.PerspectiveCamera(75,this.mContainer.clientWidth / this.mContainer.clientHeight,
      0.1, 1000);

    THREE.ColorManagement.enabled = true;

    this.mRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.mRenderer.toneMappingExposure = THREE.ReinhardToneMapping;
    //this.mRenderer.enableDepthTest = true;

    this.mRenderer.setSize(this.mContainer.clientWidth, this.mContainer.clientHeight, false);
    console.log('  Width:'+ this.mContainer.clientWidth + ' Height:'+ this.mContainer.clientHeight);
    //this.mRenderer.clear(true, true, true);

    requestAnimationFrame(this.update);
    console.log('3D initialized.');
  }



  initializeScene() {
    console.log('Initializing scene...');
    this.mTextureLoader = new THREE.TextureLoader();
    this.m3DViewTexture = this.mTextureLoader.load('../data/location0/img5.jpg');
    console.log('imageWidth: ' + this.m3DViewTexture.width);
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
    console.log('Scene initialized.');
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
    this.mIsDragging = false;
    this.mMouseX = event.clientX;
    this.mMouseY = event.clientY;
  }



  update() {
    if (this != null && this.isInitialized) {
      this.mScene.sort(this.compareDistances);
      this.mRenderer.render(this.mScene, this.mCamera);
    }
  }
}
