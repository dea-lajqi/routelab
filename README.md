# RouteLab — Pathfinding Visualizer

A small interactive website for experimenting with pathfinding algorithms. Draw walls, add weighted squares, and watch the route search unfold.

## Features

- **BFS:** shortest path by number of steps on an unweighted grid
- **DFS:** depth-first exploration; not guaranteed to find the shortest path
- **Dijkstra:** lowest-cost path, including weighted squares
- **A\*:** lowest-cost path using a Manhattan-distance heuristic
- Editable start and goal, walls, weighted squares (cost 5), and an eraser
- Animated visited cells and highlighted final route
- Statistics for visited cells, path steps, path cost, and computation time
- Random walls and reset controls

## Running locally

Download or clone the folder, then double-click **`index.html`** to open it in your browser. You can also use the VS Code **Live Server** extension.

No libraries or build tools are required for the website.

## Testing the algorithms

If you have Node.js installed:

```bash
node --test tests/algorithms.test.mjs
```

## How it works

The board has 24 columns and 14 rows. Each move goes up, down, left, or right. Regular squares cost 1 to enter; purple weighted squares cost 5. BFS and DFS don't use weights. Dijkstra and A* minimize the total cost rather than just the number of steps.

The pathfinding functions live in `algorithms.js`, separate from the UI in `app.js`, so they can be tested without opening a browser.

## Files

- `index.html` — page structure
- `styles.css` — layout, grid colors, and mobile styles
- `algorithms.js` — BFS, DFS, Dijkstra, and A*
- `app.js` — drawing, controls, and animation
- `tests/algorithms.test.mjs` — algorithm tests

## Publishing

This is a static site. In the GitHub repository go to **Settings → Pages → Deploy from a branch**, select **main** and **/(root)**.

