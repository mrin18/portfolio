// ============================================================
// VIEWER.JS: draws the 3D models and builds the project screens.
//
// What it does:
//  1. Creates one 3D viewer per project.
//  2. Makes the models spin and explode/grow on hover (or tap on phones).
//  3. Builds the full-screen project pages from js/projects.js.
// You normally don't need to edit this file.
// ============================================================

const views = [];   // keeps track of every 3D viewer on the page
const MODEL_INTERACTION_RADIUS = 180;

function isWithinModelRadius(el, event) {
  const bounds = el.getBoundingClientRect();
  const dx = event.clientX - (bounds.left + bounds.width / 2);
  const dy = event.clientY - (bounds.top + bounds.height / 2);
  return dx * dx + dy * dy <= MODEL_INTERACTION_RADIUS * MODEL_INTERACTION_RADIUS;
}

// Creates one 3D viewer inside the element el, showing project p
function makeView(el, p) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, .1, 60);
  cam.position.set(0, .4, 11);
  cam.lookAt(0, 0, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, .75));
  const sun = new THREE.DirectionalLight(0xffffff, .9);
  sun.position.set(4, 6, 5);
  scene.add(sun);

  // The model sits inside "model", which sits inside "holder" (for spinning and sizing)
  const model = new THREE.Group();
  const holder = new THREE.Group();
  if (p.model) {
    new THREE.GLTFLoader().load(p.model,
      gltf => {
        const importedModel = new THREE.Group();
        importedModel.add(gltf.scene);
        importedModel.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(importedModel);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largestDimension = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largestDimension) || largestDimension <= 0) {
          console.error(`Model "${p.model}" has no visible geometry.`);
          return;
        }

        const fitScale = 2.5 / largestDimension;
        importedModel.scale.setScalar(fitScale);
        importedModel.position.copy(center).multiplyScalar(-fitScale);
        model.add(importedModel);
        model.updateMatrixWorld(true);

        const meshes = [];
        let componentContainer = null;
        const containsMesh = object => object.isMesh || object.children.some(containsMesh);
        importedModel.traverse(object => {
          if (object.isMesh) meshes.push(object);
          if (!componentContainer && object.children.filter(containsMesh).length > 1) {
            componentContainer = object;
          }
        });

        if (p.kind === 'assembly' && componentContainer) {
          const components = componentContainer.children.filter(containsMesh);
          components.forEach((component, index) => {
            component.userData.home = component.position.clone();
            component.userData.ex = new THREE.Vector3();

            const partBounds = new THREE.Box3().setFromObject(component);
            const partCenter = partBounds.getCenter(new THREE.Vector3());
            const direction = partCenter.clone();
            if (direction.lengthSq() < 1e-8) {
              const angle = index * 2.399963;
              direction.set(Math.cos(angle), .5, Math.sin(angle));
            }
            direction.normalize();

            const componentName = component.name.toLowerCase();
            const explodeDistance =
              componentName.includes('faceplate')
                ? .95
                : componentName.includes('nozzletop')
                ? .8
                : componentName.includes('nozzle')
                  ? .3
                  : .45;
            const localCenter = component.parent.worldToLocal(partCenter.clone());
            const localTarget = component.parent.worldToLocal(
              partCenter.clone().addScaledVector(direction, explodeDistance)
            );
            component.userData.ex.copy(localTarget.sub(localCenter));
          });
        } else {
          if (p.kind === 'assembly') {
            console.error(`Model "${p.model}" does not contain separate assembly components.`);
          }
          meshes.forEach(mesh => {
            mesh.userData.home = mesh.position.clone();
            mesh.userData.ex = new THREE.Vector3();
          });
        }
      },
      undefined,
      error => console.error(`Could not load model "${p.model}":`, error)
    );
  } else {
    console.error(`Project "${p.name}" does not have a GLB model path.`);
  }
  model.rotation.x = .3;
  holder.add(model);
  holder.rotation.y = .6;
  scene.add(holder);

  const v = {
    renderer, scene, cam, p, model, holder,
    t: 0,             // how far the parts have moved apart (0 = together, 1 = apart)
    target: 0,
    sc: 1.25,         // current size
    scT: 1.25,        // target size
    spin: false,
    orbiting: false,
    pointerX: 0,
    pointerY: 0,
    vis: false,       // is this screen on the screen right now?
    on: false
  };

  // Keep the drawing the right size when the window changes
  const fit = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(el);

  // Only animate viewers that are actually visible (saves battery)
  const visibilityObserver = new IntersectionObserver(
    e => v.vis = e[0].intersectionRatio > .2,
    { threshold: [0, .2, .6] }
  );
  visibilityObserver.observe(el);

  views.push(v);
  v.dispose = () => {
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    renderer.dispose();
    renderer.domElement.remove();
    const index = views.indexOf(v);
    if (index !== -1) views.splice(index, 1);
  };
  return v;
}

// Called on hover (or tap). Assemblies pull apart and grow slightly;
// single parts grow. Both start spinning.
function setOn(v, on) {
  v.on = on;
  v.spin = on;
  if (v.p.kind === 'assembly') {
    v.target = on ? 1 : 0;
    v.scT = on ? 1.35 : 1.25;
  } else {
    v.scT = on ? 1.7 : 1.25;
  }
}

function attachModelInteraction(stage, v, activeElement = stage, onActivate, enableOrbit = false) {
  if (enableOrbit) {
    stage.classList.add('orbit-enabled');
    stage.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      v.orbiting = true;
      v.pointerX = e.clientX;
      v.pointerY = e.clientY;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('orbiting');
    });
    stage.addEventListener('pointermove', e => {
      if (!v.orbiting || e.pointerType !== 'mouse') return;
      v.holder.rotation.y += (e.clientX - v.pointerX) * .01;
      v.holder.rotation.x += (e.clientY - v.pointerY) * .01;
      v.pointerX = e.clientX;
      v.pointerY = e.clientY;
    });
    const stopOrbit = e => {
      if (!v.orbiting) return;
      v.orbiting = false;
      stage.classList.remove('orbiting');
      if (stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
      const active = isWithinModelRadius(stage, e);
      activeElement.classList.toggle('model-active', active);
      setOn(v, active);
    };
    stage.addEventListener('pointerup', stopOrbit);
    stage.addEventListener('pointercancel', stopOrbit);
    stage.addEventListener('lostpointercapture', stopOrbit);
  }

  stage.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && !v.orbiting) {
      const active = isWithinModelRadius(stage, e);
      activeElement.classList.toggle('model-active', active);
      setOn(v, active);
    }
  });
  stage.addEventListener('pointerleave', e => {
    if (e.pointerType === 'mouse' && !v.orbiting) {
      activeElement.classList.remove('model-active');
      setOn(v, false);
    }
  });
  stage.addEventListener('click', e => {
    if (!isWithinModelRadius(stage, e)) return;
    if (onActivate) {
      onActivate();
    } else if (e.pointerType !== 'mouse') {
      setOn(v, !v.on);
      activeElement.classList.toggle('model-active', v.on);
    }
  });
}

// The animation loop: runs about 60 times per second
(function tick() {
  requestAnimationFrame(tick);
  for (const v of views) {
    if (!v.vis) continue;

    v.t += (v.target - v.t) * .08;     // ease the explode amount
    v.sc += (v.scT - v.sc) * .08;      // ease the size

    v.model.traverse(obj => {
      if (obj.userData.home) {
        obj.position.copy(obj.userData.home).addScaledVector(obj.userData.ex, v.t);
      }
    });
    v.holder.scale.setScalar(v.sc);
    if (v.spin) v.holder.rotation.y += .012;

    v.renderer.render(v.scene, v.cam);
  }
})();


// ---------- Build one full-screen page per project ----------
const slidesWrap = document.getElementById('slides');
const projectDots = document.getElementById('project-dots');
const projectPage = document.getElementById('projects');

PROJECTS.forEach((p, i) => {
  const dot = document.createElement('button');
  dot.className = 'project-dot';
  dot.type = 'button';
  dot.setAttribute('aria-label', `Go to project ${i + 1}: ${p.name}`);
  dot.addEventListener('click', () => {
    projectPage.scrollTo({ top: slide.offsetTop, behavior: 'smooth' });
  });
  projectDots.appendChild(dot);

  // The HTML for one project screen
  const slide = document.createElement('section');
  slide.className = 'slide';
  slide.innerHTML =
    '<div class="stage"></div>' +
    '<div class="cap"><h2></h2><div class="tag"></div></div>';

  // Fill in the text from projects.js
  slide.querySelector('h2').textContent = p.name;
  slide.querySelector('.tag').textContent =
    p.tag + ' · ' + (p.kind === 'assembly' ? 'Assembly' : 'Single part');

  slidesWrap.appendChild(slide);

  // Create the 3D viewer inside this screen
  const stage = slide.querySelector('.stage');
  const v = makeView(stage, p);

  attachModelInteraction(stage, v, slide, () => openProjectDetails(p));

  // Highlight the current project in the navigation dots.
  new IntersectionObserver(
    e => {
      if (e[0].intersectionRatio > .6) {
        projectDots.querySelectorAll('.project-dot').forEach((item, index) => {
          if (index === i) item.setAttribute('aria-current', 'step');
          else item.removeAttribute('aria-current');
        });
      }
    },
    { threshold: [.6] }
  ).observe(slide);
});
