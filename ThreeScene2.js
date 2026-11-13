import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

function initThreeScene() {
    const container = document.querySelector('.simulation-area');
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.shadowMap.enabled = false;

    // ensure canvas sits above UI overlay
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '10010';
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 30;

    let isRunning = false;
    function requestRender() {
        if (!isRunning) {
            isRunning = true;
            requestAnimationFrame(renderLoop);
        }
    }
    window.requestThreeSceneRender = requestRender;
    controls.addEventListener('change', requestRender);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 6, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffd7c2, 1.2);
    fillLight.position.set(-3, 1.5, -2);
    scene.add(fillLight);

    const loader = new GLTFLoader();
    let model = null;
    let activeExterior = null;
    const meshNames = [];
    // hood interaction holders (populated after model load)
    let hoodPivots = [];
    let hoodState = [];
    // door interaction holders
    let doorPivots = [];
    let doorState = [];
    // battery terminal cap interaction holders
    let batteryCapPivots = [];
    let batteryCapState = [];
    // air filter housing pivot holders
    let airFilterBoxPivot = null;
    let airFilterBoxState = null;
    let hoveredCapIndex = null;
    let capTooltipElement = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function fitCameraToTarget(target) {
        const box = new THREE.Box3().setFromObject(target);
        const size = box.getSize(new THREE.Vector3());
        const radius = size.length() * 0.5;

        // fit the camera to the model bounds so widening the container does not clip the car
        const aspect = camera.aspect || (container.clientWidth / container.clientHeight);
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const fitHeightDistance = radius / Math.tan(vFov / 2);
        const fitWidthDistance = fitHeightDistance / aspect;
        // bring the camera closer so the car appears larger by default
        const distance = Math.max(fitHeightDistance, fitWidthDistance) * 0.58;
        const viewDir = new THREE.Vector3(0.12, 0.16, 2.4).normalize();
        const targetCenter = new THREE.Vector3(0, 0.14, 0);
        camera.position.copy(targetCenter).add(viewDir.multiplyScalar(distance));
        controls.target.copy(targetCenter);
        controls.update();
    }

    function frameModel(target) {
        if (!target.userData.__normalizedForViewer) {
            const box = new THREE.Box3().setFromObject(target);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            target.position.x -= center.x;
            target.position.y -= center.y;
            target.position.z -= center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                // scale up the model so it appears larger in the viewport
                const base = 9.5;
                const scale = (base * 1.25) / maxDim;
                target.scale.setScalar(scale);
            }

            // keep the car centered in the viewport
            target.position.y = -0.32;
            target.userData.__normalizedForViewer = true;
        }

        fitCameraToTarget(target);
    }

    loader.load(
        window.THREE_SCENE_CAR_MODEL || 'models/NEW_CARWITHENGINE.glb',
        function (gltf) {
            model = gltf.scene;
            model.rotation.y = Math.PI * 0.28;

            // Simpler approach: clone the whole model and remove/hide interior parts
            const exterior = model.clone(true);
            exterior.traverse((child) => {
                if (!child.isMesh) return;
                const nameUpper = (child.name || '').toUpperCase();
                meshNames.push(child.name || '(unnamed)');
                // If this is an interior mesh, remove it from the exterior clone
                if (['DASHBOARD', 'SEATS', 'INTERIOR'].includes(nameUpper)) {
                    child.visible = false;
                    return;
                }
                // meshes already have proper normals exported in glTF
            });

            console.log('Car GLB mesh names:', meshNames);
            // expose names and quick wheel report for debugging in the page context
            try {
                const wheelCandidates = meshNames.filter(n => /WHEEL|WHEELS|TIRE|RIM|BRAKE|AXLE/gi.test(n));
                window.__meshReport = {
                    all: meshNames,
                    wheelCandidates,
                    timestamp: Date.now()
                };
            } catch (e) { console.warn(e); }

            // keep a reference for debugging and hide the original model to avoid interior bleed
            window.__originalModel = model;
            model.visible = false;

            exterior.name = 'CarExteriorGroup';
            scene.add(exterior);
            activeExterior = exterior;

            // finalize exterior materials and properties
            const paintHex = 0xEDEDED; // neutral light paint like reference
            exterior.traverse((c) => {
                if (!c.isMesh) return;
                c.castShadow = false;
                c.receiveShadow = false;
                const n = (c.name || '').toUpperCase();
                if (n.includes('WINDOW')) {
                    c.material = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.35, metalness: 0.0 });
                } else if (n.includes('WHEEL') || n.includes('WHEELS')) {
                    const orig = c.material;
                    if (orig && orig.map) {
                        orig.roughness = 0.35;
                        orig.metalness = 0.9;
                        orig.transparent = false;
                        orig.side = THREE.FrontSide;
                        orig.needsUpdate = true;
                        c.material = orig;
                    } else {
                        c.material = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.35, metalness: 0.9 });
                    }
                } else if (n.includes('BODY') || n.includes('HOOD') || n.includes('DOOR')) {
                    const orig = c.material;
                    if (orig && orig.map) {
                        const mat = new THREE.MeshPhysicalMaterial({ map: orig.map, color: new THREE.Color(0xffffff), roughness: 0.14, metalness: 0.6, clearcoat: 0.9, clearcoatRoughness: 0.03 });
                        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace || mat.map.colorSpace;
                        mat.needsUpdate = true;
                        c.material = mat;
                    } else {
                        c.material = new THREE.MeshPhysicalMaterial({ color: paintHex, roughness: 0.14, metalness: 0.6, clearcoat: 0.9, clearcoatRoughness: 0.03 });
                    }
                } else {
                    // generic fallback
                    const om = c.material;
                    if (om && om.map) om.map.colorSpace = THREE.SRGBColorSpace || om.map.colorSpace;
                    if (!om || om.isMaterial === false) c.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
                }
            });

            // If the GLB only contains wheels for one side, mirror them to the other side.
            // WHEELS merges the front and rear wheels of one side into a single
            // indexed geometry — split the front tire out (triangle centroids
            // past z > -0.2) so it can be removed independently.
            const frontWheelMeshes = { right: null, left: null };
            try {
                const wheels = exterior.getObjectByName('WHEELS');
                // Mirrored wheels must reflect across the body's centerline —
                // some source models are off-center, so mirroring about x = 0
                // leaves the copies floating away from the car.
                let wheelMirrorAxisX = 0;
                const mirrorAxisRef = exterior.getObjectByName('BODY');
                if (mirrorAxisRef) {
                    exterior.updateMatrixWorld(true);
                    // wheels.position is in exterior-local space, so the mirror
                    // axis must be too — convert the world-space body center
                    // back through the car transform (it is already rotated).
                    const axisWorld = new THREE.Box3().setFromObject(mirrorAxisRef).getCenter(new THREE.Vector3());
                    wheelMirrorAxisX = exterior.worldToLocal(axisWorld).x;
                }
                let frontWheelGeom = null;
                if (wheels && wheels.geometry) {
                    const g = wheels.geometry;
                    const pos = g.attributes.position;
                    const idx = g.index ? g.index.array : null;
                    const triCount = idx ? idx.length / 3 : pos.count / 3;
                    const frontIdx = [];
                    const rearIdx = [];
                    for (let t = 0; t < triCount; t++) {
                        const a = idx ? idx[t * 3] : t * 3;
                        const b = idx ? idx[t * 3 + 1] : t * 3 + 1;
                        const c = idx ? idx[t * 3 + 2] : t * 3 + 2;
                        const cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
                        (cz > -0.2 ? frontIdx : rearIdx).push(a, b, c);
                    }
                    if (frontIdx.length && rearIdx.length) {
                        frontWheelGeom = g.clone();
                        frontWheelGeom.setIndex(frontIdx);
                        const rearGeom = g.clone();
                        rearGeom.setIndex(rearIdx);
                        wheels.geometry = rearGeom;
                    }
                }
                if (wheels && !exterior.getObjectByName('WHEELS_MIRROR')) {
                    const geom = wheels.geometry && wheels.geometry.clone ? wheels.geometry.clone() : null;
                    if (geom) {
                        const mat = wheels.material && wheels.material.clone ? wheels.material.clone() : new THREE.MeshStandardMaterial({ color: 0x666666 });
                        // mirror geometry across X axis
                        const m = new THREE.Matrix4().makeScale(-1, 1, 1);
                        geom.applyMatrix4(m);
                        geom.computeVertexNormals();
                        const mirror = new THREE.Mesh(geom, mat);
                        mirror.name = 'WHEELS_MIRROR';
                        // position mirror: reflect X across the body centerline
                        mirror.position.copy(wheels.position);
                        mirror.position.x = 2 * wheelMirrorAxisX - wheels.position.x;
                        mirror.quaternion.copy(wheels.quaternion);
                        mirror.scale.copy(wheels.scale);
                        if (mirror.material) mirror.material.side = THREE.DoubleSide;
                        mirror.castShadow = true;
                        mirror.receiveShadow = true;
                        exterior.add(mirror);
                        window.__mirrorAdded = true;
                        console.log('Added mirrored wheels as WHEELS_MIRROR');
                    }
                }

                // Separate mesh per front tire so each can be removed on its own
                if (frontWheelGeom) {
                    const mkFrontWheel = (geom, name, mirrored) => {
                        const mat = wheels.material && wheels.material.clone ? wheels.material.clone() : new THREE.MeshStandardMaterial({ color: 0x666666 });
                        const m = new THREE.Mesh(geom, mat);
                        m.name = name;
                        m.position.copy(wheels.position);
                        if (mirrored) m.position.x = 2 * wheelMirrorAxisX - wheels.position.x;
                        m.quaternion.copy(wheels.quaternion);
                        m.scale.copy(wheels.scale);
                        if (mirrored && m.material) m.material.side = THREE.DoubleSide;
                        m.userData.isFrontWheel = true;
                        m.userData.wheelSide = mirrored ? 'left' : 'right';
                        exterior.add(m);
                        return m;
                    };
                    frontWheelMeshes.right = mkFrontWheel(frontWheelGeom, 'WHEEL_FRONT', false);
                    const mirrorFrontGeom = frontWheelGeom.clone();
                    mirrorFrontGeom.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
                    mirrorFrontGeom.computeVertexNormals();
                    frontWheelMeshes.left = mkFrontWheel(mirrorFrontGeom, 'WHEEL_FRONT_MIRROR', true);
                }

                // Brake assembly mounted behind the front-right tire — restyle it
                // flat white (disc/pads) and red (caliper), and keep refs so an
                // emissive lift can reveal it once the tire is off. The assembly
                // is located by its dot-free group names since GLTFLoader strips
                // dots from node names.
                const brakeMeshes = [];
                const brakeGroupColors = { 'Brake_Caliper_2': 0xd22f2f, 'Brake_Disc_1': 0xf2f2f2, 'Brake_Pads_0': 0xf2f2f2 };
                ['Brake_Caliper_2', 'Brake_Disc_1', 'Brake_Pads_0'].forEach((n) => {
                    const grp = exterior.getObjectByName(n);
                    if (!grp) return;
                    grp.traverse((c) => {
                        if (!c.isMesh || !c.material) return;
                        c.material = c.material.clone();
                        c.material.map = null;
                        if (c.material.color) c.material.color.setHex(brakeGroupColors[n]);
                        c.material.needsUpdate = true;
                        brakeMeshes.push(c);
                    });
                });
                if (!brakeMeshes.length) console.warn('Brake assembly meshes not found for removal highlight');

                // Align the disc meshes concentrically — the drilled rotor is the
                // reference; the disc face/hub parts sit slightly off-axis.
                const discGrp = exterior.getObjectByName('Brake_Disc_1');
                if (discGrp) {
                    const discMeshes = [];
                    discGrp.traverse((c) => { if (c.isMesh) discMeshes.push(c); });
                    const refMesh = discGrp.getObjectByName('diss_brake') || discMeshes[0];
                    if (refMesh && discMeshes.length > 1) {
                        // update the full exterior subtree first so bounding boxes
                        // and worldToLocal agree on one matrix space
                        exterior.updateMatrixWorld(true);
                        const refC = new THREE.Box3().setFromObject(refMesh).getCenter(new THREE.Vector3());
                        discMeshes.forEach((m) => {
                            if (m === refMesh) return;
                            const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
                            m.position.add(m.parent.worldToLocal(refC.clone()).sub(m.parent.worldToLocal(c)));
                        });
                    }

                    // Seat the caliper and pads on the rotor's rim edge at hub
                    // height so they wrap the disc like a real assembly.
                    const dbox = new THREE.Box3().setFromObject(discGrp);
                    const dc = dbox.getCenter(new THREE.Vector3());
                    [exterior.getObjectByName('Brake_Caliper_2'), exterior.getObjectByName('Brake_Pads_0')].forEach((grp) => {
                        if (!grp) return;
                        const gc = new THREE.Box3().setFromObject(grp).getCenter(new THREE.Vector3());
                        const edgeZ = gc.z > dc.z ? dbox.max.z : dbox.min.z;
                        const target = new THREE.Vector3(gc.x, dc.y, edgeZ);
                        const lin = grp.parent.matrixWorld.clone().setPosition(0, 0, 0).invert();
                        grp.position.add(target.sub(gc).applyMatrix4(lin));
                    });
                }

                // Front tire removal API — hiding the tire reveals the brake
                // disc/caliper assembly mounted behind it.
                window.setFrontWheelRemoved = function (side, removed) {
                    const mesh = frontWheelMeshes[side || 'right'];
                    if (!mesh) return false;
                    mesh.visible = !removed;
                    if (!side || side === 'right') {
                        brakeMeshes.forEach((m) => {
                            if (m.material && m.material.emissive) {
                                m.material.emissive.setHex(removed ? 0x4a4a4a : 0x000000);
                            }
                        });
                    }
                    requestRender();
                    return true;
                };
                window.isFrontWheelRemoved = function (side) {
                    const mesh = frontWheelMeshes[side || 'right'];
                    return mesh ? !mesh.visible : false;
                };
                window.getFrontWheelMesh = function (side) {
                    return frontWheelMeshes[side || 'right'];
                };
                window.getBrakePadMesh = function () {
                    return exterior.getObjectByName('brake_pad') || null;
                };
                // Returns a brake assembly group ('caliper' | 'pads' | 'disc')
                // for previews of removed parts.
                window.getBrakePartMesh = function (part) {
                    const grpName = part === 'caliper' ? 'Brake_Caliper_2' : part === 'pads' ? 'Brake_Pads_0' : part === 'disc' ? 'Brake_Disc_1' : null;
                    return grpName ? (exterior.getObjectByName(grpName) || null) : null;
                };
                // Hide/show brake assembly groups (used by the brake practice
                // flow when the caliper or pads are "removed" during the sim).
                window.setBrakeAssemblyPartRemoved = function (part, removed) {
                    const grpName = part === 'caliper' ? 'Brake_Caliper_2' : part === 'pads' ? 'Brake_Pads_0' : null;
                    const grp = grpName && exterior.getObjectByName(grpName);
                    if (!grp) return false;
                    grp.visible = !removed;
                    requestRender();
                    return true;
                };
                // Clicking a brake assembly part fires 'brakePartClicked' with the
                // group it belongs to (caliper / disc / pads).
                const brakePartGroups = { 'Brake_Caliper_2': 'caliper', 'Brake_Disc_1': 'disc', 'Brake_Pads_0': 'pads' };
                let bpDown = null;
                renderer.domElement.addEventListener('pointerdown', (e) => { bpDown = { x: e.clientX, y: e.clientY }; }, false);
                renderer.domElement.addEventListener('click', (e) => {
                    if (bpDown && Math.hypot(e.clientX - bpDown.x, e.clientY - bpDown.y) > 8) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects(exterior.children, true);
                    for (let inter of intersects) {
                        if (!inter.object.visible) continue;
                        let obj = inter.object;
                        while (obj && !brakePartGroups[obj.name]) obj = obj.parent;
                        if (obj && brakePartGroups[obj.name]) {
                            window.dispatchEvent(new CustomEvent('brakePartClicked', { detail: { x: e.clientX, y: e.clientY, part: brakePartGroups[obj.name] } }));
                            break;
                        }
                    }
                }, false);
            } catch (e) { console.warn('wheel mirror failed', e); }

            // frame and show exterior as the target
            frameModel(exterior);

            // --- Jack stand placement (shown when the tool is used in Step 1) ---
            window.placeJackStand = function () {
                if (window.__jackStandObject) {
                    window.__jackStandObject.visible = true;
                    requestRender();
                    return true;
                }
                const standLoader = new GLTFLoader();
                standLoader.load('models/car_jack_stand.glb', (jg) => {
                    const stand = jg.scene;
                    stand.name = 'JackStand';

                    exterior.updateMatrixWorld(true);
                    const ebox = new THREE.Box3().setFromObject(exterior);
                    const esize = ebox.getSize(new THREE.Vector3());
                    const ecenter = ebox.getCenter(new THREE.Vector3());

                    const sbox = new THREE.Box3().setFromObject(stand);
                    const ssize = sbox.getSize(new THREE.Vector3());
                    const scenter = sbox.getCenter(new THREE.Vector3());

                    // scale the stand so its height reaches about the underbody (~22% of car height)
                    if (ssize.y > 0) stand.scale.setScalar((esize.y * 0.22) / ssize.y);
                    const k = stand.scale.x;

                    // place it on the ground, centered under the front of the car
                    stand.position.set(
                        ecenter.x - scenter.x * k,
                        ebox.min.y - sbox.min.y * k,
                        (ecenter.z + esize.z * 0.25) - scenter.z * k
                    );

                    scene.add(stand);
                    stand.updateMatrixWorld(true);
                    // attach to the car group so it follows if the car moves/rotates
                    exterior.attach(stand);
                    window.__jackStandObject = stand;
                    requestRender();
                }, undefined, (err) => console.error('Failed to load jack stand model:', err));
                return true;
            };

            // --- HOOD INTERACTION ---
            try {
                const hoodMeshes = [];
                exterior.traverse((c) => {
                    if (!c.isMesh) return;
                    const n = (c.name || '').toUpperCase();
                    if (n.includes('HOOD') || n.includes('BONNET') || n.includes('FRUNK') || n.includes('HOOD_TOP')) hoodMeshes.push(c);
                });

                // fallback: pick the largest front-most mesh by Z center
                if (hoodMeshes.length === 0) {
                    let best = null;
                    let bestScore = 0;
                    exterior.traverse((c) => {
                        if (!c.isMesh) return;
                        const box = new THREE.Box3().setFromObject(c);
                        const size = box.getSize(new THREE.Vector3());
                        const center = box.getCenter(new THREE.Vector3());
                        // prefer wide flat pieces near the front (higher center.z)
                        const score = (center.z + Math.abs(center.z)) * (size.x * size.z);
                        if (score > bestScore) { bestScore = score; best = c; }
                    });
                    if (best) hoodMeshes.push(best);
                }

                hoodPivots = [];
                hoodMeshes.forEach((hood) => {
                    const bbox = new THREE.Box3().setFromObject(hood);
                    const size = bbox.getSize(new THREE.Vector3());
                    const center = bbox.getCenter(new THREE.Vector3());

                    // hinge: place near the rear edge (towards cabin/windshield)
                    const hingeWorld = center.clone();
                    hingeWorld.y = bbox.max.y;
                    hingeWorld.z = bbox.min.z + size.z * 0.02;

                    const pivot = new THREE.Group();
                    pivot.name = (hood.name || 'hood') + '_pivot';

                    // convert hinge to exterior local and attach
                    const hingeLocal = hingeWorld.clone();
                    exterior.worldToLocal(hingeLocal);
                    pivot.position.copy(hingeLocal);
                    exterior.add(pivot);

                    // attach hood to pivot preserving world transform
                    pivot.attach(hood);

                    // store base hinge position for tuning
                    pivot.userData.hingeBase = pivot.position.clone();

                    // (hinge helper removed)

                    hood.userData.isHood = true;
                    hood.userData.hoodPivot = pivot;
                    hoodPivots.push(pivot);
                });

                hoodState = hoodPivots.map(() => ({ open: false, target: 0 }));

                // --- Door detection and pivot creation ---
                try {
                    const doorMeshes = [];
                    // compute car center to classify front vs rear doors
                    const carBox = new THREE.Box3().setFromObject(exterior);
                    const carCenter = carBox.getCenter(new THREE.Vector3());
                    exterior.traverse((c) => {
                        if (!c.isMesh) return;
                        const n = (c.name || '').toUpperCase();
                        if (n.includes('DOOR') && !n.includes('DASH') && !n.includes('INTERIOR')) doorMeshes.push(c);
                    });
                    doorPivots = [];
                    doorState = [];
                    const sortedDoors = doorMeshes
                        .map((door) => {
                            const bbox = new THREE.Box3().setFromObject(door);
                            const center = bbox.getCenter(new THREE.Vector3());
                            const size = bbox.getSize(new THREE.Vector3());
                            return {
                                door,
                                bbox,
                                center,
                                size,
                                isRightSide: center.x > carCenter.x
                            };
                        })
                        .sort((a, b) => (a.isRightSide === b.isRightSide ? 0 : a.isRightSide ? -1 : 1));
                    const leftDoorRef = sortedDoors.find((d) => !d.isRightSide);
                    const twoDoorFrontHintFromLeft = leftDoorRef ? (leftDoorRef.center.z < carCenter.z) : null;
                    sortedDoors.forEach(({ door, bbox, center, size, isRightSide }) => {
                        try {
                            // hinge at inner edge (near vehicle center) for X,
                            // but Z depends on whether this is a front or rear door
                            const hingeWorld = center.clone();
                            hingeWorld.y = center.y;
                            if (isRightSide) {
                                // right side door - hinge on mirror side (next to front hood right edge)
                                hingeWorld.x = bbox.max.x - size.x * 0.02;
                            } else {
                                // left side door - hinge at max.x
                                hingeWorld.x = bbox.max.x - size.x * 0.02;
                            }
                            // keep left-door behavior as-is; for right door in 2-door layout,
                            // use the same front-edge hint as the already-correct left door.
                            const isFront = isRightSide && sortedDoors.length <= 2 && twoDoorFrontHintFromLeft !== null
                                ? twoDoorFrontHintFromLeft
                                : (center.z < carCenter.z);
                            if (isFront) {
                                // hinge toward the front edge of the door
                                hingeWorld.z = isRightSide ? (bbox.min.z + size.z * 0.005) : (bbox.min.z + size.z * 0.02);
                            } else {
                                // hinge toward the rear edge of the door
                                hingeWorld.z = bbox.max.z - size.z * 0.02;
                            }

                            const pivot = new THREE.Group();
                            exterior.worldToLocal(hingeWorld);
                            pivot.position.copy(hingeWorld);
                            exterior.add(pivot);
                            pivot.attach(door);
                            pivot.userData.doorBase = pivot.position.clone();

                            // keep left door unchanged; only mirror right-door swing direction
                            const openAngle = Math.PI * 0.65;
                            const openSign = isRightSide ? -1 : 1;

                            door.userData.isDoor = true;
                            door.userData.doorPivot = pivot;
                            door.userData.doorSide = isRightSide ? 'right' : 'left';
                            doorPivots.push(pivot);
                            doorState.push({ open: false, target: 0, openAngle, openSign });
                        } catch (e) { console.warn('door pivot failed', e); }
                    });

                    // expose door toggle API
                    window.toggleDoor = function (index = 0) {
                        if (!doorPivots || !doorPivots.length) {
                            console.warn('toggleDoor: door pivots not ready');
                            return null;
                        }
                        const idx = Math.min(Math.max(0, index), doorPivots.length - 1);
                        doorState[idx].open = !doorState[idx].open;
                        doorState[idx].target = doorState[idx].open ? (doorState[idx].openAngle * (doorState[idx].openSign || 1)) : 0;
                        requestRender();
                        return doorState[idx].open;
                    };
                } catch (e) { console.warn('door setup failed', e); }

                // --- Battery Terminal Cap detection and interaction ---
                try {
                    const batteryCapMeshes = [];
                    const allMeshNames = [];

                    // First find all meshes and log names for debugging
                    let batteryMesh = null;
                    let batteryMeshes = [];
                    exterior.traverse((c) => {
                        if (!c.isMesh) return;
                        const n = (c.name || '').toUpperCase();
                        allMeshNames.push(c.name || '(unnamed)');

                        // Find battery meshes
                        if (n.includes('BATTERY') || n.includes('BATT')) {
                            batteryMeshes.push(c);
                            if (!n.includes('CAP') && !n.includes('CASE')) {
                                batteryMesh = c;
                            }
                        }
                    });

                    console.log('All mesh names:', allMeshNames);
                    console.log('Found battery meshes:', batteryMeshes.length);

                    // Find terminal caps - try multiple detection methods
                    exterior.traverse((c) => {
                        if (!c.isMesh) return;
                        const n = (c.name || '').toUpperCase();

                        // Method 1: Name patterns — only battery terminal caps
                        // (Oil_cap / Ragiator_cap are unrelated service caps)
                        const isUnrelatedCap = /OIL|RAGIATOR|RADIATOR|FUEL|BRAKE|WASHER|COOLANT|RESERVOIR/.test(n);
                        const isCapByName = !isUnrelatedCap && (n.includes('CAP') || n.includes('TERMINAL') ||
                            (n.includes('POS') && n.length < 10) ||
                            (n.includes('NEG') && n.length < 10) ||
                            n.includes('PLUS') || n.includes('MINUS'));

                        // Method 2: Small objects on TOP of battery (not just near it)
                        let isCapByPosition = false;
                        if (batteryMeshes.length > 0) {
                            const capBox = new THREE.Box3().setFromObject(c);
                            const capCenter = capBox.getCenter(new THREE.Vector3());
                            const capSize = capBox.getSize(new THREE.Vector3());

                            // Check if on top of any battery
                            for (const batt of batteryMeshes) {
                                const battBox = new THREE.Box3().setFromObject(batt);
                                const battCenter = battBox.getCenter(new THREE.Vector3());
                                const battSize = battBox.getSize(new THREE.Vector3());

                                // Must be: small, above battery top, within battery X/Z bounds
                                const isSmall = capSize.y < battSize.y * 0.4 &&
                                    Math.max(capSize.x, capSize.z) < battSize.x * 0.4;
                                const isAbove = capCenter.y > battBox.max.y - battSize.y * 0.2;
                                const isWithinXZ = Math.abs(capCenter.x - battCenter.x) < battSize.x * 0.5 &&
                                    Math.abs(capCenter.z - battCenter.z) < battSize.z * 0.6;

                                if (isSmall && isAbove && isWithinXZ) {
                                    isCapByPosition = true;
                                    console.log('Found cap by position:', c.name, 'at', capCenter);
                                    break;
                                }
                            }
                        }

                        // Method 3: Color-based detection (red or black/dark materials)
                        let isCapByColor = false;
                        if (c.material) {
                            const mat = c.material;
                            const color = mat.color || new THREE.Color();
                            // Check if red-ish or very dark
                            const isRed = color.r > 0.5 && color.g < 0.3 && color.b < 0.3;
                            const isBlack = color.r < 0.2 && color.g < 0.2 && color.b < 0.2;
                            if ((isRed || isBlack) && (isCapByName || isCapByPosition)) {
                                isCapByColor = true;
                            }
                        }

                        if (isCapByName || isCapByPosition) {
                            batteryCapMeshes.push(c);
                            console.log('Added cap:', c.name, 'methods:', { name: isCapByName, pos: isCapByPosition });
                        }
                    });

                    console.log('Total caps found:', batteryCapMeshes.length);

                    batteryCapPivots = [];
                    batteryCapState = [];

                    batteryCapMeshes.forEach((cap, index) => {
                        try {
                            const bbox = new THREE.Box3().setFromObject(cap);
                            const center = bbox.getCenter(new THREE.Vector3());

                            // Determine if this is positive or negative by name, color, or position
                            const name = (cap.name || '').toUpperCase();

                            // Check material color for red (positive) or black (negative)
                            let isRed = false, isBlack = false;
                            if (cap.material) {
                                const mat = cap.material;
                                const color = mat.color || new THREE.Color();
                                isRed = color.r > 0.5 && color.g < 0.3 && color.b < 0.3;
                                isBlack = color.r < 0.2 && color.g < 0.2 && color.b < 0.2;
                            }

                            const isPositive = name.includes('POS') || name.includes('PLUS') ||
                                name.includes('RED') || isRed ||
                                (center.x > 0 && !isBlack); // use position if no color hint
                            const capType = isPositive ? 'positive' : 'negative';
                            const displayName = isPositive ? 'Positive (+) Cap' : 'Negative (-) Cap';

                            console.log(`Cap ${index}: ${cap.name} -> ${capType} (red:${isRed}, black:${isBlack})`);

                            // Create pivot at the cap base
                            const pivot = new THREE.Group();
                            const hingeWorld = center.clone();
                            hingeWorld.y = bbox.min.y; // hinge at bottom
                            exterior.worldToLocal(hingeWorld);
                            pivot.position.copy(hingeWorld);
                            exterior.add(pivot);
                            pivot.attach(cap);

                            pivot.userData.baseY = pivot.position.y;
                            pivot.userData.baseRot = pivot.rotation.clone();

                            cap.userData.isBatteryCap = true;
                            cap.userData.capIndex = index;
                            cap.userData.capType = capType;
                            cap.userData.capPivot = pivot;
                            cap.userData.displayName = displayName;

                            // Store materials for opacity animation
                            const capMaterials = [];
                            cap.traverse((child) => {
                                if (child.isMesh && child.material) {
                                    child.material = child.material.clone();
                                    child.material.transparent = true;
                                    capMaterials.push(child.material);
                                }
                            });
                            pivot.userData.materials = capMaterials;
                            pivot.userData.opacity = 1;

                            batteryCapPivots.push(pivot);
                            batteryCapState.push({
                                removed: false,
                                target: 0,
                                capType: capType,
                                capName: displayName
                            });
                        } catch (e) { console.warn('battery cap pivot failed', e); }
                    });

                    // Identical black caps can't be told apart by name or
                    // color, so every cap lands on the same type. Assign
                    // connector/coil by position instead — the leftmost cap is
                    // the connector (negative), the rest are coils (positive).
                    if (batteryCapState.length > 1 &&
                        batteryCapState.every(s => s.capType === batteryCapState[0].capType)) {
                        const order = batteryCapMeshes
                            .map((c, i) => ({ i, x: (c.userData.capPivot ? c.userData.capPivot.position.x : 0) }))
                            .sort((a, b) => a.x - b.x);
                        order.forEach((o, k) => {
                            const t = k === 0 ? 'negative' : 'positive';
                            batteryCapState[o.i].capType = t;
                            batteryCapState[o.i].capName = t === 'positive' ? 'Positive (+) Cap' : 'Negative (-) Cap';
                            batteryCapMeshes[o.i].userData.capType = t;
                            batteryCapMeshes[o.i].userData.displayName = batteryCapState[o.i].capName;
                        });
                    }

                    if (batteryCapMeshes.length > 0) {
                        console.log(`Found ${batteryCapMeshes.length} battery terminal cap(s):`, batteryCapMeshes.map(c => ({ name: c.name, type: c.userData.capType })));
                    }

                    // API functions
                    window.toggleBatteryCap = function (index = 0) {
                        if (!batteryCapPivots || !batteryCapPivots.length) return null;
                        if (index < 0 || index >= batteryCapPivots.length) return null;
                        const state = batteryCapState[index];
                        state.removed = !state.removed;
                        state.target = state.removed ? 1 : 0;
                        requestRender();
                        return { index, removed: state.removed, name: state.capName, type: state.capType };
                    };

                    window.checkBatteryCap = function (index = 0) {
                        if (!batteryCapState || !batteryCapState[index]) return null;
                        const state = batteryCapState[index];
                        return { index, removed: state.removed, name: state.capName, type: state.capType };
                    };

                    window.onBatteryCapClicked = function (capInfo) {
                        console.log('Battery terminal cap clicked:', capInfo);
                        // Don't toggle immediately - just dispatch event for UI to handle
                        window.dispatchEvent(new CustomEvent('batteryCapClicked', { detail: capInfo }));
                        return capInfo;
                    };

                    // Create tooltip element for hover effect
                    function createCapTooltip() {
                        if (capTooltipElement) return;
                        capTooltipElement = document.createElement('div');
                        capTooltipElement.id = 'cap-tooltip';
                        capTooltipElement.style.cssText = `
                            position: fixed;
                            pointer-events: none;
                            background: rgba(37, 99, 235, 0.95);
                            color: white;
                            padding: 8px 14px;
                            border-radius: 8px;
                            font-family: 'Nunito', sans-serif;
                            font-size: 0.75rem;
                            font-weight: 700;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            z-index: 10000;
                            display: none;
                            white-space: nowrap;
                            transform: translate(-50%, -120%);
                            transition: opacity 0.2s;
                        `;
                        capTooltipElement.innerHTML = `
                            <div style="display:flex;align-items:center;gap:6px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span>Click for options</span>
                            </div>
                            <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid rgba(37, 99, 235, 0.95);"></div>
                        `;
                        document.body.appendChild(capTooltipElement);
                    }
                    createCapTooltip();

                    // Function to update tooltip position
                    function updateCapTooltip(screenX, screenY, capInfo) {
                        if (!capTooltipElement) return;
                        if (capInfo) {
                            capTooltipElement.style.display = 'block';
                            capTooltipElement.style.left = screenX + 'px';
                            capTooltipElement.style.top = screenY + 'px';
                            // Change color based on cap type
                            const isPositive = capInfo.type === 'positive';
                            capTooltipElement.style.background = isPositive ? 'rgba(220, 38, 38, 0.95)' : 'rgba(55, 65, 81, 0.95)';
                            capTooltipElement.querySelector('div:last-child').style.borderTopColor = isPositive ? 'rgba(220, 38, 38, 0.95)' : 'rgba(55, 65, 81, 0.95)';
                        } else {
                            capTooltipElement.style.display = 'none';
                        }
                    }

                } catch (e) { console.warn('battery cap setup failed', e); }

                // --- Battery (main body) interaction ---
                try {
                    let batteryMainMesh = null;
                    let batteryCandidates = [];

                    // Debug: log all mesh names first
                    console.log('--- All meshes in scene ---');
                    exterior.traverse((c) => {
                        if (c.isMesh) {
                            const bbox = new THREE.Box3().setFromObject(c);
                            const center = bbox.getCenter(new THREE.Vector3());
                            const size = bbox.getSize(new THREE.Vector3());
                            console.log(`Mesh: "${c.name}" pos:(${center.x.toFixed(2)},${center.y.toFixed(2)},${center.z.toFixed(2)}) size:(${size.x.toFixed(2)},${size.y.toFixed(2)},${size.z.toFixed(2)})`);
                        }
                    });
                    console.log('--- End mesh list ---');

                    // Find the main battery mesh (not caps, not terminals)
                    exterior.traverse((c) => {
                        if (!c.isMesh) return;

                        // Skip meshes already marked as battery caps
                        if (c.userData.isBatteryCap) {
                            console.log('Skipping cap mesh:', c.name);
                            return;
                        }

                        const n = (c.name || '').toUpperCase();

                        // Skip caps and terminals by name
                        if (n.includes('CAP') || n.includes('TERMINAL') ||
                            n.includes('POS') || n.includes('NEG') || n.includes('LID') ||
                            n.includes('BATTERY001') || n.includes('BATTERY002')) return;

                        // Name-based detection - look for battery in name (but not BATTERY001/002 which are caps)
                        const isBatteryByName = (n.includes('BATTERY') && !n.match(/BATTERY00\d/)) ||
                            n.includes('BATT_') || n.includes('BATTERY_CASE') ||
                            n.includes('POWERCELL') || n.includes('CELL') ||
                            n.includes('CASE') || n.includes('BOX');

                        // Size-based detection - car battery dimensions
                        const bbox = new THREE.Box3().setFromObject(c);
                        const size = bbox.getSize(new THREE.Vector3());
                        const center = bbox.getCenter(new THREE.Vector3());

                        // Typical car battery: ~0.2-0.3m x 0.15-0.2m x 0.15-0.25m
                        const isBatteryBySize = size.x > 0.15 && size.y > 0.12 && size.z > 0.10 &&
                            size.x < 0.4 && size.y < 0.35 && size.z < 0.3;

                        // Position: in engine bay, typically front area (positive Z or negative Z depending on model)
                        // and at reasonable height
                        const isEngineBayPosition = center.y > 0.3 && center.y < 1.2;

                        // Higher score for objects named battery
                        let score = 0;
                        if (isBatteryByName) score += 20;
                        if (isBatteryBySize) score += 10;
                        if (isEngineBayPosition) score += 5;

                        // Check if it has the yellow label material (common in car batteries)
                        let hasLabelTexture = false;
                        if (c.material && c.material.name) {
                            const matName = c.material.name.toUpperCase();
                            if (matName.includes('LABEL') || matName.includes('STICKER') ||
                                matName.includes('DECAL') || matName.includes('TEXT')) {
                                hasLabelTexture = true;
                                score += 5;
                            }
                        }

                        // Also check for multiple materials (battery often has casing + label)
                        if (Array.isArray(c.material) && c.material.length > 1) {
                            score += 3;
                        }

                        if (score > 10) {
                            batteryCandidates.push({
                                mesh: c,
                                score: score,
                                size: size,
                                center: center
                            });
                        }
                    });

                    // Pick highest scoring candidate
                    if (batteryCandidates.length > 0) {
                        batteryCandidates.sort((a, b) => b.score - b.score);
                        batteryMainMesh = batteryCandidates[0].mesh;
                        console.log('Battery candidates found:', batteryCandidates.map(c => ({
                            name: c.mesh.name,
                            score: c.score,
                            size: `(${c.size.x.toFixed(2)},${c.size.y.toFixed(2)},${c.size.z.toFixed(2)})`,
                            pos: `(${c.center.x.toFixed(2)},${c.center.y.toFixed(2)},${c.center.z.toFixed(2)})`
                        })));
                    } else {
                        console.warn('No battery candidates found - check mesh names and scene structure');
                    }

                    if (batteryMainMesh) {
                        console.log('Found main battery mesh:', batteryMainMesh.name);

                        // Mark as battery for interaction
                        batteryMainMesh.userData.isBattery = true;
                        batteryMainMesh.userData.batteryRemoved = false;

                        // Also mark all children for raycasting
                        batteryMainMesh.traverse((child) => {
                            if (child.isMesh) {
                                child.userData.isBattery = true;
                                console.log('Marked battery child:', child.name);
                            }
                        });

                        // Create pivot for animation
                        const batteryPivot = new THREE.Group();
                        const battBox = new THREE.Box3().setFromObject(batteryMainMesh);
                        const battCenter = battBox.getCenter(new THREE.Vector3());
                        const battSize = battBox.getSize(new THREE.Vector3());

                        // Pivot at bottom center of battery
                        const pivotWorld = battCenter.clone();
                        pivotWorld.y = battBox.min.y;
                        exterior.worldToLocal(pivotWorld);
                        batteryPivot.position.copy(pivotWorld);
                        exterior.add(batteryPivot);
                        batteryPivot.attach(batteryMainMesh);

                        batteryPivot.userData.baseY = batteryPivot.position.y;
                        batteryPivot.userData.basePos = {
                            x: batteryPivot.position.x,
                            y: batteryPivot.position.y,
                            z: batteryPivot.position.z
                        };
                        batteryPivot.userData.baseRot = batteryPivot.rotation.clone();

                        // Store reference
                        window.batteryPivot = batteryPivot;
                        window.batteryMesh = batteryMainMesh;

                        // API functions
                        window.checkBattery = function () {
                            return {
                                removed: batteryMainMesh.userData.batteryRemoved,
                                name: batteryMainMesh.name || 'Battery'
                            };
                        };

                        window.toggleBattery = function () {
                            const state = batteryMainMesh.userData;
                            state.batteryRemoved = !state.batteryRemoved;

                            console.log('toggleBattery called, new removed state:', state.batteryRemoved);

                            // Sims that reuse the battery purely as a state flag
                            // (the spark-plug sim uses it to track the lifted-out
                            // plug) suppress the lift-out animation so the real
                            // battery stays seated and visible.
                            if (window.__suppressBatteryVisual) {
                                requestRender();
                                return {
                                    removed: state.batteryRemoved,
                                    name: batteryMainMesh.name || 'Battery'
                                };
                            }

                            // Ensure visibility when installing (not removed)
                            if (!state.batteryRemoved) {
                                console.log('Ensuring battery visibility');
                                batteryPivot.visible = true;
                                batteryMainMesh.visible = true;
                                batteryPivot.traverse((child) => {
                                    if (child.isMesh) {
                                        child.visible = true;
                                        if (child.material) child.material.visible = true;
                                    }
                                });
                            }

                            // Animate: lift up and rotate when removed
                            const targetY = state.batteryRemoved ? 0.5 : 0; // Lift 0.5 units
                            const targetRot = state.batteryRemoved ? Math.PI * 0.15 : 0; // Slight tilt

                            // Store targets for animation loop
                            batteryPivot.userData.targetY = batteryPivot.userData.baseY + targetY;
                            batteryPivot.userData.targetRot = targetRot;
                            batteryPivot.userData.animate = true;
                            requestRender();

                            return {
                                removed: state.batteryRemoved,
                                name: batteryMainMesh.name || 'Battery'
                            };
                        };

                        // Install battery at original position (for click-to-install from tools)
                        window.installBattery = function () {
                            const state = batteryMainMesh.userData;

                            console.log('installBattery called, current removed state:', state.batteryRemoved);

                            // Set as not removed
                            state.batteryRemoved = false;

                            // Same opt-out as toggleBattery — state only.
                            if (window.__suppressBatteryVisual) {
                                requestRender();
                                return {
                                    removed: false,
                                    name: batteryMainMesh.name || 'Battery',
                                    installed: true
                                };
                            }

                            // Get base position data
                            const baseY = batteryPivot.userData.baseY || 0;
                            const basePos = batteryPivot.userData.basePos || { x: 0, y: 0, z: 0 };
                            const baseRot = batteryPivot.userData.baseRot || { x: 0, y: 0, z: 0 };

                            // IMMEDIATELY set to ORIGINAL position (engine bay position)
                            batteryPivot.position.set(basePos.x, baseY, basePos.z);
                            batteryPivot.rotation.set(baseRot.x, baseRot.y, baseRot.z);

                            // Reset any animation offsets
                            batteryPivot.userData.currentY = baseY;
                            batteryPivot.userData.currentRot = 0;

                            // Ensure visibility - force pivot, mesh and ALL children visible
                            batteryPivot.visible = true;
                            batteryMainMesh.visible = true;
                            batteryPivot.traverse((child) => {
                                child.visible = true;
                                if (child.isMesh) {
                                    if (child.material) {
                                        child.material.visible = true;
                                        if (child.material.opacity !== undefined) {
                                            child.material.opacity = 1;
                                            child.material.transparent = false;
                                        }
                                    }
                                }
                            });

                            // Disable animation since we're already at target
                            batteryPivot.userData.targetY = baseY;
                            batteryPivot.userData.targetRot = 0;
                            batteryPivot.userData.animate = false;
                            requestRender();

                            console.log('Battery installed at ORIGINAL position:', batteryPivot.position);

                            return {
                                removed: false,
                                name: batteryMainMesh.name || 'Battery',
                                installed: true,
                                position: batteryPivot.position.clone()
                            };
                        };

                        window.onBatteryClicked = function (batteryInfo, screenX, screenY) {
                            console.log('Battery clicked:', batteryInfo);
                            window.dispatchEvent(new CustomEvent('batteryClicked', {
                                detail: { ...batteryInfo, screenX, screenY }
                            }));
                        };

                        console.log('Battery interaction setup complete');
                    }
                } catch (e) { console.warn('battery setup failed', e); }

                // --- Fuel filter interaction (Car_with_fuel_filter.glb) ---
                // Same remove/install pattern as the battery: a pivot at the
                // part's base lifts it out of the bracket when "removed".
                try {
                    let fuelFilterMesh = exterior.getObjectByName('fuel_filter');
                    if (!fuelFilterMesh) {
                        exterior.traverse((o) => {
                            if (!fuelFilterMesh && o.isMesh && /fuel[ _]?filter/i.test(o.name || '')) fuelFilterMesh = o;
                        });
                    }
                    if (fuelFilterMesh) {
                        fuelFilterMesh.userData.isFuelFilter = true;
                        fuelFilterMesh.userData.fuelFilterRemoved = false;
                        fuelFilterMesh.traverse((child) => {
                            if (child.isMesh) child.userData.isFuelFilter = true;
                        });

                        const fuelFilterPivot = new THREE.Group();
                        const ffBox = new THREE.Box3().setFromObject(fuelFilterMesh);
                        const ffCenter = ffBox.getCenter(new THREE.Vector3());
                        const pivotWorld = ffCenter.clone();
                        pivotWorld.y = ffBox.min.y;
                        exterior.updateMatrixWorld(true);
                        exterior.worldToLocal(pivotWorld);
                        fuelFilterPivot.position.copy(pivotWorld);
                        exterior.add(fuelFilterPivot);
                        fuelFilterPivot.attach(fuelFilterMesh);

                        fuelFilterPivot.userData.baseY = fuelFilterPivot.position.y;
                        fuelFilterPivot.userData.basePos = {
                            x: fuelFilterPivot.position.x,
                            y: fuelFilterPivot.position.y,
                            z: fuelFilterPivot.position.z
                        };
                        fuelFilterPivot.userData.baseRot = fuelFilterPivot.rotation.clone();

                        window.fuelFilterPivot = fuelFilterPivot;
                        window.fuelFilterMesh = fuelFilterMesh;

                        window.checkFuelFilter = function () {
                            return {
                                removed: fuelFilterMesh.userData.fuelFilterRemoved,
                                name: 'Fuel Filter'
                            };
                        };

                        window.toggleFuelFilter = function () {
                            const state = fuelFilterMesh.userData;
                            state.fuelFilterRemoved = !state.fuelFilterRemoved;

                            if (!state.fuelFilterRemoved) {
                                fuelFilterPivot.visible = true;
                                fuelFilterMesh.visible = true;
                                fuelFilterPivot.traverse((child) => {
                                    if (child.isMesh) {
                                        child.visible = true;
                                        if (child.material) child.material.visible = true;
                                    }
                                });
                            }

                            const targetY = state.fuelFilterRemoved ? 0.35 : 0;
                            const targetRot = state.fuelFilterRemoved ? Math.PI * 0.15 : 0;
                            fuelFilterPivot.userData.targetY = fuelFilterPivot.userData.baseY + targetY;
                            fuelFilterPivot.userData.targetRot = targetRot;
                            fuelFilterPivot.userData.animate = true;
                            requestRender();

                            return {
                                removed: state.fuelFilterRemoved,
                                name: 'Fuel Filter'
                            };
                        };

                        window.installFuelFilter = function () {
                            const state = fuelFilterMesh.userData;
                            state.fuelFilterRemoved = false;

                            const baseY = fuelFilterPivot.userData.baseY || 0;
                            const basePos = fuelFilterPivot.userData.basePos || { x: 0, y: 0, z: 0 };
                            const baseRot = fuelFilterPivot.userData.baseRot || { x: 0, y: 0, z: 0 };
                            fuelFilterPivot.position.set(basePos.x, baseY, basePos.z);
                            fuelFilterPivot.rotation.set(baseRot.x, baseRot.y, baseRot.z);
                            fuelFilterPivot.userData.currentY = baseY;
                            fuelFilterPivot.userData.currentRot = 0;

                            fuelFilterPivot.visible = true;
                            fuelFilterMesh.visible = true;
                            fuelFilterPivot.traverse((child) => {
                                child.visible = true;
                                if (child.isMesh && child.material) {
                                    child.material.visible = true;
                                    if (child.material.opacity !== undefined) {
                                        child.material.opacity = 1;
                                        child.material.transparent = false;
                                    }
                                }
                            });

                            fuelFilterPivot.userData.targetY = baseY;
                            fuelFilterPivot.userData.targetRot = 0;
                            fuelFilterPivot.userData.animate = false;
                            requestRender();

                            return {
                                removed: false,
                                name: 'Fuel Filter',
                                installed: true,
                                position: fuelFilterPivot.position.clone()
                            };
                        };

                        window.onFuelFilterClicked = function (filterInfo, screenX, screenY) {
                            window.dispatchEvent(new CustomEvent('fuelFilterClicked', {
                                detail: { ...filterInfo, screenX, screenY }
                            }));
                        };

                        console.log('Fuel filter interaction setup complete');
                    }
                } catch (e) { console.warn('fuel filter setup failed', e); }

                // expose tuning functions to allow live adjustment from UI
                window.tuneHood = function (index = 0, dy = 0, dz = 0) {
                    if (!hoodPivots || !hoodPivots.length) return false;
                    const idx = Math.min(Math.max(0, index), hoodPivots.length - 1);
                    const pivot = hoodPivots[idx];
                    if (!pivot || !pivot.userData.hingeBase) return false;
                    pivot.position.copy(pivot.userData.hingeBase).add(new THREE.Vector3(0, dy, dz));
                    return true;
                };

                window.resetHoodHinge = function (index = 0) {
                    if (!hoodPivots || !hoodPivots.length) return false;
                    const idx = Math.min(Math.max(0, index), hoodPivots.length - 1);
                    const pivot = hoodPivots[idx];
                    if (!pivot || !pivot.userData.hingeBase) return false;
                    pivot.position.copy(pivot.userData.hingeBase);
                    return true;
                };

                // expose toggle API
                window.toggleHood = function (index = 0) {
                    if (!hoodPivots || !hoodPivots.length) {
                        console.warn('toggleHood: hood pivots not ready yet');
                        return null;
                    }
                    const idx = Math.min(Math.max(0, index), hoodPivots.length - 1);
                    hoodState[idx].open = !hoodState[idx].open;
                    hoodState[idx].target = hoodState[idx].open ? -Math.PI * 0.5 * 0.62 : 0;
                    requestRender();
                    window.dispatchEvent(new CustomEvent('hoodToggled', { detail: { open: hoodState[idx].open, index: idx } }));
                    return hoodState[idx].open;
                };

                window.isHoodOpen = function (index = 0) {
                    const idx = Math.min(Math.max(0, index), hoodState.length - 1);
                    return hoodState[idx] ? !!hoodState[idx].open : false;
                };

                // pointer click handler to toggle hood by clicking the mesh
                function onPointerDown(event) {
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects(exterior.children, true);
                    for (let inter of intersects) {
                        let obj = inter.object;
                        while (obj && !obj.userData.isHood) obj = obj.parent;
                        if (obj && obj.userData.isHood) {
                            const pivot = obj.userData.hoodPivot;
                            const idx = hoodPivots.indexOf(pivot);
                            if (idx >= 0) {
                                hoodState[idx].open = !hoodState[idx].open;
                                hoodState[idx].target = hoodState[idx].open ? -Math.PI * 0.5 * 0.62 : 0;
                                requestRender();
                                window.dispatchEvent(new CustomEvent('hoodToggled', { detail: { open: hoodState[idx].open, index: idx } }));
                            }
                            break;
                        }
                    }
                }

                // extend pointer handler to toggle doors when clicked
                function onPointerDownDoors(event) {
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects(exterior.children, true);
                    for (let inter of intersects) {
                        let obj = inter.object;
                        while (obj && !obj.userData.isDoor) obj = obj.parent;
                        if (obj && obj.userData.isDoor) {
                            const pivot = obj.userData.doorPivot;
                            const idx = doorPivots.indexOf(pivot);
                            if (idx >= 0) {
                                doorState[idx].open = !doorState[idx].open;
                                doorState[idx].target = doorState[idx].open ? (doorState[idx].openAngle * (doorState[idx].openSign || 1)) : 0;
                                requestRender();
                            }
                            break;
                        }
                    }
                }

                renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
                renderer.domElement.addEventListener('pointerdown', onPointerDownDoors, false);

                // pointer move handler - shows hover card and tracks cursor
                function onPointerMoveBatteryCaps(event) {
                    if (window.__disableBatteryInteractions) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);

                    const intersects = raycaster.intersectObjects(exterior.children, true);
                    let foundCap = null;
                    let foundCapInfo = null;
                    let foundBattery = false;
                    let foundFuelFilter = false;

                    for (let inter of intersects) {
                        let obj = inter.object;

                        // Check for battery cap first
                        while (obj && !obj.userData.isBatteryCap && !obj.userData.isBattery && !obj.userData.isFuelFilter) {
                            obj = obj.parent;
                        }

                        if (obj && obj.userData.isFuelFilter) {
                            foundFuelFilter = true;
                            renderer.domElement.style.cursor = 'pointer';
                            if (window.onFuelFilterHover && typeof window.checkFuelFilter === 'function') {
                                window.onFuelFilterHover(window.checkFuelFilter(), event.clientX, event.clientY);
                            }
                            break;
                        }

                        if (obj && obj.userData.isBatteryCap) {
                            const capIndex = obj.userData.capIndex;
                            const capInfo = window.checkBatteryCap(capIndex);
                            if (capInfo) {
                                foundCap = capIndex;
                                foundCapInfo = capInfo;
                                renderer.domElement.style.cursor = 'pointer';

                                // Show hover card following mouse
                                if (window.onBatteryCapHover) {
                                    window.onBatteryCapHover(capInfo, event.clientX, event.clientY);
                                }
                            }
                            break;
                        }

                        // Check for main battery — pages can mark the body
                        // inert on steps where it isn't a service target
                        // (the spark-plug sim only uses it as the plug stand-in
                        // on the remove / inspect / install steps).
                        if (obj && obj.userData.isBattery) {
                            if (window.__batteryBodyEnabled === false) continue;
                            console.log('Battery hovered:', obj.name);
                            foundBattery = true;
                            renderer.domElement.style.cursor = 'pointer';

                            // Show battery hover card
                            if (window.onBatteryHover) {
                                const batteryInfo = window.checkBattery();
                                console.log('Calling onBatteryHover with:', batteryInfo);
                                window.onBatteryHover(batteryInfo, event.clientX, event.clientY);
                            } else {
                                console.warn('onBatteryHover not defined');
                            }
                            break;
                        }
                    }

                    if (foundCap === null && !foundBattery && !foundFuelFilter) {
                        renderer.domElement.style.cursor = 'default';
                        // pointer cursor over wheels so they read as interactive
                        const wheelRe = /WHEEL|TIRE|RIM/i;
                        for (let inter of intersects) {
                            if (!inter.object.visible) continue;
                            let obj = inter.object;
                            while (obj && !wheelRe.test(obj.name || '') && !obj.userData.isFrontWheel) obj = obj.parent;
                            if (obj && wheelRe.test(obj.name || '')) {
                                renderer.domElement.style.cursor = 'pointer';
                                break;
                            }
                        }
                        if (window.onBatteryCapHoverEnd) {
                            window.onBatteryCapHoverEnd();
                        }
                        if (window.onBatteryHoverEnd) {
                            window.onBatteryHoverEnd();
                        }
                        if (window.onFuelFilterHoverEnd) {
                            window.onFuelFilterHoverEnd();
                        }
                    }

                    hoveredCapIndex = foundCap;
                }
                renderer.domElement.addEventListener('pointermove', onPointerMoveBatteryCaps, false);

                // pointer down handler - locks card position when cap or battery is clicked
                function onPointerDownBatteryCaps(event) {
                    if (window.__disableBatteryInteractions) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);

                    const intersects = raycaster.intersectObjects(exterior.children, true);

                    for (let inter of intersects) {
                        let obj = inter.object;

                        // Check for battery cap
                        while (obj && !obj.userData.isBatteryCap && !obj.userData.isBattery && !obj.userData.isFuelFilter) {
                            obj = obj.parent;
                        }

                        if (obj && obj.userData.isFuelFilter) {
                            if (window.onFuelFilterClicked && typeof window.checkFuelFilter === 'function') {
                                window.onFuelFilterClicked(window.checkFuelFilter(), event.clientX, event.clientY);
                            }
                            break;
                        }

                        if (obj && obj.userData.isBatteryCap) {
                            const capIndex = obj.userData.capIndex;
                            const capInfo = window.checkBatteryCap(capIndex);
                            if (capInfo && window.onBatteryCapClicked) {
                                // Lock card at click position
                                window.onBatteryCapClicked(capInfo, event.clientX, event.clientY);
                            }
                            break;
                        }

                        // Check for main battery
                        if (obj && obj.userData.isBattery) {
                            if (window.__batteryBodyEnabled === false) continue;
                            if (window.onBatteryClicked) {
                                const batteryInfo = window.checkBattery();
                                window.onBatteryClicked(batteryInfo, event.clientX, event.clientY);
                            }
                            break;
                        }
                    }
                }
                renderer.domElement.addEventListener('pointerdown', onPointerDownBatteryCaps, false);

                // Spark plug cover parts — meshes whose bounding box overlaps the
                // real "Spark Plug" node physically hide it (the ignition coil sits
                // over the plug well). The inspection step enables click-to-remove
                // so the plug becomes visible.
                let plugCoverMeshes = [];
                // world matrices must be current before measuring positions
                exterior.updateMatrixWorld(true);
                let sparkPlugGroup = exterior.getObjectByName('Spark Plug') || exterior.getObjectByName('Spark_Plug');
                if (!sparkPlugGroup) {
                    exterior.traverse((o) => {
                        if (!sparkPlugGroup && o.name && /Spark[ _]?Plug/i.test(o.name)) sparkPlugGroup = o;
                    });
                }
                if (sparkPlugGroup) {
                    const plugPos = sparkPlugGroup.getWorldPosition(new THREE.Vector3());
                    const coverSkip = /^(Spark[ _]?Plug|BATTERY|HOOD|BODY|DOOR|DASHBOARD|SEATS|WHEELS|WINDOW|BACK WINDOW|Air_Intake|Engine_Cover|oil_filter|Oil_cap|Ragiator_cap|brake_pad|diss_brake|Object_)/i;
                    const coverBox = new THREE.Box3();
                    const coverSize = new THREE.Vector3();
                    exterior.traverse((obj) => {
                        if (!obj.isMesh || !obj.name || coverSkip.test(obj.name)) return;
                        coverBox.setFromObject(obj);
                        coverBox.getSize(coverSize);
                        // Shell/engine-block sized meshes aren't removable covers
                        if (Math.max(coverSize.x, coverSize.y, coverSize.z) > 0.6) return;
                        if (coverBox.containsPoint(plugPos) || coverBox.distanceToPoint(plugPos) < 0.025) {
                            plugCoverMeshes.push(obj);
                        }
                    });
                    // The ignition coil always sits over the plug — include it
                    // even when its bounds don't quite overlap the plug node.
                    const coilMesh = exterior.getObjectByName('Ignition_Coil');
                    if (coilMesh && !plugCoverMeshes.includes(coilMesh)) {
                        coilMesh.traverse((c) => { if (c.isMesh) plugCoverMeshes.push(c); });
                        if (coilMesh.isMesh === false && !plugCoverMeshes.length) plugCoverMeshes.push(coilMesh);
                    }
                    console.log('Plug cover parts:', plugCoverMeshes.map(m => m.name));
                }

                window.setPlugCoversVisible = function (visible) {
                    plugCoverMeshes.forEach((m) => { m.visible = !!visible; });
                    requestRender();
                };
                window.getPlugCoverCount = function () {
                    return plugCoverMeshes.filter(m => m.visible).length;
                };
                window.getPlugCoverTotal = function () {
                    return plugCoverMeshes.length;
                };
                window.hidePlugCoverAt = function (index) {
                    const m = plugCoverMeshes[index];
                    if (m) { m.visible = false; requestRender(); }
                };
                window.showPlugCoverAt = function (index) {
                    const m = plugCoverMeshes[index];
                    if (m) { m.visible = true; requestRender(); }
                };

                // The plug assembly ("Spark Plug.001" group + "Spark Plug" node)
                // stays rendered even after the plug is lifted out — hide it so
                // the well reads empty. On install the plug reappears, except
                // cover meshes that are still marked removed.
                let sparkPlugHiddenCovers = [];
                window.setSparkPlugVisible = function (visible) {
                    if (!visible) {
                        // Hide EVERY spark-plug-named object in the car — the
                        // seated plug, its material-part siblings and any other
                        // cylinder's plug — so nothing plug-shaped stays drawn.
                        sparkPlugHiddenCovers = [];
                        exterior.traverse((o) => {
                            if (!o.name || !/Spark[ _]?Plug/i.test(o.name)) return;
                            o.visible = false;
                            o.traverse((c) => {
                                if (!c.isMesh) return;
                                if (plugCoverMeshes.includes(c) && c.visible) sparkPlugHiddenCovers.push(c);
                                c.visible = false;
                            });
                        });
                    } else {
                        exterior.traverse((o) => {
                            if (!o.name || !/Spark[ _]?Plug/i.test(o.name)) return;
                            o.visible = true;
                            o.traverse((c) => {
                                if (!c.isMesh) return;
                                if (plugCoverMeshes.includes(c)) {
                                    if (sparkPlugHiddenCovers.includes(c)) c.visible = true;
                                    return;
                                }
                                c.visible = true;
                            });
                        });
                        sparkPlugHiddenCovers = [];
                    }
                    requestRender();
                };

                let plugCoverEnabled = false;
                window.setPlugCoverEnabled = (on) => { plugCoverEnabled = !!on; };

                // Debug helper — lists every plug/coil/battery-named node with
                // its effective (inherited) visibility so we can tell which
                // mesh is still drawn while the plug is in Removed Items.
                window.debugPlugVisibility = function () {
                    const report = [];
                    exterior.traverse((o) => {
                        if (!o.name || !/spark|plug|batter|coil|ignit/i.test(o.name)) return;
                        let n = o, eff = true;
                        while (n) { if (n.visible === false) { eff = false; break; } n = n.parent; }
                        report.push({ name: o.name, mesh: !!o.isMesh, visible: o.visible, effVisible: eff });
                    });
                    report.push({ name: 'batteryPivot.visible', mesh: false, visible: window.batteryPivot ? window.batteryPivot.visible : 'n/a', effVisible: '' });
                    report.push({ name: 'checkBattery().removed', mesh: false, visible: (typeof window.checkBattery === 'function') ? window.checkBattery().removed : 'n/a', effVisible: '' });
                    console.table ? console.table(report) : console.log(report);
                    return report;
                };

                // Hovering a cover part dispatches 'plugCoverHovered' with the
                // part name so the page can show a remove card next to it.
                renderer.domElement.addEventListener('pointermove', (e) => {
                    if (!plugCoverEnabled || !plugCoverMeshes.length) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const hits = raycaster.intersectObjects(plugCoverMeshes.filter(m => m.visible), false);
                    if (hits.length) {
                        const idx = plugCoverMeshes.indexOf(hits[0].object);
                        renderer.domElement.style.cursor = 'pointer';
                        window.dispatchEvent(new CustomEvent('plugCoverHovered', {
                            detail: { x: e.clientX, y: e.clientY, index: idx, name: hits[0].object.name }
                        }));
                    } else {
                        renderer.domElement.style.cursor = '';
                        window.dispatchEvent(new CustomEvent('plugCoverHoverEnd'));
                    }
                }, false);

                let plugCoverDown = null;
                renderer.domElement.addEventListener('pointerdown', (e) => { plugCoverDown = { x: e.clientX, y: e.clientY }; }, false);
                renderer.domElement.addEventListener('click', (e) => {
                    if (!plugCoverEnabled || !plugCoverMeshes.length) return;
                    if (plugCoverDown && Math.hypot(e.clientX - plugCoverDown.x, e.clientY - plugCoverDown.y) > 8) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const hits = raycaster.intersectObjects(plugCoverMeshes.filter(m => m.visible), false);
                    if (!hits.length) return;
                    // Spark-plug-named covers belong to the inspect-click flow
                    if (/Spark[ _]?Plug/i.test(hits[0].object.name || '')) return;
                    const idx = plugCoverMeshes.indexOf(hits[0].object);
                    window.dispatchEvent(new CustomEvent('plugCoverClicked', {
                        detail: { x: e.clientX, y: e.clientY, index: idx, name: hits[0].object.name }
                    }));
                }, false);

                // Spark plug meshes the student can interact with — every
                // plug-named mesh, the lifted-out stand-in, and anything
                // sitting at the plug well.
                function getPlugMeshes() {
                    const list = [];
                    const plugPos = sparkPlugGroup ? sparkPlugGroup.getWorldPosition(new THREE.Vector3()) : null;
                    const tmpBox = new THREE.Box3();
                    const tmpCenter = new THREE.Vector3();
                    exterior.traverse((o) => {
                        if (!o.isMesh) return;
                        // The battery body stands in for the plug only while a
                        // page enables it — otherwise it is just the battery.
                        if (o.userData.isBattery) {
                            if (window.__batteryBodyEnabled !== false) list.push(o);
                            return;
                        }
                        const named = o.name && /Spark[ _]?Plug/i.test(o.name);
                        let near = false;
                        if (!named && plugPos) {
                            tmpBox.setFromObject(o);
                            tmpBox.getCenter(tmpCenter);
                            near = tmpCenter.distanceTo(plugPos) < 0.15;
                        }
                        if (named || near) list.push(o);
                    });
                    return list;
                }

                // Hovering the plug shows a pointer cursor and fires
                // 'sparkPlugHovered' — the page floats the option card.
                renderer.domElement.addEventListener('pointermove', (e) => {
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const hits = raycaster.intersectObjects(getPlugMeshes().filter(m => m.visible), false);
                    if (hits.length) {
                        renderer.domElement.style.cursor = 'pointer';
                        window.dispatchEvent(new CustomEvent('sparkPlugHovered', {
                            detail: { x: e.clientX, y: e.clientY, name: 'Spark Plug' }
                        }));
                    } else {
                        window.dispatchEvent(new CustomEvent('sparkPlugHoverEnd'));
                    }
                }, false);

                // Clicking the exposed spark plug dispatches 'sparkPlugClicked' —
                // the page opens the option card on the inspect step.
                renderer.domElement.addEventListener('click', (e) => {
                    if (plugCoverDown && Math.hypot(e.clientX - plugCoverDown.x, e.clientY - plugCoverDown.y) > 8) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const hits = raycaster.intersectObjects(getPlugMeshes().filter(m => m.visible), false);
                    if (!hits.length) return;
                    window.dispatchEvent(new CustomEvent('sparkPlugClicked', {
                        detail: { x: e.clientX, y: e.clientY, name: hits[0].object.name }
                    }));
                }, false);

                // Debug helper: report the frontmost mesh name on every click so
                // unnamed interactive targets can be identified in the page UI.
                renderer.domElement.addEventListener('click', (e) => {
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const hits = raycaster.intersectObjects(exterior.children, true);
                    if (hits.length) {
                        window.dispatchEvent(new CustomEvent('debugMeshClicked', {
                            detail: { name: hits[0].object.name || '(unnamed mesh)' }
                        }));
                    }
                }, false);

                // Underchassis detection — when the camera is rotated low enough to
                // see the underside, clicking the car fires 'underchassisInspected'
                // every time and 'underchassisClicked' once for legacy listeners.
                let ucDown = null;
                let underchassisSeen = false;
                renderer.domElement.addEventListener('pointerdown', (e) => { ucDown = { x: e.clientX, y: e.clientY }; }, false);
                renderer.domElement.addEventListener('click', (e) => {
                    if (ucDown && Math.hypot(e.clientX - ucDown.x, e.clientY - ucDown.y) > 8) return;
                    if (controls.getPolarAngle() <= 1.6) return; // camera must be below the car's level
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects(exterior.children, true);
                    if (!intersects.length) return;
                    window.dispatchEvent(new CustomEvent('underchassisInspected', { detail: { point: intersects[0].point.toArray() } }));
                    if (underchassisSeen) return;
                    underchassisSeen = true;
                    window.dispatchEvent(new CustomEvent('underchassisClicked', { detail: { point: intersects[0].point.toArray() } }));
                }, false);

                // Oil filter interaction — clicking the oil_filter mesh fires
                // 'oilFilterClicked'; the mesh can be hidden/shown via setOilFilterRemoved.
                // A gasket ring sits at the filter's position and shows while it is removed.
                const oilFilterMesh = exterior.getObjectByName('oil_filter');
                if (oilFilterMesh) {
                    exterior.updateMatrixWorld(true);
                    const fb = new THREE.Box3().setFromObject(oilFilterMesh);
                    const fsize = fb.getSize(new THREE.Vector3());
                    const fcen = fb.getCenter(new THREE.Vector3());
                    const extScale = exterior.getWorldScale(new THREE.Vector3());
                    const ringR = Math.max(fsize.x, fsize.y, fsize.z) * 0.4 / Math.max(extScale.x, 0.0001);
                    const oilFilterGasket = new THREE.Mesh(
                        new THREE.TorusGeometry(ringR, ringR * 0.18, 12, 40),
                        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
                    );
                    exterior.add(oilFilterGasket);
                    oilFilterGasket.position.copy(exterior.worldToLocal(fcen));
                    oilFilterGasket.quaternion.copy(exterior.getWorldQuaternion(new THREE.Quaternion()).invert());
                    oilFilterGasket.rotateX(Math.PI / 2);
                    oilFilterGasket.visible = false;

                    window.checkOilFilter = function () {
                        return { removed: !oilFilterMesh.visible };
                    };
                    window.setOilFilterRemoved = function (removed) {
                        oilFilterMesh.visible = !removed;
                        oilFilterGasket.visible = !!removed;
                        requestRender();
                        return window.checkOilFilter();
                    };
                    let ofDown = null;
                    renderer.domElement.addEventListener('pointerdown', (e) => { ofDown = { x: e.clientX, y: e.clientY }; }, false);
                    renderer.domElement.addEventListener('click', (e) => {
                        if (ofDown && Math.hypot(e.clientX - ofDown.x, e.clientY - ofDown.y) > 8) return;
                        const rect = renderer.domElement.getBoundingClientRect();
                        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                        raycaster.setFromCamera(pointer, camera);
                        const intersects = raycaster.intersectObjects(exterior.children, true);
                        for (let inter of intersects) {
                            let obj = inter.object;
                            while (obj && obj !== oilFilterMesh && obj !== oilFilterGasket) obj = obj.parent;
                            if (obj === oilFilterMesh) {
                                window.dispatchEvent(new CustomEvent('oilFilterClicked', { detail: { x: e.clientX, y: e.clientY } }));
                                break;
                            }
                            // gasket ring is only interactive while the filter is removed
                            if (obj === oilFilterGasket && !oilFilterMesh.visible) {
                                window.dispatchEvent(new CustomEvent('oilFilterGasketClicked', { detail: { x: e.clientX, y: e.clientY } }));
                                break;
                            }
                        }
                    }, false);
                }

                // Oil filler cap interaction — clicking the Oil_cap mesh fires
                // 'oilCapClicked'; the cap can be hidden/shown via setOilCapRemoved
                const oilCapMesh = exterior.getObjectByName('Oil_cap');
                if (!oilCapMesh) console.warn('Oil_cap mesh not found in car model');
                if (oilCapMesh) {
                    window.checkOilCap = function () {
                        return { removed: !oilCapMesh.visible };
                    };
                    // screen-space position of the filler cap, for oil drop targeting
                    window.getOilCapScreenPos = function () {
                        const v = new THREE.Vector3();
                        oilCapMesh.getWorldPosition(v);
                        v.project(camera);
                        const rect = renderer.domElement.getBoundingClientRect();
                        return {
                            x: rect.left + (v.x + 1) * 0.5 * rect.width,
                            y: rect.top + (1 - (v.y + 1) * 0.5) * rect.height,
                            behind: v.z > 1
                        };
                    };
                    window.setOilCapRemoved = function (removed) {
                        oilCapMesh.visible = !removed;
                        requestRender();
                        return window.checkOilCap();
                    };
                    let ocDown = null;
                    renderer.domElement.addEventListener('pointerdown', (e) => { ocDown = { x: e.clientX, y: e.clientY }; }, false);
                    renderer.domElement.addEventListener('click', (e) => {
                        if (ocDown && Math.hypot(e.clientX - ocDown.x, e.clientY - ocDown.y) > 8) return;
                        const rect = renderer.domElement.getBoundingClientRect();
                        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                        raycaster.setFromCamera(pointer, camera);
                        const intersects = raycaster.intersectObjects(exterior.children, true);
                        for (let inter of intersects) {
                            let obj = inter.object;
                            while (obj && obj !== oilCapMesh) obj = obj.parent;
                            if (obj === oilCapMesh) {
                                window.dispatchEvent(new CustomEvent('oilCapClicked', { detail: { x: e.clientX, y: e.clientY } }));
                                break;
                            }
                        }
                    }, false);
                }

                // Air filter housing interaction — the Air_Filter_Box is a single
                // combined mesh, so the whole cover is pulled straight off on a
                // pivot that lifts it up and hides it (it goes to the removed
                // items storage). Clicking the box fires 'airFilterBoxClicked';
                // setAirFilterBoxOpen(true) pulls it off, (false) refits it.
                // Clicking Air_Filter fires 'airFilterClicked' (with boxOpen in
                // the detail); setAirFilterRemoved hides/shows it.
                // Air_Intake_Hose fires 'airIntakeHoseClicked' and can be
                // hidden/shown via setAirIntakeHoseRemoved.
                const airFilterBoxMesh = exterior.getObjectByName('Air_Filter_Box');
                const airFilterMesh = exterior.getObjectByName('Air_Filter');
                const airIntakeHoseMesh = exterior.getObjectByName('Air_Intake_Hose');
                if (!airFilterBoxMesh) console.warn('Air_Filter_Box mesh not found in car model');
                if (!airFilterMesh) console.warn('Air_Filter mesh not found in car model');
                if (!airIntakeHoseMesh) console.warn('Air_Intake_Hose mesh not found in car model');
                if (airFilterBoxMesh) {
                    exterior.updateMatrixWorld(true);
                    const bbox = new THREE.Box3().setFromObject(airFilterBoxMesh);
                    const bsize = bbox.getSize(new THREE.Vector3());
                    const bcenter = bbox.getCenter(new THREE.Vector3());
                    // pivot at the box center so the cover lifts straight off
                    const liftWorld = bcenter.clone();

                    const pivot = new THREE.Group();
                    pivot.name = 'AirFilterBox_pivot';
                    exterior.worldToLocal(liftWorld);
                    pivot.position.copy(liftWorld);
                    exterior.add(pivot);
                    pivot.attach(airFilterBoxMesh);
                    airFilterBoxMesh.userData.isAirFilterBox = true;
                    airFilterBoxPivot = pivot;
                    airFilterBoxState = {
                        open: false,
                        lift: 0,
                        target: 0,
                        basePos: pivot.position.clone(),
                        liftDist: Math.max(bsize.y * 2.2, 0.25)
                    };

                    window.checkAirFilterBox = function () {
                        return { open: airFilterBoxState.open };
                    };
                    window.setAirFilterBoxOpen = function (open) {
                        airFilterBoxState.open = !!open;
                        // when refitting, make the cover visible so it can drop back on
                        if (!airFilterBoxState.open) airFilterBoxPivot.visible = true;
                        airFilterBoxState.target = airFilterBoxState.open ? 1 : 0;
                        requestRender();
                        return window.checkAirFilterBox();
                    };
                }
                if (airFilterMesh) {
                    airFilterMesh.userData.isAirFilter = true;
                    window.checkAirFilter = function () {
                        return { removed: !airFilterMesh.visible };
                    };
                    window.setAirFilterRemoved = function (removed) {
                        airFilterMesh.visible = !removed;
                        requestRender();
                        return window.checkAirFilter();
                    };
                }
                if (airIntakeHoseMesh) {
                    airIntakeHoseMesh.userData.isAirIntakeHose = true;
                    window.checkAirIntakeHose = function () {
                        return { removed: !airIntakeHoseMesh.visible };
                    };
                    window.setAirIntakeHoseRemoved = function (removed) {
                        airIntakeHoseMesh.visible = !removed;
                        requestRender();
                        return window.checkAirIntakeHose();
                    };
                }
                if (airFilterBoxMesh || airFilterMesh || airIntakeHoseMesh) {
                    let afDown = null;
                    renderer.domElement.addEventListener('pointerdown', (e) => { afDown = { x: e.clientX, y: e.clientY }; }, false);
                    renderer.domElement.addEventListener('click', (e) => {
                        if (afDown && Math.hypot(e.clientX - afDown.x, e.clientY - afDown.y) > 8) return;
                        const rect = renderer.domElement.getBoundingClientRect();
                        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                        raycaster.setFromCamera(pointer, camera);
                        const intersects = raycaster.intersectObjects(exterior.children, true);
                        for (let inter of intersects) {
                            if (!inter.object.visible) continue;
                            let obj = inter.object;
                            while (obj && !obj.userData.isAirFilterBox && !obj.userData.isAirFilter && !obj.userData.isAirIntakeHose) obj = obj.parent;
                            if (obj && obj.userData.isAirFilterBox && airFilterBoxState && airFilterBoxState.open) {
                                continue; // cover is pulled off — its hidden mesh must not eat this hit
                            }
                            if (obj && obj.userData.isAirFilter) {
                                window.dispatchEvent(new CustomEvent('airFilterClicked', { detail: { x: e.clientX, y: e.clientY, boxOpen: !!(airFilterBoxState && airFilterBoxState.open) } }));
                                break;
                            }
                            if (obj && obj.userData.isAirFilterBox) {
                                window.dispatchEvent(new CustomEvent('airFilterBoxClicked', { detail: { x: e.clientX, y: e.clientY } }));
                                break;
                            }
                            if (obj && obj.userData.isAirIntakeHose) {
                                window.dispatchEvent(new CustomEvent('airIntakeHoseClicked', { detail: { x: e.clientX, y: e.clientY } }));
                                break;
                            }
                        }
                    }, false);

                    // pointer cursor over the interactive air filter parts
                    renderer.domElement.addEventListener('pointermove', (e) => {
                        const rect = renderer.domElement.getBoundingClientRect();
                        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                        raycaster.setFromCamera(pointer, camera);
                        const intersects = raycaster.intersectObjects(exterior.children, true);
                        for (let inter of intersects) {
                            if (!inter.object.visible) continue;
                            let obj = inter.object;
                            while (obj && !obj.userData.isAirFilterBox && !obj.userData.isAirIntakeHose && !obj.userData.isAirFilter) obj = obj.parent;
                            if (obj && obj.userData.isAirFilterBox && airFilterBoxState && airFilterBoxState.open) {
                                continue; // cover is pulled off — not interactive
                            }
                            if (obj && (obj.userData.isAirFilterBox || obj.userData.isAirIntakeHose || obj.userData.isAirFilter)) {
                                renderer.domElement.style.cursor = 'pointer';
                                break;
                            }
                        }
                    }, false);
                }

                // Wheel interaction — clicking a wheel/tire/rim mesh fires
                // 'wheelClicked'; clicking a front tire fires 'frontWheelClicked'
                // instead (used by the brake pad practice flow to confirm removal).
                const wheelNameRe = /WHEEL|TIRE|RIM/i;
                let whDown = null;
                renderer.domElement.addEventListener('pointerdown', (e) => { whDown = { x: e.clientX, y: e.clientY }; }, false);
                renderer.domElement.addEventListener('click', (e) => {
                    if (whDown && Math.hypot(e.clientX - whDown.x, e.clientY - whDown.y) > 8) return;
                    const rect = renderer.domElement.getBoundingClientRect();
                    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects(exterior.children, true);
                    for (let inter of intersects) {
                        if (!inter.object.visible) continue;
                        let obj = inter.object;
                        while (obj && !wheelNameRe.test(obj.name || '') && !obj.userData.isFrontWheel) obj = obj.parent;
                        if (obj && (wheelNameRe.test(obj.name || '') || obj.userData.isFrontWheel)) {
                            if (obj.userData.isFrontWheel) {
                                window.dispatchEvent(new CustomEvent('frontWheelClicked', { detail: { x: e.clientX, y: e.clientY, name: obj.name, side: obj.userData.wheelSide } }));
                            } else {
                                window.dispatchEvent(new CustomEvent('wheelClicked', { detail: { x: e.clientX, y: e.clientY, name: obj.name } }));
                            }
                            break;
                        }
                    }
                }, false);

                requestRender();
            } catch (e) {
                console.warn('Hood setup failed', e);
            }
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    function renderLoop() {
        let needsMore = false;
        if (controls && controls.update()) {
            needsMore = true;
        }

        // animate hood pivots towards their targets
        if (hoodPivots && hoodPivots.length) {
            for (let i = 0; i < hoodPivots.length; i++) {
                const pivot = hoodPivots[i];
                const state = hoodState[i] || { target: 0 };
                const cur = pivot.rotation.x;
                const target = state.target || 0;
                if (Math.abs(cur - target) > 0.001) {
                    pivot.rotation.x = THREE.MathUtils.lerp(cur, target, 0.08);
                    needsMore = true;
                } else {
                    pivot.rotation.x = target;
                }
            }
        }

        // animate door pivots
        if (doorPivots && doorPivots.length) {
            for (let i = 0; i < doorPivots.length; i++) {
                const p = doorPivots[i];
                const st = doorState[i] || { target: 0 };
                const cur = p.rotation.y;
                const target = st.target || 0;
                if (Math.abs(cur - target) > 0.001) {
                    p.rotation.y = THREE.MathUtils.lerp(cur, target, 0.12);
                    needsMore = true;
                } else {
                    p.rotation.y = target;
                }
            }
        }

        // animate battery terminal caps (fade out when removed)
        if (batteryCapPivots && batteryCapPivots.length) {
            for (let i = 0; i < batteryCapPivots.length; i++) {
                const pivot = batteryCapPivots[i];
                const state = batteryCapState[i];
                if (!state) continue;

                const targetOpacity = state.removed ? 0 : 1;
                const curOpacity = pivot.userData.opacity !== undefined ? pivot.userData.opacity : 1;
                if (Math.abs(curOpacity - targetOpacity) > 0.005) {
                    pivot.userData.opacity = THREE.MathUtils.lerp(curOpacity, targetOpacity, 0.15);
                    if (pivot.userData.materials) {
                        pivot.userData.materials.forEach(mat => {
                            mat.opacity = pivot.userData.opacity;
                        });
                    }
                    if (pivot.children[0]) {
                        pivot.children[0].visible = pivot.userData.opacity > 0.01;
                    }
                    needsMore = true;
                } else {
                    pivot.userData.opacity = targetOpacity;
                    if (pivot.userData.materials) {
                        pivot.userData.materials.forEach(mat => {
                            mat.opacity = targetOpacity;
                        });
                    }
                    if (pivot.children[0]) {
                        pivot.children[0].visible = targetOpacity > 0.01;
                    }
                }
            }
        }

        // animate battery (lift up when removed)
        if (window.batteryPivot && window.batteryPivot.userData.animate) {
            const pivot = window.batteryPivot;
            const targetY = pivot.userData.targetY || pivot.userData.baseY;
            const targetRot = pivot.userData.targetRot || 0;

            pivot.position.y = THREE.MathUtils.lerp(pivot.position.y, targetY, 0.08);
            pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, targetRot, 0.08);

            if (Math.abs(pivot.position.y - targetY) < 0.001 &&
                Math.abs(pivot.rotation.x - targetRot) < 0.001) {
                pivot.position.y = targetY;
                pivot.rotation.x = targetRot;
                pivot.userData.animate = false;
            } else {
                needsMore = true;
            }
        }

        // animate fuel filter (lifts out of the bracket when removed)
        if (window.fuelFilterPivot && window.fuelFilterPivot.userData.animate) {
            const pivot = window.fuelFilterPivot;
            const targetY = pivot.userData.targetY || pivot.userData.baseY;
            const targetRot = pivot.userData.targetRot || 0;

            pivot.position.y = THREE.MathUtils.lerp(pivot.position.y, targetY, 0.08);
            pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, targetRot, 0.08);

            if (Math.abs(pivot.position.y - targetY) < 0.001 &&
                Math.abs(pivot.rotation.x - targetRot) < 0.001) {
                pivot.position.y = targetY;
                pivot.rotation.x = targetRot;
                pivot.userData.animate = false;
            } else {
                needsMore = true;
            }
        }

        // animate air filter housing pivot (cover lifts off / drops back on)
        if (airFilterBoxPivot && airFilterBoxState) {
            const cur = airFilterBoxState.lift || 0;
            const target = airFilterBoxState.target || 0;
            let next = cur;
            if (Math.abs(cur - target) > 0.001) {
                next = cur + (target - cur) * 0.08;
                needsMore = true;
            } else {
                next = target;
            }
            airFilterBoxState.lift = next;
            const d = airFilterBoxState.liftDist || 0.25;
            airFilterBoxPivot.position.copy(airFilterBoxState.basePos);
            airFilterBoxPivot.position.y += next * d;
            airFilterBoxPivot.position.z -= next * d * 0.3;
            // once fully lifted the cover is in the removed-items storage
            if (airFilterBoxState.open && Math.abs(next - 1) <= 0.001) {
                airFilterBoxPivot.visible = false;
            }
        }

        renderer.render(scene, camera);

        if (needsMore) {
            requestAnimationFrame(renderLoop);
        } else {
            isRunning = false;
        }
    }

    requestRender();

    const syncToContainer = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        if (activeExterior) frameModel(activeExterior);
        requestRender();
    };

    if (window.ResizeObserver) {
        const observer = new ResizeObserver(() => syncToContainer());
        observer.observe(container);
    }

    window.addEventListener('resize', () => {
        syncToContainer();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeScene, { once: true });
} else {
    initThreeScene();
}

