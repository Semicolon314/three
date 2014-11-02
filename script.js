var seed, persist, octaves;
var scene, camera, renderer, cube, terrain;
var verts = [];
var time = 0;

var ambientLight, skyLight, sky;
var clouds;

WIDTH = 10;
HEIGHT = 40;

waveline = -50.0;

var lightLevel = 1.0;
var cloudGenRate = 0.004;

function Cloud() {
  var rotVary = 0.01;
  this.angularVelocity = new THREE.Vector3(Math.random() * 2 * rotVary - rotVary, Math.random() * 2 * rotVary - rotVary, Math.random() * 2 * rotVary - rotVary);
  var geo = new THREE.DodecahedronGeometry(10, 0);
  var mat = new THREE.MeshLambertMaterial({color: 0xDDDDDD, shading: THREE.FlatShading});
  this.mesh = new THREE.Mesh(geo, mat);
  this.mesh.castShadow = true;
  this.perlinSeed = Math.floor(Math.random() * 10000);
}
Cloud.prototype.tick = function(time) {
  this.mesh.rotation.x += this.angularVelocity.x;
  this.mesh.rotation.y += this.angularVelocity.y;
  this.mesh.rotation.z += this.angularVelocity.z;
  distortGeometry(this.mesh.geometry, 40, time, this.perlinSeed);
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
  spotLight.position.set(1200*2, 300*2, 200*2);
  spotLight.castShadow = true;
  spotLight.shadowMapWidth = 1024;
  spotLight.shadowMapHeight = 1024;
  spotLight.shadowCameraNear = 500;
  spotLight.shadowCameraFar = 4000;
  spotLight.shadowCameraFov = 30;
  scene.add(spotLight);

  clouds = [];
  /*for(var i = 0; i < 50; i++) {
    var cloud = new Cloud();
    cloud.mesh.position.set(Math.floor(Math.random() * 1000)-500, 350, Math.floor(Math.random() * 1000)-500);
    scene.add(cloud.mesh);
    clouds.push(cloud);
  }
*/
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

function adjacentVertices(geometry, vertex) {
  var adj = [];
  for(var i = 0; i < geometry.faces.length; i++) {
    var face = geometry.faces[i];
    if(face.a == vertex || face.b == vertex || face.c == vertex) {
      [face.a, face.b, face.c].forEach(function(v) {
        if(v != vertex && adj.indexOf(v) == -1) {
          adj.push(v);
        }
      });
    }
  }
  return adj;
}

function distortGeometry(geometry, size, time, perlinSeed) {
  var lens = [];
  for(var i = 0; i < geometry.vertices.length; i++) {
    lens.push((perlin.pnoise2(i, time + i * 0.32214, 0.4, 4, perlinSeed) + 1.5) * size);
  }
  for(var i = 0; i < geometry.vertices.length; i++) {
    // Find average adjacent vertex length
    var adj = adjacentVertices(geometry, i);
    var total = 0;
    for(var j = 0; j < adj.length; j++) {
      total += lens[adj[j]];
    }
    total /= adj.length;
    // Set the length of this vertex to the average of its length and the average length of adjacent vertices
    geometry.vertices[i].setLength((lens[i] + total * 2) / 3);
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
  clouds.forEach(function(cloud) {
    cloud.tick(time);
    cloud.mesh.position.z += 1;
  });

  if(Math.random() < cloudGenRate) {
    var cloud = new Cloud();
    cloud.mesh.position.set(Math.floor(Math.random() * 1000)-600, 350, -1500);
    scene.add(cloud.mesh);
    clouds.push(cloud);
  }
  //cloud.position.x += 2;
  //cloud.position.z += 2;

  lightLevel = 0.5 * (1 + Math.cos(time / 10));

  // Update light colours
  skyLight.color.setHex(interpolateColors(0x222222, 0x666666, lightLevel));
  sky.material.color.setHex(interpolateColors(0x000000, 0xb2ffff, lightLevel));

  //distortGeometry(cloud.geometry, 5, tim e, 0.01, 1234);

  renderer.render( scene, camera );
}
init();