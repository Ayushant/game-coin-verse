
export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer in options array
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizCoinRewards {
  correct: number;
  hint: number;
  skip: number;
}

export interface QuizGameConfig {
  timePerQuestion: number; // In seconds
  questions: QuizQuestion[];
  rewards: QuizCoinRewards;
}
