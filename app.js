const { runSearch } = window.RouteLabAlgorithms;

const ROWS = 14;
const COLS = 24;
const SIZE = ROWS * COLS;
const START = 6 * COLS + 2;
const GOAL = 6 * COLS + 21;
const descriptions = {
  bfs: 'Explores level by level. Finds the fewest steps, but ignores weights.',
  dfs: 'Explores deeply before backtracking. Does not guarantee the shortest route.',
  dijkstra: 'Finds the lowest-cost route, including weighted squares.',
  astar: 'Uses a distance estimate to guide a lowest-cost search.'
};
const delays = { 1: 65, 2: 18, 3: 2 };
const speedNames = { 1: 'Slow', 2: 'Normal', 3: 'Fast' };
const $ = id => document.getElementById(id);
const gridElement = $('grid');
const cells = [];
let grid = Array.from({ length: SIZE }, () => ({ kind: 'empty' }));
let start = START;
let goal = GOAL;
let tool = 'wall';
let drawing = false;
let drawKind = null;
let drawn = new Set();
let shownVisited = new Set();
let shownPath = new Set();
let generation = 0;
let running = false;

function addExample() {
  grid = Array.from({ length: SIZE }, () => ({ kind: 'empty' }));
  for (let r = 2; r <= 10; r++) if (r !== 4) grid[r * COLS + 7].kind = 'wall';
  for (let r = 2; r <= 11; r++) if (r !== 10) grid[r * COLS + 15].kind = 'wall';
  for (let c = 9; c <= 13; c++) grid[5 * COLS + c].kind = 'weight';
  for (let c = 10; c <= 12; c++) grid[9 * COLS + c].kind = 'weight';
}
function paint(index) {
  const element = cells[index];
  const kind = grid[index].kind;
  element.className = 'cell';
  if (shownVisited.has(index)) element.classList.add('visited');
  if (shownPath.has(index)) element.classList.add('path');
  if (kind !== 'empty') element.classList.add(kind);
  if (index === start) element.classList.add('start');
  if (index === goal) element.classList.add('goal');
  element.textContent = index === start ? 'S' : index === goal ? 'G' : kind === 'weight' ? '5' : '';
  const row = Math.floor(index / COLS) + 1;
  const column = index % COLS + 1;
  element.setAttribute('aria-label', `Row ${row}, column ${column}, ${index === start ? 'start' : index === goal ? 'goal' : kind}`);
}
function repaintAll() { cells.forEach((_, index) => paint(index)); }
function clearStats() {
  for (const id of ['stat-visited', 'stat-steps', 'stat-cost', 'stat-time']) $(id).textContent = '—';
}
function clearOverlay(message = 'Path cleared. Ready to run again.') {
  generation++;
  running = false;
  shownVisited.clear();
  shownPath.clear();
  clearStats();
  $('status').textContent = message;
  $('run').disabled = false;
  $('run').textContent = 'Run algorithm →';
  repaintAll();
}
function applyCell(index) {
  if (running) clearOverlay('Board edited. Run again to see the new route.');
  if (tool === 'start' || tool === 'goal') {
    if (index === (tool === 'start' ? goal : start)) return;
    if (tool === 'start') start = index; else goal = index;
    grid[index].kind = 'empty';
    clearOverlay('Endpoint moved. Run an algorithm.');
    return;
  }
  if (index === start || index === goal) return;
  if (drawn.has(index)) return;
  drawn.add(index);
  grid[index].kind = drawKind || tool;
  if (grid[index].kind === 'erase') grid[index].kind = 'empty';
  if (shownVisited.size || shownPath.size) {
    clearOverlay('Board edited. Run again to see the new route.');
  } else {
    paint(index);
  }
}
function buildGrid() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < SIZE; index++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = index;
    cell.setAttribute('role', 'gridcell');
    fragment.append(cell);
    cells.push(cell);
  }
  gridElement.append(fragment);
  repaintAll();
}
function setTool(next) {
  tool = next;
  document.querySelectorAll('[data-tool]').forEach(button => {
    const selected = button.dataset.tool === tool;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function run() {
  if (running) return;
  clearOverlay('Searching…');
  const myGeneration = generation;
  running = true;
  $('run').disabled = true;
  $('run').textContent = 'Searching…';
  const selected = $('algorithm').value;
  const t0 = performance.now();
  const result = runSearch(grid, ROWS, COLS, start, goal, selected);
  const computeMs = performance.now() - t0;
  const delay = delays[$('speed').value];
  for (let i = 0; i < result.visitedOrder.length; i++) {
    if (generation !== myGeneration) return;
    const index = result.visitedOrder[i];
    shownVisited.add(index);
    paint(index);
    if (i % 6 === 0) $('stat-visited').textContent = String(i + 1);
    await sleep(delay);
  }
  for (const index of result.path) {
    if (generation !== myGeneration) return;
    shownPath.add(index);
    paint(index);
    await sleep(Math.max(12, delay));
  }
  if (generation !== myGeneration) return;
  $('stat-visited').textContent = String(result.visitedOrder.length);
  $('stat-steps').textContent = result.steps === null ? 'No path' : String(result.steps);
  $('stat-cost').textContent = result.cost === null ? '—' : String(result.cost);
  $('stat-time').textContent = `${computeMs.toFixed(2)} ms`;
  $('status').textContent = result.path.length
    ? `${selected.toUpperCase()} reached the goal. ${result.steps} steps, total cost ${result.cost}.`
    : 'No route found. Remove some walls and try again.';
  $('run').disabled = false;
  $('run').textContent = 'Run algorithm →';
  running = false;
}

gridElement.addEventListener('pointerdown', event => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  const cell = event.target.closest('[data-index]');
  if (!cell) return;
  drawing = true;
  drawn = new Set();
  const index = Number(cell.dataset.index);
  drawKind = tool === 'wall' && grid[index].kind === 'wall' ? 'empty' : tool === 'erase' ? 'empty' : null;
  applyCell(index);
  event.preventDefault();
});
gridElement.addEventListener('pointerover', event => {
  if (!drawing || ['start', 'goal'].includes(tool)) return;
  const cell = event.target.closest('[data-index]');
  if (cell) applyCell(Number(cell.dataset.index));
});
window.addEventListener('pointerup', () => { drawing = false; drawKind = null; });
window.addEventListener('blur', () => { drawing = false; drawKind = null; });
gridElement.addEventListener('click', event => {
  // Keyboard activation also triggers click, but without pointerdown.
  if (event.detail !== 0) return;
  const cell = event.target.closest('[data-index]');
  if (!cell) return;
  drawn = new Set();
  drawKind = tool === 'erase' ? 'empty' : null;
  applyCell(Number(cell.dataset.index));
  drawKind = null;
});
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => setTool(button.dataset.tool)));
$('algorithm').addEventListener('change', () => {
  $('algorithm-description').textContent = descriptions[$('algorithm').value];
  clearOverlay('Algorithm changed. Ready to run.');
});
$('speed').addEventListener('input', () => { $('speed-text').textContent = speedNames[$('speed').value]; });
$('run').addEventListener('click', run);
$('clear-path').addEventListener('click', () => clearOverlay());
$('random').addEventListener('click', () => {
  generation++;
  grid = Array.from({ length: SIZE }, (_, i) => ({ kind: i === start || i === goal ? 'empty' : Math.random() < .23 ? 'wall' : 'empty' }));
  clearOverlay('Random walls added. Run an algorithm to find a route.');
});
$('reset').addEventListener('click', () => {
  start = START;
  goal = GOAL;
  grid = Array.from({ length: SIZE }, () => ({ kind: 'empty' }));
  setTool('wall');
  clearOverlay('Board reset. Draw walls or run a search.');
});
addExample();
buildGrid();
$('algorithm-description').textContent = descriptions[$('algorithm').value];
