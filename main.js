import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Blue sky
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

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

const tower = new THREE.Mesh(
    new THREE.BoxGeometry(2, 80, 2),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
tower.position.set(-5, 30, 0);
scene.add(tower);

function createHorizontalArm(positionY, offsetX = 0, offsetZ = 0) {
    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    arm.position.set(offsetX, positionY, offsetZ);
    return arm;
}

const arm1 = createHorizontalArm(48.7, -1, -1.5);
scene.add(arm1);

const arm2 = createHorizontalArm(48.7, -1, 1.5);
scene.add(arm2);

// Loader for Rocket Model
const loader = new OBJLoader();
const clock = new THREE.Clock();

let rocket;
let fireLight, smokeParticles = [];

camera.position.set(100, 100, 200);
camera.lookAt(0, 20, 0);

// Load Rocket Model
loader.load(
    'models/stage-one.obj',
    function (object) {
        object.rotation.x = -Math.PI / 2;
        object.position.set(50, 150, -150); 
        rocket = object;
        scene.add(rocket);

        const flameGeometry = new THREE.CylinderGeometry(0.5, 1.5, 15, 32);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa500,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });

        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(0, 0, -8);
        flame.rotation.set(0, -Math.PI / 2, 30);
        rocket.add(flame);
    },
    undefined,
    function (error) {
        console.error('Error loading the model', error);
    }
);

// Update Flame Based on Rocket's Position
function updateRocketFlame(delta) {
    if (rocket) {
        const flame = rocket.children[0];

        const flameHeight = Math.max(15, 25 - rocket.position.y * 0.1);
        flame.scale.set(1, flameHeight, 1);

        const rotation = rocket.rotation;

        flame.position.x = 0 + Math.sin(rotation.z) * 2;
        flame.position.y = -8 + Math.sin(rotation.x) * 2;
        flame.position.z = 0 + Math.cos(rotation.z) * 2;

        flame.position.set(rocket.position.x + flame.position.x, rocket.position.y + flame.position.y, rocket.position.z + flame.position.z);
    }
}

function updateRocketPath(delta) {
    if (rocket) {
        const targetPosition = new THREE.Vector3(0, 20, 0);

        if (rocket.position.distanceTo(targetPosition) > 0.1) {
            rocket.position.lerp(targetPosition, delta * 0.2);
        } else {
            
            showRocketInfo(); 
        }
    }
}

// Display Rocket Information in a Cute Box
let infoBox = document.createElement('div');
infoBox.style.position = 'absolute';
infoBox.style.top = '20px';
infoBox.style.left = '20px';
infoBox.style.padding = '10px';
infoBox.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
infoBox.style.border = '2px solid #000';
infoBox.style.borderRadius = '10px';
infoBox.style.display = 'none'; 
infoBox.style.fontSize = '14px';
infoBox.style.color = '#333';
document.body.appendChild(infoBox);

function showRocketInfo() {
    infoBox.innerHTML = `
        <h3>Rocket Information</h3>
        <p>Model: Starship Super Heavy First Stage</p>
        <p>Position: ${rocket.position.x.toFixed(2)}m, ${rocket.position.y.toFixed(2)}m, ${rocket.position.z.toFixed(2)}m</p>
        <p>Status: Landed (Awaiting Launch)</p>
        <p>Max Thrust: 16.7 million pounds of thrust</p>
        <p>Height: 70 meters</p>
        <p>Payload Capacity: 230 tons to low Earth orbit (LEO)</p>
    `;
    infoBox.style.display = 'block'; 
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Normalize mouse position to [-1, 1] range
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.update(camera, renderer.domElement);

    const intersects = raycaster.intersectObject(rocket);

    if (intersects.length > 0) {
        // Rocket was clicked
        showRocketInfo();
    }
}

window.addEventListener('click', onMouseClick);

// Update Camera Movement
function updateRocketAndCamera(delta) {
    if (rocket) {
        camera.position.lerp(
            new THREE.Vector3(
                rocket.position.x + 20,
                rocket.position.y + 50,
                rocket.position.z + 100
            ),
            delta * 0.1
        );

        camera.lookAt(rocket.position);
    }
}

function animate() {
    const delta = clock.getDelta();

    if (rocket) {
        updateRocketFlame(delta);
        updateRocketPath(delta); // Keep checking if rocket stops
        updateRocketAndCamera(delta);
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

const controls = new OrbitControls(camera, renderer.domElement);
animate();
