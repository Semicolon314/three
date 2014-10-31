var seed, persist, octaves;
var scene, camera, renderer, cube, terrain;
var verts = [];
var time = 0;

WIDTH = 10;
HEIGHT = 40;

function init() {
  seed = Math.floor(Math.random() * 10000);
  persist = 0.4;
  octaves = 10;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 4000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  geometry2 = getWaveGeometry(3, WIDTH, HEIGHT, 0);
  material2 = new THREE.MeshLambertMaterial({color: 0x2222FF, shading:THREE.FlatShading});
  terrain = new THREE.Mesh(geometry2, material2);
  terrain.scale.set(100, 25, 100);
  terrain.receiveShadow = true;
  terrain.position.set(-1000, 0, -1500);
  scene.add(terrain);

  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(1200, 200, 200);
  spotLight.castShadow = true;
  spotLight.shadowMapWidth = 1024;
  spotLight.shadowMapHeight = 1024;
  spotLight.shadowCameraNear = 500;
  spotLight.shadowCameraFar = 4000;
  spotLight.shadowCameraFov = 30;
  scene.add(spotLight);

  var ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  var skyLight = new THREE.HemisphereLight(0x000088, 0x00CC00, 1);
  scene.add(skyLight);

  var skyGeo = new THREE.SphereGeometry( 1000, 32, 15 );
  var skyMat = new THREE.MeshBasicMaterial({color: 0xb2ffff});
  sky = new THREE.Mesh( skyGeo, skyMat );
  sky.material.side = THREE.DoubleSide;
  scene.add( sky );


  camera.position.set(-900, 200, 0);
  camera.lookAt(new THREE.Vector3(1000, -100, 0));

  render();
}

function updateVerts(resolution, blocksX, blocksY, time) {
  for(var i = 0; i <= resolution * blocksX; i++) {
    for(var j = 0; j <= resolution * blocksY; j++) {
      var h = perlin.pnoise3(i / resolution, j / resolution, time, persist, octaves, seed);
      verts[i * resolution * blocksY + j].y = h;
    }
  }
}

function getWaveGeometry(resolution, blocksX, blocksY, time) {
  var geometry = new THREE.Geometry();
  for(var i = 0; i <= resolution * blocksX; i++) {
    for(var j = 0; j <= resolution * blocksY; j++) {
      var h = perlin.pnoise3(i / resolution, j / resolution, time, persist, octaves, seed);
      verts.push(new THREE.Vector3(i / resolution, h, j / resolution));
    }
  }
  geometry.vertices = verts;
  resolutionX = resolution * blocksX;
  resolutionY = resolution * blocksY;
  for(var i = 0; i <= resolutionX; i++) {
    for(var j = 0; j <= resolutionY; j++) {
      if(i <= resolutionX - 1 && j <= resolutionY - 1) {
        geometry.faces.push(new THREE.Face3(i * (resolutionY + 1) + j, i * (resolutionY + 1) + j + 1, (i + 1) * (resolutionY + 1) + j));
      }
      if(i <= resolutionX - 1 && j > 0) {
        geometry.faces.push(new THREE.Face3(i * (resolutionY + 1) + j, (i + 1) * (resolutionY + 1) + j, (i + 1) * (resolutionY + 1) + j - 1));
        geometry.faces.push(new THREE.Face3(i * (resolutionY + 1) + j, (i + 1) * (resolutionY + 1) + j, (i + 1) * (resolutionY + 1) + j - 1));
      }
    }
  }
  geometry.computeBoundingBox();
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  return geometry;
}

function render() {
  requestAnimationFrame( render );

  time += 0.01;
  updateVerts(3, WIDTH, HEIGHT, time);
  terrain.geometry.vertices = verts;
  terrain.geometry.verticesNeedUpdate = true;
  terrain.geometry.normalsNeedUpdate = true;
  terrain.geometry.computeBoundingBox();
  terrain.geometry.computeFaceNormals();
  terrain.geometry.computeVertexNormals();

  renderer.render( scene, camera );
}
init();