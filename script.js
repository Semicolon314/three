var seed, persist, octaves;
var scene, camera, renderer, cube, terrain;
var verts = [];
var time = 0;

var ambientLight, skyLight, sky;
var cloud;

WIDTH = 10;
HEIGHT = 40;

waveline = -50.0;

var lightLevel = 1.0;

function Cloud(size, numParts) {
  var geo, mat, rel, rot, mesh;

  this.parts = [];
  for(var i = 0; i < numParts; i++) {
    geo = new THREE.DodecahedronGeometry(size * (Math.random() + 0.5));
    mat = new THREE.MeshLambertMaterial({color: 0xDDDDDD, shading: THREE.FlatShading});
    var posVary = 0.8 * size;
    var rotVary = 0.01;
    rel = new THREE.Vector3(Math.random() * 2 * posVary - posVary, Math.random() * 2 * posVary - posVary, Math.random() * 2 * posVary - posVary);
    rot = new THREE.Vector3(Math.random() * 2 * rotVary - rotVary, Math.random() * 2 * rotVary - rotVary, Math.random() * 2 * rotVary - rotVary);
    mesh = new THREE.Mesh(geo, mat);
    distortGeometry(mesh.geometry, 5, 0, 20, 1234 + i);
    this.parts.push({mesh: mesh, relative: rel, rotate: rot});
  }

  this.position = new THREE.Vector3(0, 0, 0);
}
Cloud.prototype.addTo = function(scene) {
  for(var i = 0; i < this.parts.length; i++) {
    scene.add(this.parts[i].mesh);
  }
}
Cloud.prototype.tick = function(time) {
  for(var i = 0; i < this.parts.length; i++) {
    var part = this.parts[i];
    //part.mesh.rotation.x += part.rotate.x;
    //part.mesh.rotation.y += part.rotate.y;
    //part.mesh.rotation.z += part.rotate.z;
    part.mesh.position.addVectors(this.position, part.relative);
    distortGeometry(part.mesh.geometry, 5, time, 0.01, 1234 + i);
  }
}

function interpolateColors(a, b, x) {
  var red = ((a & 0xff0000) * (1 - x) + (b & 0xff0000) * x) / 0xff0000;
  var green = ((a & 0x00ff00) * (1 - x) + (b & 0x00ff00) * x) / 0x00ff00;
  var blue = ((a & 0x0000ff) * (1 - x) + (b & 0x0000ff) * x) / 0x0000ff;
  red = Math.max(0, Math.min(1, red));
  green = Math.max(0, Math.min(1, green));
  blue = Math.max(0, Math.min(1, blue));
  return Math.floor(red * 0xff) * 0x10000  + Math.floor(green * 0xff) * 0x100 + Math.floor(blue * 0xff);
}

function init() {
  seed = Math.floor(Math.random() * 10000);
  persist = 0.4;
  octaves = 10;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 5000 );

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
  spotLight.position.set(1200, 300, 200);
  spotLight.castShadow = true;
  spotLight.shadowMapWidth = 1024;
  spotLight.shadowMapHeight = 1024;
  spotLight.shadowCameraNear = 500;
  spotLight.shadowCameraFar = 4000;
  spotLight.shadowCameraFov = 30;
  scene.add(spotLight);

  cloud = new Cloud(50, 5);
  cloud.position.set(200, 400, -1000);
  //cloud.addTo(scene);

  ambientLight = new THREE.AmbientLight(0x101010);
  scene.add(ambientLight);

  skyLight = new THREE.HemisphereLight(interpolateColors(0x222222, 0x666666, lightLevel), 0xBBBBBB, 1);
  scene.add(skyLight);

  var skyGeo = new THREE.SphereGeometry( 1000, 32, 15 );
  var skyMat = new THREE.MeshBasicMaterial({color: interpolateColors(0x000000, 0xb2ffff, lightLevel)});
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
    vert.x += dx * amplitude;
    vert.y += dy * amplitude;
    vert.z += dz * amplitude;
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
      var wave = - 5 * Math.sin((j - waveline) / 10.0) / (Math.pow((j - waveline) / 10.0, 2) + 1.0);
      if(Math.abs(j - waveline) / 10.0 > Math.PI * 2) {
        wave = 0;
      }
      verts[i * resolution * blocksY + j].y = h + wave;
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
  if(waveline > 200) {
    waveline = -50;
  }
  updateVerts(3, WIDTH, HEIGHT, time);
  terrain.geometry.vertices = verts;
  terrain.geometry.verticesNeedUpdate = true;
  terrain.geometry.normalsNeedUpdate = true;
  terrain.geometry.computeBoundingBox();
  terrain.geometry.computeFaceNormals();
  terrain.geometry.computeVertexNormals();
  cloud.tick(time);
  //cloud.position.x += 2;
  cloud.position.z += 2;

  lightLevel = 0.5 * (1 + Math.cos(time / 10));

  // Update light colours
  skyLight.color.setHex(interpolateColors(0x222222, 0x666666, lightLevel));
  sky.material.color.setHex(interpolateColors(0x000000, 0xb2ffff, lightLevel));

  //distortGeometry(cloud.geometry, 5, tim e, 0.01, 1234);

  renderer.render( scene, camera );
}
init();