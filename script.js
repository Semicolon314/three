var seed, persist, octaves;
var scene, camera, renderer, cube, terrain;
var verts = [];
var time = 0;

var ambientLight;
var cloud;

WIDTH = 10;
HEIGHT = 40;

waveline = 0.0;
wakeline = 15.0;

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

  var cloudGeo = new THREE.DodecahedronGeometry(50, 0);
  var cloudMat = new THREE.MeshLambertMaterial({color: 0xDDDDDD, shading: THREE.FlatShading});
  cloud = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(cloud);
  cloud.position.set(0, 500, 0);
  cloud.rotation.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);

  ambientLight = new THREE.AmbientLight(0x101010);
  scene.add(ambientLight);

  var skyLight = new THREE.HemisphereLight(0x666666, 0xBBBBBB, 1);
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

function distortGeometry(geometry, amplitude, time, timeDelta, perlinSeed) {
  for(var i = 0; i < geometry.vertices.length; i++) {
    var vert = geometry.vertices[i];
    var dx = perlin.pnoise2(i, time, 0.4, 4, perlinSeed) - perlin.pnoise2(i, time - timeDelta, 0.4, 4, perlinSeed);
    var dy = perlin.pnoise2(i, time, 0.4, 4, perlinSeed + 1) - perlin.pnoise2(i, time - timeDelta, 0.4, 4, perlinSeed + 1);
    var dz = perlin.pnoise2(i, time, 0.4, 4, perlinSeed + 2) - perlin.pnoise2(i, time - timeDelta, 0.4, 4, perlinSeed + 2);
    vert.x += dx;
    vert.y += dy;
    vert.z += dz;
  }
  geometry.verticesNeedUpdate = true;
  geometry.normalsNeedUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
}

function updateVerts(resolution, blocksX, blocksY, time) {
  for(var i = 0; i <= resolution * blocksX; i++) {
    for(var j = 0; j <= resolution * blocksY; j++) {
      var h = perlin.pnoise3(i / resolution, j / resolution, time, persist, octaves, seed);
      verts[i * resolution * blocksY + j].y = h + Math.max(0, Math.min(3, 3 - 0.1 * Math.abs(waveline - j))) - Math.max(0, Math.min(3, 3 - 0.1 * Math.abs(wakeline - j)));
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
  waveline += 0.17;
  wakeline += 0.17;
  if(waveline > 160) {
    waveline -= 160;
    wakeline -= 160;
  }
  updateVerts(3, WIDTH, HEIGHT, time);
  terrain.geometry.vertices = verts;
  terrain.geometry.verticesNeedUpdate = true;
  terrain.geometry.normalsNeedUpdate = true;
  terrain.geometry.computeBoundingBox();
  terrain.geometry.computeFaceNormals();
  terrain.geometry.computeVertexNormals();

  cloud.rotation.x += 0.05;
  cloud.rotation.y += 0.05;

  //distortGeometry(cloud.geometry, 5, time, 0.01, 1234);

  renderer.render( scene, camera );
}
init();