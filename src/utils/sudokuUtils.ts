
// Sudoku generation and validation utilities

export const DIFFICULTY = {
  EASY: { 
    emptyCells: 30, 
    targetTimeSeconds: 300, // 5 minutes
    coins: 5 
  },
  MEDIUM: { 
    emptyCells: 40, 
    targetTimeSeconds: 600, // 10 minutes
    coins: 10 
  },
  HARD: { 
    emptyCells: 50, 
    targetTimeSeconds: 1200, // 20 minutes
    coins: 15 
  }
};

// Generate a full valid Sudoku solution
const generateSolution = (): number[][] => {
  const board: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // Helper to fill the grid with a valid solution
  const fillGrid = (board: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of nums) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              
              if (fillGrid(board)) {
                return true;
              }
              
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  fillGrid(board);
  return board;
};

// Check if placing 'num' at position (row, col) is valid
const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  
  return true;
};

// Check if the current board matches the solution
export const checkSolution = (board: number[][]): boolean => {
  // Check if board is completely filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return false;
    }
  }

  // Check all rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      if (seen.has(board[row][col])) return false;
      seen.add(board[row][col]);
    }
  }

  // Check all columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 9; row++) {
      if (seen.has(board[row][col])) return false;
      seen.add(board[row][col]);
    }
  }

  // Check all 3x3 boxes
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const seen = new Set<number>();
      for (let row = boxRow; row < boxRow + 3; row++) {
        for (let col = boxCol; col < boxCol + 3; col++) {
          if (seen.has(board[row][col])) return false;
          seen.add(board[row][col]);
        }
      }
    }
  }

  return true;
};

// Create a puzzle by removing numbers from a complete solution
const createPuzzleFromSolution = (solution: number[][], emptyCells: number): number[][] => {
  const puzzle = JSON.parse(JSON.stringify(solution));
  const positions: [number, number][] = [];
  
  // Create a list of all positions
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle positions
  shuffleArray(positions);
  
  // Remove digits one by one, making sure the puzzle stays solvable
  for (let i = 0; i < emptyCells && i < positions.length; i++) {
    const [row, col] = positions[i];
    const temp = puzzle[row][col];
    puzzle[row][col] = 0;
    
    // Check if the puzzle still has a unique solution
    // For simplicity, we don't check uniqueness here, but in a real app, you might want to
  }
  
  return puzzle;
};

// Generate a Sudoku puzzle with its solution
export const generateSudoku = (difficulty: keyof typeof DIFFICULTY = "EASY") => {
  const solution = generateSolution();
  const puzzle = createPuzzleFromSolution(solution, DIFFICULTY[difficulty].emptyCells);
  return { puzzle, solution };
};

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
