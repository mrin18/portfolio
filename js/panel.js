// ============================================================
// PANEL.JS: builds the full project detail page and its downloads.
// ============================================================

const detailContent = document.getElementById('project-detail-content');
const detailViewers = [];

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
    attachModelInteraction(stage, viewer, stage, undefined, true);
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
  attachModelInteraction(stage, mainViewer, stage, undefined, true);
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
  addDetailText(preview, 'p', 'detail-interaction-hint', 'Drag to rotate · Hover to explore');

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
