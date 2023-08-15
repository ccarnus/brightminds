const generateEvaluation = (description) => {
    const evaluation = {
        question: description + "?",
        responses: ["A","B","C","D"],
        correct: "B" 
    };
    return evaluation;
};

module.exports = generateEvaluation;
