import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupOrientationGate } from '/src/viewport.js';

const $ = (id) => document.getElementById(id);
const status = $('status');
const orientation = matchMedia('(pointer: coarse) and (max-width: 767px) and (orientation: portrait)');
setupOrientationGate({ media: orientation, shell: $('shell'), gate: $('rotation'), getResumeTarget: () => $('canvas') });

try {
  const renderer = new THREE.WebGLRenderer({ canvas: $('canvas'), antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  const render = () => { if (!document.hidden && !orientation.matches) renderer.render(scene, camera); };
  controls.addEventListener('change', render);
  const ambient = new THREE.AmbientLight(0xffffff, 1.5); scene.add(ambient);
  $('ambient').oninput = () => { ambient.intensity = Number($('ambient').value); $('ambient-value').value = $('ambient').value; render(); };
  scene.add(new THREE.HemisphereLight(0xe7f6ff, 0x536077, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 2.5); light.position.set(2, 3, 4); scene.add(light);
  const fill = new THREE.DirectionalLight(0xb9ddff, 1); fill.position.set(-2, 1, -2); scene.add(fill);
  const resize = () => {
    const { width, height } = $('stage').getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
  };
  new ResizeObserver(resize).observe($('stage'));
  document.addEventListener('visibilitychange', render);
  const gltf = await new GLTFLoader().loadAsync('/avatar/model.glb', (event) => {
    status.textContent = event.total ? `モデルを読み込み中… ${Math.round(event.loaded / event.total * 100)}%` : 'モデルを読み込み中…';
  });
  const model = gltf.scene;
  const morphs = [], meshes = [], bones = new Map(), morphGroups = new Set();
  model.traverse((object) => {
    if (object.isBone) bones.set(object.uuid, { object, quaternion: object.quaternion.clone() });
    if (!object.isMesh) return;
    meshes.push({ mesh: object, material: object.material });
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.vertexColors = false;
    if (!object.morphTargetInfluences?.length) return;
    const group = gltf.parser.associations.get(object)?.meshes ?? object.uuid;
    const data = { mesh: object, group, source: object.geometry, weights: [...object.morphTargetInfluences], dictionary: { ...object.morphTargetDictionary } };
    morphs.push(data);
    if (!morphGroups.has(group)) {
      morphGroups.add(group);
      const name = gltf.parser.json.meshes[group]?.name ?? object.name;
      for (const [targetName, index] of Object.entries(data.dictionary)) {
        $('morph').add(new Option(`${name} / ${targetName}`, `${morphs.length - 1}:${index}`));
      }
    }
  });
  // Keep the source geometry on CPU; upload only baseline and selected morphs.
  // Large facial sets can exceed a GPU's texture-array layer limit otherwise.
  const applyMorph = () => {
    const [selected, target] = $('morph').value.split(':').map(Number);
    morphs.forEach((data) => {
      const isSelected = Boolean($('morph').value) && data.group === morphs[selected]?.group;
      const indices = data.weights.flatMap((weight, index) => weight !== 0 ? [index] : []);
      if (isSelected && !indices.includes(target)) indices.push(target);
      const key = indices.join(',');
      if (data.key !== key) {
        if (data.mesh.geometry !== data.source) data.mesh.geometry.dispose();
        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(data.source.index);
        for (const [kind, attribute] of Object.entries(data.source.attributes)) geometry.setAttribute(kind, attribute);
        geometry.groups = data.source.groups.map(group => ({ ...group }));
        geometry.morphTargetsRelative = data.source.morphTargetsRelative;
        // No empty arrays: Three.js treats an existing position array as morph-enabled.
        if (indices.length) for (const [kind, attributes] of Object.entries(data.source.morphAttributes)) {
          geometry.morphAttributes[kind] = indices.map(index => attributes[index]);
        }
        data.mesh.geometry = geometry;
        data.mesh.updateMorphTargets();
        data.key = key;
      }
      indices.forEach((index, slot) => { data.mesh.morphTargetInfluences[slot] = isSelected && index === target ? Number($('weight').value) : data.weights[index]; });
      data.mesh.boundingBox = null; data.mesh.boundingSphere = null;
    });
    $('weight-value').value = $('weight').value;
    render();
  };
  applyMorph();
  $('vertex-colors').onchange = () => {
    for (const { mesh, material } of meshes) for (const item of Array.isArray(material) ? material : [material]) {
      item.vertexColors = $('vertex-colors').checked && Boolean(mesh.geometry.attributes.color); item.needsUpdate = true;
    }
    render();
  };
  scene.add(model); model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const fit = (angle = 0) => {
    const distance = Math.max(size.y, size.x / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.3;
    controls.target.copy(center); camera.position.set(center.x + Math.sin(angle) * distance, center.y, center.z + Math.cos(angle) * distance); controls.update(); render();
  };
  const skeleton = new THREE.SkeletonHelper(model); skeleton.visible = false; scene.add(skeleton);
  $('skeleton').onchange = () => { skeleton.visible = $('skeleton').checked; render(); };
  for (const [id, data] of bones) $('bone').add(new Option(data.object.name, id));
  const applyBone = () => {
    for (const { object, quaternion } of bones.values()) object.quaternion.copy(quaternion);
    const data = bones.get($('bone').value);
    if (data) data.object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(Number($('angle').value))));
    model.updateMatrixWorld(true);
    for (const { mesh } of meshes) if (mesh.isSkinnedMesh) { mesh.skeleton.update(); mesh.boundingBox = null; mesh.boundingSphere = null; }
    $('angle-value').value = `${$('angle').value}°`; render();
  };
  $('bone').onchange = () => { $('angle').value = 0; applyBone(); };
  $('angle').oninput = applyBone;
  $('morph').onchange = () => { $('weight').value = 0; applyMorph(); };
  $('weight').oninput = applyMorph;
  $('reset').onclick = () => { $('bone').value = ''; $('angle').value = 0; $('morph').value = ''; $('weight').value = 0; applyBone(); applyMorph(); };
  $('material').onchange = () => {
    for (const entry of meshes) {
      entry.unlit ??= (Array.isArray(entry.material) ? entry.material : [entry.material]).map(material => new THREE.MeshBasicMaterial({ map: material.map, color: material.color, transparent: material.transparent, opacity: material.opacity, alphaTest: material.alphaTest, side: material.side }));
      entry.mesh.material = $('material').value === 'pbr' ? entry.material : Array.isArray(entry.material) ? entry.unlit : entry.unlit[0];
    }
    render();
  };
  document.querySelectorAll('[data-view]').forEach(button => { button.onclick = () => fit(Number(button.dataset.view)); });
  resize(); fit(); $('controls').disabled = false;
  $('stats').textContent = `${meshes.length} render meshes · ${bones.size} bones · ${$('morph').options.length - 1} shape keys · ${gltf.animations.length} animations`;
  status.textContent = 'ドラッグ：回転 · ホイール / ピンチ：拡大 · 右ドラッグ：移動';
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); status.textContent = 'GPU接続が失われました。ページを再読み込みしてください。'; });
} catch (error) {
  console.error(error); status.textContent = `表示できませんでした：${error.message}`;
}
