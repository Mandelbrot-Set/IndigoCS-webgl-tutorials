'use strict';

function loadShaderAsync(shaderURL, callback) {
	var req = new XMLHttpRequest();
	req.open('GET', shaderURL, true);
	req.onload = function () {
		if (req.status < 200 || req.status >= 300) {
			callback('Could not load ' + shaderURL);
		} else {
			callback(null, req.responseText);
		}
	};
	req.send();
}

// Taken from http://stackoverflow.com/questions/641857/javascript-window-resize-event
//  Post by user Alex V
function AddEvent(object, type, callback) {
    if (object == null || typeof(object) == 'undefined') return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
}

function RemoveEvent(object, type, callback) {
    if (object == null || typeof(object) == 'undefined') return;
    if (object.removeEventListener) {
        object.removeEventListener(type, callback, false);
    } else if (object.detachEvent) {
        object.detachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
}

function Init() {
	async.map({
		vsText: '/mandl.vs.glsl',
		// fsText: '/sponge.glsl'
		// fsText:'pseudoKleinian.glsl'
		// fsText:'/gear.glsl'
		// fsText:'/fishSwim.glsl'
		// fsText: '/shader/guil/Mandelflow3.glsl'
		// fsText: '/shader/guil/Mandelflow2.glsl'
		// fsText: '/shader/guil/Mandeltree.glsl'
		// fsText: '/shader/iq/orbit_traps.glsl'
		fsText: '/shader/iq/julia/julia.glsl'
		// fsText: '/mandl.fs.glsl'
	}, loadShaderAsync, RunDemo);
}

function RunDemo(loadErrors, loadedShaders) {
	// Attach callbacks
	AddEvent(window, 'resize', OnResizeWindow);
	AddEvent(window, 'wheel', OnZoom);
	AddEvent(window, 'mousemove', OnMouseMove);

	var canvas = document.getElementById('gl-surface');
	var gl = canvas.getContext('webgl');
	if (!gl) {
		console.log('Webgl context not available - falling back on experimental');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl) {
		alert('Cannot get WebGL context - browser does not support WebGL');
		return;
	}

	// Create shader program
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, loadedShaders.vsText);
	gl.compileShader(vs);
	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
		console.error(
			'Vertex shader compile error:',
			gl.getShaderInfoLog(vs)
		);
	}

	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, loadedShaders.fsText);
	gl.compileShader(fs);
	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
		console.error(
			'Fragment shader compile error:',
			gl.getShaderInfoLog(fs)
		);
	}

	var program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(
			'Shader program link error:',
			gl.getShaderInfoLog(program)
		);
	}

	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error(
			'Shader program validate error:',
			gl.getShaderInfoLog(program)
		);
	}

	gl.useProgram(program);

	// Get uniform locations
	var uniforms = {
		iResolution: gl.getUniformLocation(program, 'iResolution'),
		iTime: gl.getUniformLocation(program, 'iTime'),
		AA: gl.getUniformLocation(program, 'AA')
	};

	// Set CPU-side variables for all of our shader variables
	var iResolution = [canvas.clientWidth, canvas.clientHeight];
	var iTime = 0.0;
	var AA = 4;

	// Create buffers
	var vertexBuffer = gl.createBuffer();
	var vertices = [
		-1, 1,
		-1, -1,
		1, -1,

		-1, 1,
		1, 1,
		1, -1
	];
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var vPosAttrib = gl.getAttribLocation(program, 'vPos');
	gl.vertexAttribPointer(
		vPosAttrib,
		2, gl.FLOAT,
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	gl.enableVertexAttribArray(vPosAttrib);

	var thisframetime;
	var lastframetime = performance.now();
	var dt;
	var frames = [];
	var lastPrintTime = performance.now();
	var start_time = performance.now();
	var loop = function () {
		// FPS information
		thisframetime = performance.now();
		dt = thisframetime - lastframetime;
		lastframetime = thisframetime;
		frames.push(dt);
		if (lastPrintTime + 750 < thisframetime) {
			lastPrintTime = thisframetime;
			var average = 0;
			for (var i = 0; i < frames.length; i++) {
				average += frames[i];
			}
			average /= frames.length;
			document.title = 1000 / average + ' fps';
		}
		frames = frames.slice(0, 250);

		// Draw
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

		gl.uniform2fv(uniforms.iResolution, iResolution);
		// 换算成秒
		iTime = parseInt((performance.now() - start_time)/1000);
		gl.uniform1f(uniforms.iTime, iTime);
		gl.uniform1i(uniforms.AA, AA);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);

	OnResizeWindow();

	//
	// Event Listeners
	//
	function OnResizeWindow() {
		if (!canvas) {
			return;
		}

		// This maybe not a good idear, just do it for convenient.
		// See more at https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		iResolution = [canvas.clientWidth, canvas.clientHeight];

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	}

	function OnZoom(e) {
		OnResizeWindow();
	}

	function OnMouseMove(e) {
	}
}
