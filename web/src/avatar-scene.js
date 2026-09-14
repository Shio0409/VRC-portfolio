import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** One disposable TOP scene; renders on resize and smoothed pointer updates. */
export async function createAvatarScene({ canvas, signal }) {
  let renderer, model, observer;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true; observer?.disconnect();
    document.removeEventListener('visibilitychange', draw);
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    const images = new Set();
    for (const texture of textures) { if (texture.image) images.add(texture.image); texture.dispose(); }
    for (const image of images) image.close?.();
    const skeletons = new Set(); model?.traverse(node => { if (node.skeleton) skeletons.add(node.skeleton); });
    for (const skeleton of skeletons) skeleton.dispose();
    renderer?.dispose();
  };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  function draw() {
    if (disposed || document.hidden || !model || !canvas.getBoundingClientRect().width) return;
    renderer.render(scene, camera);
  }
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const response = await fetch(new URL('../assets/models/kipfel-preview.glb', import.meta.url), { signal });
    if (!response.ok) throw new Error(`Avatar HTTP ${response.status}`);
    const bytes = await response.arrayBuffer(); signal.throwIfAborted();
    const gltf = await new GLTFLoader().parseAsync(bytes, '');
    model = gltf.scene;
    let fixedBodyCount = 0;
    model.traverse(node => {
      if (!node.isMesh) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        material.vertexColors = false;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
      if (!node.morphTargetInfluences?.length) return;
      const weights = [...node.morphTargetInfluences];
      const meshIndex = gltf.parser.associations.get(node)?.meshes;
      if (gltf.parser.json.meshes[meshIndex]?.name === 'Body') {
        const index = node.morphTargetDictionary.eye_pupil_OFF;
        if (index === undefined) throw new Error('Body / eye_pupil_OFF is missing');
        weights[index] = 1; fixedBodyCount++;
      }
      const indices = weights.flatMap((value,index) => value !== 0 ? [index] : []);
      // Remove unused targets before GPU allocation; keep the fixed pupil and authored defaults.
      for (const [name, attributes] of Object.entries(node.geometry.morphAttributes)) {
        if (indices.length) node.geometry.morphAttributes[name] = indices.map(index => attributes[index]);
        else delete node.geometry.morphAttributes[name];
      }
      node.updateMorphTargets();
      indices.forEach((index, slot) => { node.morphTargetInfluences[slot] = weights[index]; });
    });
    if (!fixedBodyCount) throw new Error('Required Body morphs are missing');
    signal.throwIfAborted();
    scene.add(model, new THREE.AmbientLight(0xffffff, 1.5), new THREE.HemisphereLight(0xe7f6ff, 0x536077, 2.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(2,3,4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xb9ddff,1); fill.position.set(-2,1,-2); scene.add(fill);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    let distance = 1, viewX = 0, viewY = 0;
    const orbit = () => {
      // A 30-degree cone in any direction, rather than rotating the avatar itself.
      const magnitude = Math.min(1, Math.hypot(viewX, viewY));
      const angle = magnitude * Math.PI / 6;
      const factor = magnitude ? Math.sin(angle) / Math.hypot(viewX, viewY) : 0;
      camera.position.set(center.x + distance * viewX * factor, center.y + distance * viewY * factor, center.z + distance * Math.cos(angle));
      camera.lookAt(center); draw();
    };
    const resize = () => {
      if (disposed) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false); camera.aspect = width / height;
      // Keep framing readable while reserving a margin for the camera tilt.
      distance = Math.max(size.y, size.x / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.14 + size.z / 2;
      camera.updateProjectionMatrix(); orbit();
    };
    observer = new ResizeObserver(resize); observer.observe(canvas);
    document.addEventListener('visibilitychange', draw); resize();
    return { dispose, setView(x,y) { if (disposed) return; viewX=x; viewY=y; orbit(); } };
  } catch (error) { dispose(); throw error; }
}
