// ============================================================
// BACKGROUND.JS: softly floating audio and mechanical objects.
// ============================================================

const bgCanvas = document.getElementById('bg');
const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
const bgScene = new THREE.Scene();
const bgCam = new THREE.PerspectiveCamera(54, 1, .1, 100);
bgCam.position.z = 24;
bgCam.lookAt(0, 0, 0);

const colours = ['#35a9a0', '#7765c7', '#e85d45', '#e7ad42'];
const floatingObjects = [];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let mouseX = 0;
let mouseY = 0;
let backgroundTransitionStartedAt = null;
const backgroundTransitionDuration = 950;
let incomingObjects = [];

function addWire(group, geometry, color, opacity = .44) {
  const edges = new THREE.EdgesGeometry(geometry, 18);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false
  });
  const lines = new THREE.LineSegments(edges, material);
  group.add(lines);
  return lines;
}

function addSpeaker(group, color) {
  addWire(group, new THREE.BoxGeometry(1, 1.45, .48), color);
  [-.37, .31].forEach((y, index) => {
    const radius = index ? .22 : .32;
    addWire(group, new THREE.TorusGeometry(radius, .035, 6, 28), color, .44).position.set(0, y, .26);
    addWire(group, new THREE.SphereGeometry(radius * .72, 10, 8), color, .24).position.set(0, y, .28);
  });
}

function addHeadphones(group, color) {
  const arch = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.58, -.05, 0),
    new THREE.Vector3(-.62, .55, 0),
    new THREE.Vector3(-.35, .92, 0),
    new THREE.Vector3(0, 1.02, 0),
    new THREE.Vector3(.35, .92, 0),
    new THREE.Vector3(.62, .55, 0),
    new THREE.Vector3(.58, -.05, 0)
  ]);
  addWire(group, new THREE.TubeGeometry(arch, 24, .055, 5, false), color, .4);
  [-.67, .67].forEach(x => {
    const cup = addWire(group, new THREE.TorusGeometry(.24, .075, 7, 20), color, .42);
    cup.position.set(x, -.12, .02);
    const pad = addWire(group, new THREE.SphereGeometry(.21, 10, 8), color, .2);
    pad.scale.set(.72, 1, .58);
    pad.position.set(x, -.12, .04);
  });
}

function addIem(group, color) {
  const shell = addWire(group, new THREE.SphereGeometry(.42, 12, 9), color, .4);
  shell.scale.set(1, .72, .62);
  shell.position.set(-.12, 0, 0);
  const faceplate = addWire(group, new THREE.TorusGeometry(.2, .035, 6, 18), color, .5);
  faceplate.position.set(-.13, 0, .24);
  const nozzle = addWire(group, new THREE.CylinderGeometry(.11, .16, .43, 10), color, .4);
  nozzle.rotation.z = Math.PI / 2.8;
  nozzle.position.set(.35, -.2, .02);
}

function addEarbuds(group, color) {
  [-.36, .36].forEach((x, index) => {
    const bud = addWire(group, new THREE.SphereGeometry(.22, 10, 8), color, .42);
    bud.scale.set(.8, 1, .68);
    bud.position.set(x, index ? .08 : -.08, 0);
    const stem = addWire(group, new THREE.CylinderGeometry(.055, .07, .42, 8), color, .36);
    stem.rotation.z = x < 0 ? -.18 : .18;
    stem.position.set(x, index ? -.27 : -.45, 0);
  });
}

function addGear(group, color) {
  addWire(group, new THREE.TorusGeometry(.47, .055, 6, 28), color, .42);
  addWire(group, new THREE.TorusGeometry(.2, .035, 6, 18), color, .48);
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    const tooth = addWire(group, new THREE.BoxGeometry(.2, .16, .12), color, .4);
    tooth.position.set(Math.cos(angle) * .52, Math.sin(angle) * .52, 0);
    tooth.rotation.z = angle;
  }
  for (let i = 0; i < 4; i++) {
    const spoke = addWire(group, new THREE.BoxGeometry(.3, .045, .08), color, .3);
    spoke.rotation.z = i * Math.PI / 4;
  }
}

function addEngine(group, color) {
  addWire(group, new THREE.BoxGeometry(.95, .75, .58), color, .3);
  [-.28, 0, .28].forEach(x => {
    const cylinder = addWire(group, new THREE.CylinderGeometry(.12, .12, .65, 10), color, .4);
    cylinder.position.set(x, .55, 0);
  });
  const crank = addWire(group, new THREE.CylinderGeometry(.3, .3, .12, 12), color, .36);
  crank.rotation.x = Math.PI / 2;
  crank.position.set(0, -.38, .36);
  const hub = addWire(group, new THREE.TorusGeometry(.12, .025, 5, 14), color, .5);
  hub.position.set(0, -.38, .43);
}

function addPiston(group, color) {
  const barrel = addWire(group, new THREE.CylinderGeometry(.3, .3, .85, 12, 1, true), color, .36);
  barrel.rotation.z = -.25;
  const cap = addWire(group, new THREE.CylinderGeometry(.32, .32, .12, 12), color, .44);
  cap.rotation.z = -.25;
  cap.position.set(.1, .39, 0);
  const rod = addWire(group, new THREE.CylinderGeometry(.08, .08, .65, 8), color, .42);
  rod.rotation.z = -.25;
  rod.position.set(-.11, -.62, 0);
}

function addBearing(group, color) {
  addWire(group, new THREE.TorusGeometry(.48, .1, 8, 24), color, .42);
  addWire(group, new THREE.TorusGeometry(.26, .07, 8, 20), color, .5);
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    const ball = addWire(group, new THREE.SphereGeometry(.055, 7, 6), color, .48);
    ball.position.set(Math.cos(angle) * .37, Math.sin(angle) * .37, .02);
  }
}

const builders = [addSpeaker, addHeadphones, addIem, addGear, addEngine, addEarbuds, addPiston, addBearing];
const placements = [
  [-.44, .31], [-.2, .42], [.08, .42], [.39, .3],
  [-.47, -.08], [.46, -.06], [-.4, -.35], [-.13, -.43],
  [.18, -.4], [.43, -.35], [-.29, .12], [.3, .12]
];

placements.forEach(([x, y], index) => {
  const color = colours[index % colours.length];
  const group = new THREE.Group();
  builders[index % builders.length](group, color);
  const scale = 1.05 + (index % 3) * .16;
  const z = -1 - (index % 4) * .65;
  group.scale.setScalar(scale);
  group.position.z = z;
  group.rotation.set(index * .17, index * .29, index * .41);
  bgScene.add(group);
  const parts = captureParts(group, index);
  floatingObjects.push({
    group, x, y, z, phase: index * 1.37, scale,
    spin: (index % 2 ? 1 : -1) * (.0015 + (index % 3) * .0007),
    parts
  });
});

const starPositions = new Float32Array(150 * 3);
for (let i = 0; i < starPositions.length; i += 3) {
  starPositions[i] = (Math.random() - .5) * 34;
  starPositions[i + 1] = (Math.random() - .5) * 20;
  starPositions[i + 2] = -4 - Math.random() * 5;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
bgScene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({
  color: '#b5a9c5',
  size: .035,
  transparent: true,
  opacity: .38
})));

let elapsed = 0;
function resizeBackground() {
  bgRenderer.setSize(innerWidth, innerHeight, false);
  bgCam.aspect = innerWidth / innerHeight;
  bgCam.updateProjectionMatrix();
}
addEventListener('resize', resizeBackground);
resizeBackground();

function captureParts(group, objectIndex) {
  return group.children.map((part, partIndex) => {
    const direction = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
    if (direction.lengthSq() < 1e-8) {
      const angle = (objectIndex + partIndex) * 2.399963;
      direction.set(Math.cos(angle), Math.sin(angle), .25);
    }
    direction.normalize();
    return {
      object: part,
      position: part.position.clone(),
      rotation: part.rotation.clone(),
      direction,
      opacity: part.material.opacity
    };
  });
}

function createIncomingObjects(reverse) {
  return floatingObjects.map((item, index) => {
    const group = item.group.clone(true);
    group.traverse(object => {
      if (object.isLineSegments) object.material = object.material.clone();
    });
    const parts = captureParts(group, index);
    parts.forEach(part => { part.object.material.opacity = 0; });
    bgScene.add(group);
    return {
      ...item,
      group,
      parts,
      startRotation: group.rotation.clone(),
      reverse
    };
  });
}

function startBackgroundTransition(reverse) {
  if (reduceMotion) return;
  incomingObjects.forEach(item => {
    bgScene.remove(item.group);
    item.parts.forEach(part => part.object.material.dispose());
  });
  incomingObjects = createIncomingObjects(reverse);
  backgroundTransitionStartedAt = performance.now();
}

function easePageTransition(progress) {
  const x1 = .6, y1 = 0, x2 = .2, y2 = 1;
  let low = 0, high = 1, parameter = progress;
  for (let i = 0; i < 12; i++) {
    parameter = (low + high) / 2;
    const inverse = 1 - parameter;
    const x = 3 * inverse * inverse * parameter * x1 +
      3 * inverse * parameter * parameter * x2 +
      parameter * parameter * parameter;
    if (x < progress) low = parameter;
    else high = parameter;
  }
  const inverse = 1 - parameter;
  return 3 * inverse * inverse * parameter * y1 +
    3 * inverse * parameter * parameter * y2 +
    parameter * parameter * parameter;
}

(function loop() {
  requestAnimationFrame(loop);
  if (!reduceMotion) elapsed += .01;

  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(bgCam.fov / 2)) * bgCam.position.z;
  const visibleWidth = visibleHeight * bgCam.aspect;
  let transitionProgress = 0;
  if (backgroundTransitionStartedAt !== null) {
    const elapsedProgress = Math.min(
      (performance.now() - backgroundTransitionStartedAt) / backgroundTransitionDuration,
      1
    );
    transitionProgress = elapsedProgress === 1 ? 1 : easePageTransition(elapsedProgress);
  }

  floatingObjects.forEach(item => {
    const { group } = item;
    const reverse = incomingObjects[0]?.reverse || false;
    const spread = reverse ? 1 - transitionProgress : 1 + transitionProgress * 1.35;
    const drift = 1 - transitionProgress;
    group.position.x = item.x * visibleWidth * spread + Math.sin(elapsed + item.phase) * .14 * drift;
    group.position.y = item.y * visibleHeight * spread + Math.sin(elapsed * .7 + item.phase) * .18 * drift;
    group.position.z = item.z + transitionProgress * (reverse ? -18 : 18);
    group.scale.setScalar(item.scale * (reverse
      ? 1 - transitionProgress * .35
      : 1 + transitionProgress * 1.5));
    if (!reduceMotion) {
      group.rotation.x += item.spin;
      group.rotation.y += item.spin * .8;
      group.rotation.z += item.spin * .6;
    }
    item.parts.forEach(part => {
      part.object.position.copy(part.position).addScaledVector(part.direction, transitionProgress * .7);
      part.object.rotation.copy(part.rotation);
      part.object.rotation.x += part.direction.y * transitionProgress * .4;
      part.object.rotation.y += part.direction.x * transitionProgress * .4;
      part.object.rotation.z += part.direction.z * transitionProgress * .4;
      part.object.material.opacity = part.opacity * (1 - transitionProgress);
    });
  });

  incomingObjects.forEach(item => {
    const { group } = item;
    const progress = transitionProgress;
    const spread = .45 * (1 - progress);
    const startDepth = item.reverse ? 24 : -24;
    group.position.x = item.x * visibleWidth * (1 + spread) + Math.sin(elapsed + item.phase) * .14;
    group.position.y = item.y * visibleHeight * (1 + spread) + Math.sin(elapsed * .7 + item.phase) * .18;
    group.position.z = item.z + startDepth * (1 - progress);
    group.scale.setScalar(item.scale * (.65 + progress * .35));
    group.rotation.copy(item.startRotation);
    group.rotation.x += (item.reverse ? -.35 : .35) * (1 - progress);
    group.rotation.y += (item.reverse ? .45 : -.45) * (1 - progress);
    item.parts.forEach(part => {
      const breakup = 1 - progress;
      part.object.position.copy(part.position).addScaledVector(part.direction, breakup * .7);
      part.object.rotation.copy(part.rotation);
      part.object.rotation.x += part.direction.y * breakup * .4;
      part.object.rotation.y += part.direction.x * breakup * .4;
      part.object.rotation.z += part.direction.z * breakup * .4;
      part.object.material.opacity = part.opacity * progress;
    });
  });

  if (backgroundTransitionStartedAt !== null && transitionProgress >= 1) {
    floatingObjects.forEach(item => {
      bgScene.remove(item.group);
      item.parts.forEach(part => part.object.material.dispose());
    });
    floatingObjects.splice(0, floatingObjects.length, ...incomingObjects);
    incomingObjects = [];
    backgroundTransitionStartedAt = null;
  }

  bgCam.position.x += (mouseX * 1.2 - bgCam.position.x) * .035;
  bgCam.position.y += (-mouseY * .7 - bgCam.position.y) * .035;
  bgRenderer.render(bgScene, bgCam);
})();

addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  mouseX = e.clientX / innerWidth - .5;
  mouseY = e.clientY / innerHeight - .5;
  const style = document.documentElement.style;
  style.setProperty('--ry', mouseX * 6 + 'deg');
  style.setProperty('--rx', -mouseY * 4 + 'deg');
});
