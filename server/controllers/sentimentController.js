import axios from 'axios';

export const analyzeSentiment = async (req, res) => {
    try {
        const { text } = req.body;

        const response = await axios.post('http://localhost:5000/sentiment/analyze', {
            text
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Sentiment analysis failed" });
    }
};
