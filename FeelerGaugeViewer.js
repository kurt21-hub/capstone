import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

// Feeler gauge built procedurally — a fan of thin steel blades pivoted on a
// rivet, like the real tool used to measure the spark plug electrode gap.
function buildFeelerGauge() {
    const group = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9bec7, metalness: 0.85, roughness: 0.35 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.45 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.3 });

    const bladeCount = 9;
    const bladeW = 0.13;
    const bladeT = 0.008;

    for (let i = 0; i < bladeCount; i++) {
        const len = 0.95 - i * 0.04; // staggered blade lengths like a real set
        const blade = new THREE.Mesh(new THREE.BoxGeometry(bladeW, len, bladeT), steel);
        // round off the tip with a small chamfer impression via scale
        const angle = THREE.MathUtils.degToRad(-62 + i * (124 / (bladeCount - 1)));
        blade.position.set(Math.sin(angle) * len / 2, Math.cos(angle) * len / 2, i * bladeT * 1.6);
        blade.rotation.z = -angle;
        blade.castShadow = true;
        group.add(blade);
    }

    // folded case plates at the two outer edges
    const caseLen = 0.55;
    [-1, 1].forEach((side) => {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(bladeW * 1.5, caseLen, bladeT * 2), darkSteel);
        const angle = THREE.MathUtils.degToRad(side * 74);
        plate.position.set(Math.sin(angle) * caseLen / 2, Math.cos(angle) * caseLen / 2, (bladeCount / 2) * bladeT * 1.6);
        plate.rotation.z = -angle;
        plate.castShadow = true;
        group.add(plate);
    });

    // pivot rivet through the fan
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, bladeT * bladeCount * 1.8 + 0.05, 24), brass);
    rivet.rotation.x = Math.PI / 2;
    rivet.position.set(0, 0, (bladeCount / 2) * bladeT * 1.6);
    group.add(rivet);

    return group;
}

export function initFeelerViewer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.querySelector('canvas')) return;

    requestAnimationFrame(() => {
        const w = container.clientWidth || 130;
        const h = container.clientHeight || 100;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
        camera.position.set(0, 0, 2.2);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        renderer.setSize(w, h);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        const canvas = renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.cursor = 'grab';
        container.appendChild(canvas);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.autoRotate = false;
        controls.minDistance = 0.6;
        controls.maxDistance = 5.0;

        canvas.addEventListener('pointerdown', () => { canvas.style.cursor = 'grabbing'; }, { passive: true });
        window.addEventListener('pointerup', () => { canvas.style.cursor = 'grab'; }, { passive: true });
        canvas.addEventListener('pointerleave', () => { canvas.style.cursor = 'grab'; }, { passive: true });

        scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.0));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(2, 3, 2);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffd7c2, 0.6);
        fill.position.set(-2, 1, -1);
        scene.add(fill);

        let isRunning = false;
        function requestRender() {
            if (!isRunning) {
                isRunning = true;
                requestAnimationFrame(renderLoop);
            }
        }

        function renderLoop() {
            const needMore = controls ? controls.update() : false;
            renderer.render(scene, camera);
            if (needMore) {
                requestAnimationFrame(renderLoop);
            } else {
                isRunning = false;
            }
        }
        controls.addEventListener('change', requestRender);

        const pivot = new THREE.Group();
        pivot.add(buildFeelerGauge());
        scene.add(pivot);

        const box = new THREE.Box3().setFromObject(pivot);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const distance = maxDim * 1.6 + 0.4;
            camera.position.set(center.x, center.y + maxDim * 0.45, center.z + distance);
            camera.lookAt(center);
            controls.target.copy(center);
            controls.update();
        }

        requestRender();

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                const cw = container.clientWidth || 1;
                const ch = container.clientHeight || 1;
                camera.aspect = cw / ch;
                camera.updateProjectionMatrix();
                renderer.setSize(cw, ch);
                requestRender();
            });
            ro.observe(container);
        }
    });
}
