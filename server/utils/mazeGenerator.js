/**
 * Generates a random maze using Recursive Backtracking algorithm
 * 
 * How it works:
 * 1. Start with a grid of all walls
 * 2. Pick a random starting cell and mark it as a path
 * 3. Use a stack to track current path
 * 4. While stack has cells:
 *    - Look at neighbors of current cell
 *    - If unvisited neighbors exist, pick one randomly
 *    - Remove wall between current and chosen neighbor
 *    - Mark neighbor as visited and add to stack
 *    - If no unvisited neighbors, backtrack (pop from stack)
 * 5. Result: Perfect maze with one path between any two points
 * 
 * @param {number} width - Maze width (will be adjusted to odd number)
 * @param {number} height - Maze height (will be adjusted to odd number)
 * @param {string} seed - Optional seed for reproducible mazes (not implemented yet)
 * @returns {object} { layout: 2D array, seed: string, width: number, height: number }
 */
function generateMaze(width, height, seed = null) {
    // Generate or use provided seed for potential maze reproduction
    const mazeSeed = seed || Date.now().toString();
    
    // Ensure odd dimensions for proper maze generation
    // Odd numbers ensure walls and paths alternate correctly
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;
    
    // Initialize grid with all walls (1 = wall, 0 = path)
    const maze = Array(height).fill(null)
        .map(() => Array(width).fill(1));
    
    // Stack for depth-first search (stores cells we can backtrack to)
    const stack = [];
    
    // Start position (1,1) ensures we start in a valid cell
    const start = { x: 1, y: 1 };
    maze[start.y][start.x] = 0; // Mark starting cell as path
    stack.push(start);
    
    // Four possible directions to move (up, right, down, left)
    // Move by 2 cells to maintain wall-path-wall-path pattern
    const directions = [
        { dx: 0, dy: -2 }, // Up
        { dx: 2, dy: 0 },  // Right
        { dx: 0, dy: 2 },  // Down
        { dx: -2, dy: 0 }  // Left
    ];
    
    // Main maze generation loop - continues until stack is empty
    while (stack.length > 0) {
        // Get current cell (peek at top of stack)
        const current = stack[stack.length - 1];
        const neighbors = [];
        
        // Check all four directions for unvisited neighbors
        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            
            // Check if neighbor is within bounds and unvisited (still a wall)
            if (nx > 0 && nx < width - 1 && 
                ny > 0 && ny < height - 1 && 
                maze[ny][nx] === 1) {
                neighbors.push({ x: nx, y: ny, dx: dir.dx, dy: dir.dy });
            }
        }
        
        // If there are unvisited neighbors
        if (neighbors.length > 0) {
            // Choose a random neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Remove wall between current cell and chosen neighbor
            // Wall is exactly halfway between the two cells
            const wallX = current.x + next.dx / 2;
            const wallY = current.y + next.dy / 2;
            maze[wallY][wallX] = 0;
            
            // Mark neighbor as visited (make it a path)
            maze[next.y][next.x] = 0;
            
            // Add neighbor to stack (we can now explore from here)
            stack.push({ x: next.x, y: next.y });
        } else {
            // No unvisited neighbors - backtrack by removing current cell from stack
            stack.pop();
        }
    }
    
    // Create entrance and exit for the maze
    maze[1][0] = 0; // Entrance on left side
    maze[height - 2][width - 1] = 0; // Exit on right side
    
    // Return maze data
    return {
        layout: maze,  // 2D array of 0s (paths) and 1s (walls)
        seed: mazeSeed, // Seed used (for potential reproduction)
        width,
        height
    };
}

module.exports = { generateMaze };
