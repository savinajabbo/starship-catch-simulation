import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// terrain
const groundTexture = new THREE.TextureLoader().load('textures/asphalt.jpg');
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ map: groundTexture })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const launchPad = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1, 10),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
);
launchPad.position.y = 0.5;
scene.add(launchPad);


// Launch tower (vertical structure)
const tower = new THREE.Mesh(
    new THREE.BoxGeometry(2, 40, 2), // Tall, thin vertical structure
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
tower.position.set(-5, 15, 0); // Position the tower
scene.add(tower);

// Horizontal arms
function createHorizontalArm(positionY, offsetX = 0, offsetZ = 0) {
    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 1), // Long horizontal arm
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    arm.position.set(offsetX, positionY, offsetZ); // Adjusted position with x, y, and z offsets
    return arm;
}

// Add horizontal arms at different heights and positions
const arm1 = createHorizontalArm(33.7, -1, -1.5); // Positioned at z = -10
scene.add(arm1);

const arm2 = createHorizontalArm(33.7, -1, 1.5); // Positioned at z = 5
scene.add(arm2);

// Optional: Add diagonal supports to the arms (to mimic Mechazilla's appearance)
function createDiagonalSupport(startX, startY, endX, endY) {
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8); // Thin diagonal rod
    const support = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );

    const start = new THREE.Vector3(startX, startY, 0);
    const end = new THREE.Vector3(endX, endY, 0);

    // Align the cylinder with the start and end positions
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    support.scale.set(1, length, 1); // Scale based on calculated length
    support.position.copy(start);
    support.lookAt(end);

    return support;
}

// Add supports for the arms, adjusted for new arm positions
const support1 = createDiagonalSupport(0, 25, 7, 10); // Shifted 2 units to the right
scene.add(support1);

const support2 = createDiagonalSupport(0, 25, 7, 20); // Shifted 2 units to the right
scene.add(support2);

// instantiate a loader
const loader = new OBJLoader();

loader.load(
	// resource URL
	'models/stage-one.obj',
	// called when resource is loaded
	function (object) {
		// Rotate the first stage to an angle
		object.rotation.x = -Math.PI / 2; // Adjust the angle (e.g., 45 degrees)
		scene.add(object);
	},
);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(20, 50, 50);
controls.update();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
