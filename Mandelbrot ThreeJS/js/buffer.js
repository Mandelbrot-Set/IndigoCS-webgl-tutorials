// Three.js - Custom BufferGeometry - TypedArrays
// from https://threejsfundamentals.org/threejs/threejs-custom-buffergeometry-cube-typedarrays.html

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r112/build/three.module.js';

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

function main() {
    // 加载渲染器文件
    async.map({
        mandfsText: "/shader/mand.fs.glsl",
        mandvsText: "/shader/mand.vs.glsl"
    }, loadShaderAsync, loadExec)
}

function loadExec(loadErrors, loadedShaders) {
    console.log(loadedShaders);
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});

    const fov = 75;
    const aspect = canvas.width/canvas.height;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5;

    const scene = new THREE.Scene();

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    // NOT A GOOD EXAMPLE OF HOW TO MAKE A CUBE!
    // Only trying to make it clear most vertices are unique
    const vertices = [
        // front
        { pos: [-1, -1,  1], norm: [ 0,  0,  1], uv: [0, 1], color: [1.0, 1.0, 0.0], }, // 0
        { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 1], color: [0.7, 0.0, 1.0], }, // 1
        { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 0], color: [0.1, 1.0, 0.6], }, // 2
        { pos: [ 1,  1,  1], norm: [ 0,  0,  1], uv: [1, 0], color: [1.0, 1.0, 0.0], }, // 3
        // right
        { pos: [ 1, -1,  1], norm: [ 1,  0,  0], uv: [0, 1], color: [1.0, 1.0, 0.0], }, // 4
        { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 1], color: [0.7, 0.0, 1.0], }, // 5
        { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 0], color: [0.1, 1.0, 0.6], }, // 6
        { pos: [ 1,  1, -1], norm: [ 1,  0,  0], uv: [1, 0], color: [1.0, 1.0, 0.0], }, // 7
        // back
        { pos: [ 1, -1, -1], norm: [ 0,  0, -1], uv: [0, 1], color: [1.0, 1.0, 0.0], }, // 8
        { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 1], color: [0.7, 0.0, 1.0], }, // 9
        { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 0], color: [0.1, 1.0, 0.6], }, // 10
        { pos: [-1,  1, -1], norm: [ 0,  0, -1], uv: [1, 0], color: [1.0, 1.0, 0.0], }, // 11
        // left
        { pos: [-1, -1, -1], norm: [-1,  0,  0], uv: [0, 1], color: [1.0, 1.0, 0.0], }, // 12
        { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 1], color: [0.7, 0.0, 1.0], }, // 13
        { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 0], color: [0.1, 1.0, 0.6], }, // 14
        { pos: [-1,  1,  1], norm: [-1,  0,  0], uv: [1, 0], color: [1.0, 1.0, 0.0], }, // 15
        // top
        { pos: [ 1,  1, -1], norm: [ 0,  1,  0], uv: [0, 1], color: [1.0, 1.0, 0.0], }, // 16
        { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 1], color: [0.7, 0.0, 1.0], }, // 17
        { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 0], color: [0.1, 1.0, 0.6], }, // 18
        { pos: [-1,  1,  1], norm: [ 0,  1,  0], uv: [1, 0], color: [1.0, 1.0, 0.0], }, // 19
        // bottom
        { pos: [ 1, -1,  1], norm: [ 0, -1,  0], uv: [0, 1], color: [1.0, 1.0, 0.0], }, // 20
        { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 1], color: [0.7, 0.0, 1.0], }, // 21
        { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 0], color: [0.1, 1.0, 0.6], }, // 22
        { pos: [-1, -1, -1], norm: [ 0, -1,  0], uv: [1, 0], color: [1.0, 1.0, 0.0], }, // 23
    ];
    const numVertices = vertices.length;
    const positionNumComponents = 3;
    const colorNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const positions = new Float32Array(numVertices * positionNumComponents);
    const colors = new Float32Array(numVertices * colorNumComponents);
    const normals = new Float32Array(numVertices * normalNumComponents);
    const uvs = new Float32Array(numVertices * uvNumComponents);
    let posNdx = 0;
    let clrNdx = 0;
    let nrmNdx = 0;
    let uvNdx = 0;
    for (const vertex of vertices) {
        positions.set(vertex.pos, posNdx);
        colors.set(vertex.color, clrNdx);
        normals.set(vertex.norm, nrmNdx);
        uvs.set(vertex.uv, uvNdx);
        posNdx += positionNumComponents;
        clrNdx += colorNumComponents;
        nrmNdx += normalNumComponents;
        uvNdx += uvNumComponents;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, positionNumComponents));
    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, colorNumComponents));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(normals, normalNumComponents));
    geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(uvs, uvNumComponents));

    geometry.setIndex([
        0,  1,  2,   2,  1,  3,  // front
        4,  5,  6,   6,  5,  7,  // right
        8,  9, 10,  10,  9, 11,  // back
        12, 13, 14,  14, 13, 15,  // left
        16, 17, 18,  18, 17, 19,  // top
        20, 21, 22,  22, 21, 23,  // bottom
    ]);

    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/star.png');

    function makeInstance(geometry, color, x) {
        // const material = new THREE.MeshPhongMaterial();
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 1.0 }
            },
            vertexShader: loadedShaders.mandvsText,
            fragmentShader: loadedShaders.mandfsText,
            side: THREE.DoubleSide,
            transparent: true
        });

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;
        return cube;
    }

    const cubes = [
        makeInstance(geometry, 0x88FF88,  0),
        // makeInstance(geometry, 0x8888FF, -4),
        // makeInstance(geometry, 0xFF8888,  4),
    ];

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
