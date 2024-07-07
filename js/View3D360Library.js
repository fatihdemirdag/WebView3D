// Imported libraries //////////////////////////////////////////////////////////////////////////////////////////////////

import * as THREE from '../lib/threejs/Three.js';
import { GLTFLoader } from '../lib/threejs/addons/jsm/loaders/GLTFLoader.js';
//import {int} from "../lib/threejs/addons/jsm/nodes/shadernode/ShaderNode";


function ViewLocation3D(id, name, x, y, z, fileName, rotate) {
  this.id = id;
  this.name = name;
  this.x = x;
  this.y = y;
  this.z = z;
  this.fileName = fileName;
  this.geometry = new THREE.SphereGeometry(0.4);
  this.geometry.scale(1.0, 0.05, 1.0);
  this.geometry.visible = true;
  this.material = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe:false, opacity: 0.3,
    blending: THREE.NormalBlending, transparent: true});
  this.mesh = new THREE.Mesh(this.geometry, this.material);
  this.mesh.name = this.name;
  this.mesh.position.x = this.x;
  this.mesh.position.y = this.z - 1.5;
  this.mesh.position.z = this.y;
  this.rotate = rotate;

  return this;
}


function Relation(fromID, toID) {
  this.fromID = fromID;
  this.toID = toID;

  return this;
}


// Classes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

class View3D360 {
  constructor(container, filePath) {
    this.mContainer = container;
    this.mBasePath = 'http://localhost:63342/WebView3D/data/';
    this.mLocationPath = filePath;

    this.mRenderer = null;
    this.mScene = null;
    this.mCamera = null;
    this.mRayCaster = null;
    this.mTextureLoader = null;
    this.m3DViewMesh = null;
    this.m3DViewTexture = null;
    this.m3DViewMaterial = null;
    this.mGLTFLoader = null;
    this.mLight = null;

    this.mIsDragging = false;
    this.mMouseX = 0;
    this.mMouseY = 0;

    this.mCamYaw = 0.0;
    this.mCamPitch = 0.0;

    this.mViewLocations = [];
    this.mRelations = [];
    this.mLocationsLoaded = false;
    this.mElementIndex = 0;
    this.mActiveElementIndex = 0;
    this.mTransitionActive = false;
    this.mTransitionFrame = 0.0;
    this.mMoveVector = new THREE.Vector3(0, 0, 0);
    this.tripod_height = 0.0;

    this.rotation = new THREE.Vector3(0.0, 0.0, 0.0);
  }



  async init() {
    await this.loadXML();
    this.reportLocations();
    this.initialize3D();
    this.initializeScene();
    this.addLocationsToScene();
  }



  async loadXML() {
    this.mLocationsLoaded = false;
    const file_url = this.mBasePath + this.mLocationPath + 'data.xml';
    const response = await fetch(file_url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const xmlData = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    this.mElementIndex = 0;
    const eEnv= xmlDoc.getElementsByTagName('environment')[0];
    const eLocList = eEnv.getElementsByTagName('locationList')[0];
    this.tripod_height  = parseFloat(eLocList.getAttribute('height'));

    eEnv.getElementsByTagName('locationList')[0].childNodes.forEach(element => {
      if (element.nodeName === 'location') {
        const id = element.getAttribute('id');
        const name = element.getAttribute('name');
        const x = parseFloat(element.getAttribute('x'));
        const y = parseFloat(element.getAttribute('y'));
        const z = parseFloat(element.getAttribute('z'));
        const fileName = element.getAttribute('image');
        const rotate = parseFloat(element.getAttribute('rotate'));
        this.mViewLocations.push(new ViewLocation3D(id, name, x, y, z, fileName, rotate));
      }
      this.mElementIndex++;
    });

    eEnv.getElementsByTagName('relationList')[0].childNodes.forEach(element => {
      if (element.nodeName === 'relation') {
        const fromID = element.getAttribute('fromID');
        const toID = element.getAttribute('toID');
        this.mRelations.push(new Relation(fromID, toID));
      }
    });
    this.mLocationsLoaded = true;
    this.mActiveElementIndex = 0;
  }



  addLocationsToScene() {
    for (let i = 0; i < this.mViewLocations.length; i++) {
      this.mScene.add(this.mViewLocations[i].mesh);
    }
  }


  reportLocations() {
    for (let i = 0; i < this.mViewLocations.length; i++)
    {
      console.log(this.mViewLocations[i].id +'' + this.mViewLocations[i].name +'' +
        this.mViewLocations[i].x +'' + this.mViewLocations[i].y +'' +
        this.mViewLocations[i].z +'' + this.mViewLocations[i].fileName);
    }
  }


  initialize3D() {
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
  }



  relocateSpheres(id) {
    for (let i = 0; i < this.mViewLocations.length; i++)
    {
      this.mViewLocations[i].mesh.position.x = this.mViewLocations[i].x - this.mViewLocations[id].x;
      this.mViewLocations[i].mesh.position.y = this.mViewLocations[i].z - this.mViewLocations[id].z - this.tripod_height;
      this.mViewLocations[i].mesh.position.z = this.mViewLocations[i].y - this.mViewLocations[id].y;
    }

    for (let i = 0; i < this.mRelations.length; i++)
    {
      if (this.mRelations[i].fromID === this.mViewLocations[id].id)
        this.mViewLocations[this.mRelations[i].toID].mesh.visible = true;

      if (this.mRelations[i].toID === this.mViewLocations[id].id)
        this.mViewLocations[this.mRelations[i].fromID].mesh.visible = true;
    }
  }



  hideAllSpheres() {
    for (let i = 0; i < this.mViewLocations.length; i++) {
      this.mViewLocations[i].mesh.visible = false;
    }
  }



  beginSwitchToLocation(id) {
    this.mTransitionActive = true;
    this.mTransitionFrame = 0;
    this.mMoveVector = new THREE.Vector3(
      (this.mViewLocations[id].x - this.mViewLocations[this.mActiveElementIndex].x),
      (this.mViewLocations[id].z - this.mViewLocations[this.mActiveElementIndex].z),
      (this.mViewLocations[id].y - this.mViewLocations[this.mActiveElementIndex].y));

    this.mMoveVector.normalize();
    this.mMoveVector = this.mMoveVector.multiplyScalar(0.6);

    this.hideAllSpheres();
  }


  async endSwitchToLocation(id) {
    this.mTextureLoader = new THREE.TextureLoader();
    this.m3DViewTexture = this.mTextureLoader.load('../data/' + this.mLocationPath + this.mViewLocations[id].fileName);
    this.m3DViewMaterial = new THREE.MeshBasicMaterial({ map: this.m3DViewTexture, color: 0xffffff, fog: 0.0,
      toneMapped: false, wireframe: false });

    this.m3DViewMesh.material = this.m3DViewMaterial;
    this.mCamera.position.x = 0.0;
    this.mCamera.position.y = 0.0;
    this.mCamera.position.z = 0.0;

    this.mActiveElementIndex = id;
    this.mTransitionActive = false;

    this.relocateSpheres(id);
  }



  initializeScene() {
    this.mTextureLoader = new THREE.TextureLoader();
    this.m3DViewTexture = this.mTextureLoader.load('../data/' + this.mLocationPath +
      this.mViewLocations[this.mActiveElementIndex].fileName);
    //this.m3DViewTexture.colorSpace = THREE.SRGBColorSpace;
    this.m3DViewMaterial = new THREE.MeshBasicMaterial({ map: this.m3DViewTexture, color: 0xffffff,
      fog: 0.0, toneMapped: false, wireframe: false });

    this.mLight = new THREE.PointLight( 0xffffff, 2.0, 1000.0, 0.0 );
    this.mScene.add(this.mLight);

    this.m3DViewMesh = new THREE.Object3D();
    this.mGLTFLoader = new GLTFLoader(); // Assuming glTF format
    this.mGLTFLoader.load('sphere.gltf', (gltf) => {
      const model = gltf.scene.children[0]; // Extract the scene from the loaded glTF data

      model.material = this.m3DViewMaterial;
      model.scale.set(100.0, 100.0, 100.0);
      model.rotation.x = 3.14159265;
      model.name = "room";
      this.m3DViewMesh = model;
      this.mScene.add(model); // Add the model to the scene
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });

    this.mCamera.position.x = 0.0;
    this.mCamera.position.y = 0.0;
    this.mCamera.position.z = 0.0;

    this.mLight.position.set(this.mCamera.position.x + 0.001, this.mCamera.position.y, this.mCamera.position.z);
  }



  onMouseClick(event) {
    if (!this.mTransitionActive) {
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      this.mRayCaster.setFromCamera(mouse, this.mCamera);
      const intersects = this.mRayCaster.intersectObjects(this.mScene.children, true);
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.scale.y < 2.0) {
          for (let i = 0; i < this.mViewLocations.length; i++) {
            if (this.mViewLocations[i].mesh.id === clickedObject.id) {
              this.beginSwitchToLocation(i);
              this.mActiveElementIndex = i;
              break;
            }
          }
        }
      }
    }
  }



  onMouseDown(event) {
    if (!this.mTransitionActive) {
      this.mIsDragging = true;
      this.mMouseX = event.clientX;
      this.mMouseY = event.clientY;

      this.onMouseClick(event);
    }
  }



  onMouseMove(event) {
    if (this.mIsDragging && !this.mTransitionActive) {
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
    if (!this.mTransitionActive) {
      this.mIsDragging = false;
      this.mMouseX = event.clientX;
      this.mMouseY = event.clientY;
    }
  }



  async update() {
    if (this.m3DViewMesh != undefined) {
      this.m3DViewMesh.rotation.y = this.mViewLocations[this.mActiveElementIndex].rotate * 3.14159265 / 180.0;
    }

    if (this.mLocationsLoaded) {
      if (this.mTransitionActive) {
        this.mIsDragging = false;
        this.mTransitionFrame += 1.0;
        this.mCamera.position.add(this.mMoveVector);
        if (this.mTransitionFrame >= 30) {
          this.mTransitionActive = false;
          this.endSwitchToLocation(this.mActiveElementIndex);
        }
      }
      this.mRenderer.render(this.mScene, this.mCamera);
    }
  }
}


export { View3D360 }
