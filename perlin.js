var T_NOISE_GEN = 20287.0;
var OCTAVE_NOISE_GEN = 14737.0;
var SEED_NOISE_GEN = 21269.0;
var X_NOISE_GEN = 707933.0;
var Y_NOISE_GEN = 39607.0;
var Z_NOISE_GEN = 43063.0;

var perlin = [];
perlin.noise = function(t, octave, seed) {
	var n = (T_NOISE_GEN * t + OCTAVE_NOISE_GEN * octave + SEED_NOISE_GEN * seed) & 0x7fffffff;
	n = (n >> 13) ^ n;
	return 1 - ((n * ((n * n * 53849 + 1421737) & 0x7fffffff) + 468185813) & 0x7fffffff) / 1073741824.0;
}

perlin.noise2 = function(x, y, octave, seed) {
	var n = (X_NOISE_GEN * x + Y_NOISE_GEN * y + OCTAVE_NOISE_GEN * octave + SEED_NOISE_GEN * seed) & 0x7fffffff;
	n = (n >> 13) ^ n;
	return 1 - ((n * ((n * n * 53849 + 1421737) & 0x7fffffff) + 468185813) & 0x7fffffff) / 1073741824.0;
}

perlin.noise3 = function(x, y, z, octave, seed) {
	var n = (X_NOISE_GEN * x + Y_NOISE_GEN * y + Z_NOISE_GEN * z + OCTAVE_NOISE_GEN * octave + SEED_NOISE_GEN * seed) & 0x7fffffff;
	n = (n >> 13) ^ n;
	return 1 - ((n * ((n * n * 53849 + 1421737) & 0x7fffffff) + 468185813) & 0x7fffffff) / 1073741824.0;
}

perlin.interpolate = function(a, b, x) {
	var ft = x * Math.PI;
	var f = (1 - Math.cos(ft)) * 0.5;
	return a * (1 - f) + b * f;
}

perlin.inoise = function(x, octave, seed) {
	var intx = Math.floor(x);
	var fracx = x - intx;
	
	var n1 = perlin.noise(intx, octave, seed);
	var n2 = perlin.noise(intx + 1, octave, seed);
	
	return perlin.interpolate(n1, n2, fracx);
}

perlin.inoise2 = function(x, y, octave, seed) {
	var intx = Math.floor(x);
	var fracx = x - intx;
	var inty = Math.floor(y);
	var fracy = y - inty;
	
	var v1 = perlin.noise2(intx, inty, octave, seed);
	var v2 = perlin.noise2(intx + 1, inty, octave, seed);
	var v3 = perlin.noise2(intx, inty + 1, octave, seed);
	var v4 = perlin.noise2(intx + 1, inty + 1, octave, seed);
	
	var i1 = perlin.interpolate(v1, v2, fracx);
	var i2 = perlin.interpolate(v3, v4, fracx);
	
	return perlin.interpolate(i1, i2, fracy);
}

perlin.inoise3 = function(x, y, z, octave, seed) {
	var intx = Math.floor(x);
	var fracx = x - intx;
	var inty = Math.floor(y);
	var fracy = y - inty;
	var intz = Math.floor(z);
	var fracz = z - intz;
	
	var v1 = perlin.noise2(intx, inty, intz, octave, seed);
	var v2 = perlin.noise2(intx + 1, inty, intz, octave, seed);
	var v3 = perlin.noise2(intx, inty + 1, intz, octave, seed);
	var v4 = perlin.noise2(intx + 1, inty + 1, intz, octave, seed);
	var v5 = perlin.noise2(intx, inty, intz + 1, octave, seed);
	var v6 = perlin.noise2(intx + 1, inty, intz + 1, octave, seed);
	var v7 = perlin.noise2(intx, inty + 1, intz + 1, octave, seed);
	var v8 = perlin.noise2(intx + 1, inty + 1, intz + 1, octave, seed);

	var i1 = perlin.interpolate(v1, v2, fracx);
	var i2 = perlin.interpolate(v3, v4, fracx);
	var i3 = perlin.interpolate(v5, v6, fracx);
	var i4 = perlin.interpolate(v7, v8, fracx);

	var j1 = perlin.interpolate(i1, i2, fracy);
	var j2 = perlin.interpolate(i3, i4, fracy);
	
	return perlin.interpolate(j1, j2, fracz);
}

perlin.pnoise = function(x, persist, octaves, seed) {
	var total = 0;
	
	for(var i = 0; i < octaves; i++) {
		var frequency = Math.pow(2, i);
		var amplitude = Math.pow(persist, i);
		total += perlin.inoise(x * frequency, i, seed) * amplitude;
	}
	
	return total;
}

perlin.pnoise2 = function(x, y, persist, octaves, seed) {
	var total = 0;
	
	for(var i = 0; i < octaves; i++) {
		var frequency = Math.pow(2, i);
		var amplitude = Math.pow(persist, i);
		total += perlin.inoise2(x * frequency, y * frequency, i, seed) * amplitude;
	}
	
	return total;
}

perlin.pnoise3 = function(x, y, z, persist, octaves, seed) {
	var total = 0;
	
	for(var i = 0; i < octaves; i++) {
		var frequency = Math.pow(2, i);
		var amplitude = Math.pow(persist, i);
		total += perlin.inoise3(x * frequency, y * frequency, (z + x * 0.1 + y * 0.2) * frequency, i, seed) * amplitude;
	}
	
	return total;
}