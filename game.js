// --- Game Variables & Engine Setup ---
let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

let wood = 100;
let score = 0;
const blocks = [];
const targets = [];
const raycaster = new THREE.Raycaster();

init();
animate();

function init() {
    // 1. Scene & Camera Architecture
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Eyeline height

    // 2. Environment Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20);
    scene.add(sunLight);

    // 3. Ground Terrain
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 }); // Green grass
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 4. Spawn Shooting Targets
    spawnTargets();

    // 5. First-Person Camera PointerLock Controls
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.PointerLockControls(camera, renderer.domElement);
    
    document.body.addEventListener('click', () => {
        controls.lock();
    });

    // 6. Keyboard & Mouse Input Handlers
    window.addEventListener('keydown', (e) => onKeyDown(e));
    window.addEventListener('keyup', (e) => onKeyUp(e));
    window.addEventListener('mousedown', (e) => handleInteraction(e));
    window.addEventListener('resize', onWindowResize);
}

// --- Player Movement Control Logic ---
function onKeyDown(e) {
    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'KeyE': buildStructure('wall'); break;
        case 'KeyQ': buildStructure('floor'); break;
    }
}

function onKeyUp(e) {
    switch (e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

// --- Fortnite Building & Weapon Shooting System ---
function handleInteraction(e) {
    if (!controls.isLocked || e.button !== 0) return; // Core Left Click trigger

    // Cast a laser pointer from center screen forward
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
        const hitTarget = intersects[0].object;
        scene.remove(hitTarget);
        targets.splice(targets.indexOf(hitTarget), 1);
        
        score += 20;
        wood += 15; // Farming resources from targets
        document.getElementById('score-count').innerText = score;
        document.getElementById('wood-count').innerText = wood;
        
        spawnTargets(); // Instantly replace target elsewhere
    }
}

function buildStructure(type) {
    if (!controls.isLocked || wood < 10) return;

    // Determine grid build location 4 units ahead of player perspective
    const buildVector = new THREE.Vector3();
    camera.getWorldDirection(buildVector);
    
    const buildX = Math.round((camera.position.x + buildVector.x * 4) / 3) * 3;
    const buildZ = Math.round((camera.position.z + buildVector.z * 4) / 3) * 3;
    let buildY = Math.round(camera.position.y / 3) * 3;

    let geo, mat;
    if (type === 'wall') {
        geo = new THREE.BoxGeometry(3, 3, 0.2);
        mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b }); // Wood brown wall
    } else {
        geo = new THREE.BoxGeometry(3, 0.2, 3);
        mat = new THREE.MeshStandardMaterial({ color: 0xa0522d }); // Darker brown floor
        buildY -= 1.5; // Offset to level underneath player alignment
    }

    const structure = new THREE.Mesh(geo, mat);
    structure.position.set(buildX, buildY + 1.5, buildZ);
    
    // Rotate wall towards player direction
    if (type === 'wall') {
        structure.rotation.y = Math.atan2(buildVector.x, buildVector.z);
    }

    scene.add(structure);
    blocks.push(structure);

    wood -= 10;
    document.getElementById('wood-count').innerText = wood;
}

function spawnTargets() {
    while (targets.length < 5) {
        const geo = new THREE.BoxGeometry(1.5, 3, 1.5);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Bright Red Dummies
        const target = new THREE.Mesh(geo, mat);
        
        target.position.set(
            (Math.random() - 0.5) * 60,
            1.5,
            (Math.random() - 0.5) * 60
        );
        scene.add(target);
        targets.push(target);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Main Engine Refresh Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        // Apply friction/damping to smooth movement slides
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        prevTime = time;
    }

    renderer.render(scene, camera);
}
