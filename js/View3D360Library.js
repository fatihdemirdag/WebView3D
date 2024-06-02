// Imported libraries //////////////////////////////////////////////////////////////////////////////////////////////////

import * as THREE from '../lib/threejs/Three.js';
import { GLTFLoader } from '../lib/threejs/addons/jsm/loaders/GLTFLoader.js';
//import {int} from "../lib/threejs/addons/jsm/nodes/shadernode/ShaderNode";


function ViewLocation3D(id, name, x, y, z) {
  this.id = id;
  this.name = name;
  this.x = x;
  this.y = y;
  this.z = z;

  this.getDistance = function(other_view_location) {
    return Math.sqrt(
      Math.pow(this.x - other_view_location.x, 2) +
      Math.pow(this.y - other_view_location.y, 2) +
      Math.pow(this.z - other_view_location.z, 2));
  }

  this.getAngleDiff = function(other_view_location) {
    return Math.abs(Math.atan2(other_view_location.y - this.y, other_view_location.x - this.x) -
      Math.atan2(this.y, this.x));
  }

  this.getDirection = function(other_view_location) {
    return Math.atan2(other_view_location.y - this.y, other_view_location.x - this.x);
  }

  return this;
}


// Classes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

class View3D360 {
  constructor(container, filePath) {
    this.mRenderer = null;
    this.mScene = null;
    this.mCamera = null;
    this.mRayCaster = null;
    this.mTextureLoader = null;
    this.m3DViewTexture = null;
    this.m3DViewMaterial = null;
    this.m3DViewMesh = null;
    this.mGLTFLoader = null;
    this.mLight = null;

    this.mIsDragging = false;
    this.mMouseX = 0;
    this.mMouseY = 0;

    this.mCamYaw = 0.0;
    this.mCamPitch = 0.0;

    this.mContainer = container;
    this.mXMLFilePath = filePath;
    this.mViewLocations = [];
    this.mLocationsLoaded = false;
    this.elementIndex = 0;
  }


  init() {
    this.loadXML();
    this.initialize3D();
    this.initializeScene();
  }



  async loadXML() {
    this.mLocationsLoaded = false;
    const file_url = 'http://localhost:63342/WebView3D/data/' + this.mXMLFilePath;
    console.log(file_url);
    const response = await fetch(file_url);
    console.log(response);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const xmlData = await response.text();
    console.log('xml = ' + xmlData);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    this.elementIndex = 0;
    xmlDoc.getElementsByTagName('locationList')[0].childNodes.forEach(element => {
      console.log('element Index: ' + this.elementIndex + '  value: ' + element.nodeName);
      if (element.nodeName === 'location') {
        const id = element.getAttribute('id');
        const name = element.getAttribute('name');
        const x = parseFloat(element.getAttribute('x'));
        const y = parseFloat(element.getAttribute('y'));
        const z = parseFloat(element.getAttribute('z'));
        this.mViewLocations.push(new ViewLocation3D(id, name, x, y, z));
      }
      this.elementIndex++;

    });
    this.mLocationsLoaded = true;
  }


  initialize3D() {
    console.log('function initialize3D() started');

    this.mRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.mContainer.appendChild(this.mRenderer.domElement);
    this.mScene = new THREE.Scene();
    this.mCamera = new THREE.PerspectiveCamera(75,this.mContainer.clientWidth / this.mContainer.clientHeight,
      0.1, 1000);
    this.mRayCaster = new THREE.Raycaster();

    THREE.ColorManagement.enabled = true;

    this.mRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.mRenderer.toneMappingExposure = THREE.ReinhardToneMapping;
    //this.mRenderer.enableDepthTest = true;

    this.mRenderer.setSize(this.mContainer.clientWidth, this.mContainer.clientHeight, false);
    this.mRenderer.clear(true, true, true);

    console.log('function initialize3D() finished');
  }



  initializeScene() {
    console.log('function initializeScene() started');

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

    console.log('function initializeScene() finished');
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

      this.mCamYaw += deltaX / this.mContainer.clientWidth * Math.PI;
      this.mCamPitch += deltaY / this.mContainer.clientHeight * Math.PI;
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
    if (this.mLocationsLoaded) {
      //this.showLocations();
    }
    this.mRenderer.render(this.mScene, this.mCamera);
  }
}


export { View3D360 };
