const openai = require('openai');

// Set your OpenAI API key
const apiKey = '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';
const client = new openai({ apiKey });

function cleanAnswerChoice(choice) {
    return choice.replace(/^[a-zA-Z]\)\s*/, '');
}

function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
}
}

const generateEvaluation = async (description) => {
  try {
    // Use the OpenAI API to generate a question
    const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo', // You can specify the model you want to use
    messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Generate a multiple-choice question based on the following description (place the correct answer first): ${description}\nQuestion:` },
    ],
      max_tokens: 50,
      temperature: 0.7, // Adjust temperature for response randomness
      n : 4, // Number of answer choices
    });

    console.log( response.choices[0].message.content);

    // Extract the generated message content
    const generatedMessage = response.choices[0].message.content;

    // Split the message into lines
    const lines_original = generatedMessage.split('\n');

    //remove empty lines if any
    lines = lines_original.filter((line) => {
        return line;
    });

    // The first line is the question
    const generatedQuestion = lines[0];

    // The remaining lines are answer choices
    const answerChoices = lines.slice(1).map(cleanAnswerChoice);

    // The correct answer is the first choice (A)
    const correctAnswer = answerChoices[0];
    
    // Shuffle the order of answer choices
    shuffleArray(answerChoices);

    // Create the evaluation object
    const evaluation = {
      question: generatedQuestion,
      responses: answerChoices,
      correct: correctAnswer,
    };

    console.log(evaluation.question);
    console.log(evaluation.responses);
    console.log(evaluation.correct);

    return evaluation;
  } catch (error) {
    console.error('Error generating question:', error);
    return null;
  }
};

// Helper function to shuffle an array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

module.exports = generateEvaluation;
