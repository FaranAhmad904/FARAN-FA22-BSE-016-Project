export const calculateSentimentStats = (reviews) => {
    let positive = 0, negative = 0, neutral = 0;

    reviews.forEach(r => {
        if (r.sentiment === "positive") positive++;
        else if (r.sentiment === "negative") negative++;
        else neutral++;
    });

    return { positive, negative, neutral };
};
