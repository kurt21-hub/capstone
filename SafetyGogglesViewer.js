import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';

export function initSafetyGogglesViewer(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.querySelector('canvas')) return;

    requestAnimationFrame(() => {
        const w = container.clientWidth || 400;
        const h = container.clientHeight || 500;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
        camera.position.set(0, 0, 2.5);
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
        container.appendChild(canvas);

        let model = null;
        let pivot = null;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enablePan = false;
        controls.minDistance = 0.6;
        controls.maxDistance = 5.0;

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

        const loader = new GLTFLoader();
        loader.load(
            'models/Safety_googles.glb',
            (gltf) => {
                const loadedModel = gltf.scene;

                const box = new THREE.Box3().setFromObject(loadedModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                loadedModel.position.sub(center);

                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) loadedModel.scale.setScalar((1.0 / maxDim) * 1.4);

                pivot = new THREE.Group();
                pivot.add(loadedModel);
                scene.add(pivot);
                model = loadedModel;

                model.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m) => {
                        if (!m) return;
                        m.side = THREE.DoubleSide;
                        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                        m.needsUpdate = true;
                    });
                });

                requestRender();
            },
            undefined,
            (err) => console.error('Failed to load Safety Goggles model:', err)
        );

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
