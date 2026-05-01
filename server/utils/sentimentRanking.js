export const calculateHybridScore = (deal) => {
    const rating = deal.rating || 0;
    const reviews = deal.reviews || [];

    let sentimentImpact = 0;

    reviews.forEach(r => {
        if (r.sentiment === "positive") sentimentImpact += 1;
        if (r.sentiment === "negative") sentimentImpact -= 1;
    });

    const finalScore =
        (rating * 0.5) +
        (sentimentImpact * 0.3) +
        ((deal.views || 0) * 0.1) +
        ((deal.clicks || 0) * 0.1);

    return finalScore;
};
