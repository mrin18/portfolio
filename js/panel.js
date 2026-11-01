// ============================================================
// PANEL.JS: builds the full project detail page and its downloads.
// ============================================================

const detailContent = document.getElementById('project-detail-content');
const detailViewers = [];

const modelLightbox = document.createElement('dialog');
modelLightbox.className = 'model-lightbox';
modelLightbox.setAttribute('aria-label', 'Expanded 3D model');

const lightboxWindow = document.createElement('div');
lightboxWindow.className = 'model-lightbox-window';

const lightboxHint = document.createElement('p');
lightboxHint.className = 'model-lightbox-hint';
const lightboxClose = document.createElement('button');
lightboxClose.className = 'model-lightbox-close';
lightboxClose.type = 'button';
lightboxClose.setAttribute('aria-label', 'Close expanded model');
lightboxClose.textContent = '×';

const lightboxStageSlot = document.createElement('div');
lightboxStageSlot.className = 'model-lightbox-stage-slot';
lightboxWindow.appendChild(lightboxStageSlot);
modelLightbox.appendChild(lightboxWindow);
document.body.appendChild(modelLightbox);
modelLightbox.setAttribute('aria-label', 'Expanded 3D model viewer');
lightboxHint.id = 'model-lightbox-hint';
modelLightbox.setAttribute('aria-describedby', lightboxHint.id);

let lightboxStage = null;
let lightboxPlaceholder = null;
let lightboxReturnFocus = null;
let lightboxViewer = null;
let lightboxClosing = false;

function animateLightboxFrom(rect, close = false, onFinish) {
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360;
  if (!duration) {
    if (onFinish) onFinish();
    return;
  }

  const target = modelLightbox.getBoundingClientRect();
  const transform = `translate(${rect.left - target.left}px, ${rect.top - target.top}px) scale(${rect.width / target.width}, ${rect.height / target.height})`;
  const animation = modelLightbox.animate(
    close
      ? [{ transform: 'none', opacity: 1 }, { transform, opacity: .82 }]
      : [{ transform, opacity: .82 }, { transform: 'none', opacity: 1 }],
    { duration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
  );
  animation.onfinish = () => {
    animation.cancel();
    if (onFinish) onFinish();
  };
}

function openModelLightbox(stage, viewer) {
  if (modelLightbox.open || !stage.parentNode) return;

  const startRect = stage.getBoundingClientRect();
  lightboxPlaceholder = document.createElement('div');
  lightboxPlaceholder.className = `${stage.className} model-lightbox-placeholder`;
  lightboxPlaceholder.style.margin = getComputedStyle(stage).margin;
  stage.parentNode.insertBefore(lightboxPlaceholder, stage);
  lightboxStage = stage;
  lightboxViewer = viewer;
  setViewerLightboxMode(viewer, true);
  lightboxReturnFocus = document.activeElement;
  lightboxHint.textContent = viewer.p.kind === 'assembly'
    ? 'Drag to rotate · Scroll to zoom · Click to explode / reassemble'
    : 'Drag to rotate · Scroll to zoom';
  stage.append(lightboxHint, lightboxClose);
  modelLightbox.showModal();
  lightboxStageSlot.appendChild(stage);

  requestAnimationFrame(() => {
    modelLightbox.classList.add('is-open');
    animateLightboxFrom(startRect);
    lightboxClose.focus({ preventScroll: true });
  });
}

function closeModelLightbox() {
  if (!modelLightbox.open || lightboxClosing || !lightboxStage || !lightboxPlaceholder) return;
  lightboxClosing = true;
  setViewerLightboxMode(lightboxViewer, false);
  const endRect = lightboxPlaceholder.getBoundingClientRect();

  const finishClose = () => {
    modelLightbox.close();
    lightboxPlaceholder.parentNode.replaceChild(lightboxStage, lightboxPlaceholder);
    lightboxHint.remove();
    lightboxClose.remove();
    lightboxStage = null;
    lightboxPlaceholder = null;
    lightboxViewer = null;
    modelLightbox.classList.remove('is-open');
    lightboxClosing = false;
    if (lightboxReturnFocus instanceof HTMLElement && lightboxReturnFocus.isConnected) {
      lightboxReturnFocus.focus({ preventScroll: true });
    }
    lightboxReturnFocus = null;
  };

  modelLightbox.classList.remove('is-open');
  animateLightboxFrom(endRect, true, finishClose);
}

lightboxClose.addEventListener('click', event => {
  event.stopPropagation();
  closeModelLightbox();
});
modelLightbox.addEventListener('wheel', event => {
  if (!modelLightbox.open || !lightboxViewer || lightboxClosing) return;
  event.preventDefault();
  zoomViewer(lightboxViewer, event.deltaY);
}, { passive: false });
modelLightbox.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModelLightbox();
  }
});
modelLightbox.addEventListener('cancel', event => {
  event.preventDefault();
  closeModelLightbox();
});
modelLightbox.addEventListener('click', event => {
  if (event.target === modelLightbox) closeModelLightbox();
});

function addDetailText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function getDownloads(asset) {
  return asset.downloads || [];
}

function renderDownloads(parent, asset) {
  const downloads = getDownloads(asset);
  if (!downloads.length) {
    addDetailText(parent, 'p', 'detail-empty', 'STEP and STL downloads have not been added for this project yet.');
    return;
  }

  const list = document.createElement('div');
  list.className = 'detail-downloads';
  downloads.forEach(file => {
    const link = document.createElement('a');
    link.className = 'download-link';
    link.href = file.url;
    link.download = file.url.split('/').pop();
    link.textContent = `Download ${file.label}`;
    list.appendChild(link);
  });
  parent.appendChild(list);
}

function addAssetCard(parent, project, asset) {
  const card = document.createElement('article');
  card.className = 'asset-card';
  addDetailText(card, 'h3', '', asset.name);
  if (asset.description) addDetailText(card, 'p', 'asset-description', asset.description);

  if (asset.model) {
    const stage = document.createElement('div');
    stage.className = 'detail-stage asset-stage';
    card.appendChild(stage);
    const viewer = makeView(stage, { ...project, ...asset, kind: 'single' });
    detailViewers.push(viewer);
    attachModelInteraction(stage, viewer, stage, () => openModelLightbox(stage, viewer), true, true);
  }

  renderDownloads(card, asset);
  parent.appendChild(card);
}

function openProjectDetails(project) {
  detailViewers.forEach(viewer => viewer.dispose());
  detailViewers.length = 0;
  detailContent.replaceChildren();

  const layout = document.createElement('div');
  layout.className = 'detail-layout';

  const preview = document.createElement('section');
  preview.className = 'detail-preview';
  const stage = document.createElement('div');
  stage.className = 'detail-stage';
  preview.appendChild(stage);
  const mainViewer = makeView(stage, project);
  detailViewers.push(mainViewer);
  attachModelInteraction(stage, mainViewer, stage, () => openModelLightbox(stage, mainViewer), true, true);
  addDetailText(preview, 'p', 'detail-interaction-hint', 'Click or tap to expand · Drag to rotate');
  const projectDownloads = document.createElement('section');
  projectDownloads.className = 'detail-preview-downloads';
  renderDownloads(projectDownloads, project);
  preview.appendChild(projectDownloads);

  const summary = document.createElement('section');
  summary.className = 'detail-summary';
  addDetailText(summary, 'p', 'detail-kicker', project.kind === 'assembly' ? '3D assembly' : '3D project');
  addDetailText(summary, 'h1', 'detail-title', project.name);
  addDetailText(summary, 'p', 'detail-tag', project.tag);
  addDetailText(summary, 'p', 'detail-description', project.text);

  layout.append(preview, summary);
  detailContent.appendChild(layout);

  if (project.kind === 'assembly') {
    const partsSection = document.createElement('section');
    partsSection.className = 'detail-section';
    addDetailText(partsSection, 'h2', '', 'Individual parts');

    if (project.parts && project.parts.length) {
      const parts = document.createElement('div');
      parts.className = 'asset-grid';
      project.parts.forEach(part => addAssetCard(parts, project, part));
      partsSection.appendChild(parts);
    } else {
      addDetailText(partsSection, 'p', 'detail-empty', 'Individual part models and downloads have not been added yet.');
    }

    detailContent.appendChild(partsSection);
  }

  go('project-detail', false);
}
