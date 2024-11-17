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
    new THREE.BoxGeometry(2, 40, 2),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
tower.position.set(-5, 15, 0);
scene.add(tower);

function createHorizontalArm(positionY, offsetX = 0, offsetZ = 0) {
    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    arm.position.set(offsetX, positionY, offsetZ);
    return arm;
}

const arm1 = createHorizontalArm(33.7, -1, -1.5);
scene.add(arm1);

const arm2 = createHorizontalArm(33.7, -1, 1.5);
scene.add(arm2);

function createDiagonalSupport(startX, startY, endX, endY) {
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const support = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );

    const start = new THREE.Vector3(startX, startY, 0);
    const end = new THREE.Vector3(endX, endY, 0);

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    support.scale.set(1, length, 1);
    support.position.copy(start);
    support.lookAt(end);

    return support;
}

const support1 = createDiagonalSupport(0, 25, 7, 10);
scene.add(support1);

const support2 = createDiagonalSupport(0, 25, 7, 20);
scene.add(support2);

const loader = new OBJLoader();
const clock = new THREE.Clock();

let rocket;
let fireLight, smokeParticles = [];

camera.position.set(100, 100, 200);
camera.lookAt(0, 20, 0);

loader.load(
    'models/stage-one.obj',
    function (object) {
        object.rotation.x = -Math.PI / 2;
        object.position.set(50, 150, -100); 
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

        flame.position.set(0, -8, 0);
        rocket.add(flame);

        for (let i = 0; i < 20; i++) {
            const smokeTexture = new THREE.TextureLoader().load('textures/smoke.png');
            const smokeMaterial = new THREE.SpriteMaterial({ map: smokeTexture, transparent: true });
            const smoke = new THREE.Sprite(smokeMaterial);
            smoke.scale.set(5, 5, 1);
            smoke.position.set(
                50 + Math.random() * 4 - 2,
                98,
                -50 + Math.random() * 4 - 2
            );
            scene.add(smoke);
            smokeParticles.push(smoke);
        }
    },
    undefined,
    function (error) {
        console.error('Error loading the model', error);
    }
);

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

function updateRocketAndCamera(delta) {
    if (rocket) {
        const targetPosition = new THREE.Vector3(0, 1, 0);

        if (rocket.position.distanceTo(targetPosition) > 0.1) {
            rocket.position.lerp(targetPosition, delta * 0.2);

            smokeParticles.forEach((smoke) => {
                smoke.position.y -= 5 * delta;
                smoke.material.opacity -= delta * 0.5;
                if (smoke.material.opacity <= 0) {
                    smoke.material.opacity = 1;
                    smoke.position.set(
                        rocket.position.x + Math.random() * 4 - 2,
                        rocket.position.y - 2,
                        rocket.position.z + Math.random() * 4 - 2
                    );
                }
            });
        }

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
        updateRocketAndCamera(delta);
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

const controls = new OrbitControls(camera, renderer.domElement);
animate();
