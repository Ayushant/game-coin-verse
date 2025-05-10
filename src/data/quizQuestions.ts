
import { QuizQuestion } from '@/types/quiz';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "easy"
  },
  {
    id: 2,
    question: "Who painted the Mona Lisa?",
    options: ["Vincent Van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art",
    difficulty: "easy"
  },
  {
    id: 3,
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "medium"
  },
  {
    id: 4,
    question: "Which element has the chemical symbol 'O'?",
    options: ["Osmium", "Oxygen", "Oganesson", "Ornithine"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "easy"
  },
  {
    id: 5,
    question: "Who wrote the play 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1,
    category: "Literature",
    difficulty: "easy"
  },
  {
    id: 6,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: 3,
    category: "Geography",
    difficulty: "easy"
  },
  {
    id: 7,
    question: "Which country is home to the kangaroo?",
    options: ["New Zealand", "Australia", "South Africa", "Brazil"],
    correctAnswer: 1,
    category: "Animals",
    difficulty: "easy"
  },
  {
    id: 8,
    question: "Who is the author of 'To Kill a Mockingbird'?",
    options: ["J.K. Rowling", "Harper Lee", "Stephen King", "Ernest Hemingway"],
    correctAnswer: 1,
    category: "Literature",
    difficulty: "medium"
  },
  {
    id: 9,
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correctAnswer: 2,
    category: "Mathematics",
    difficulty: "easy"
  },
  {
    id: 10,
    question: "Which planet has the most moons?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "medium"
  },
  {
    id: 11,
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "easy"
  },
  {
    id: 12,
    question: "Who painted 'Starry Night'?",
    options: ["Pablo Picasso", "Claude Monet", "Vincent van Gogh", "Leonardo da Vinci"],
    correctAnswer: 2,
    category: "Art",
    difficulty: "medium"
  },
  {
    id: 13,
    question: "Which element has the chemical symbol 'Au'?",
    options: ["Silver", "Gold", "Aluminum", "Argon"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "medium"
  },
  {
    id: 14,
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    category: "Animals",
    difficulty: "easy"
  },
  {
    id: 15,
    question: "What is the square root of 144?",
    options: ["12", "14", "16", "18"],
    correctAnswer: 0,
    category: "Mathematics",
    difficulty: "easy"
  }
];

export const quizConfig = {
  timePerQuestion: 30, // seconds
  rewards: {
    correct: 10,  // +10 coins for correct answer
    hint: -5,     // -5 coins for hint
    skip: -5      // -5 coins for skip
  }
};
