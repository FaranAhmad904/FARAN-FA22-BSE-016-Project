import React, { useState } from "react";
import axios from "axios";

export default function SentimentAnalysis() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const analyze = async () => {
    const res = await axios.post("/api/sentiment/analyze", { text });
    setResult(res.data);
  };

  return (
    <div>
      <h2>Sentiment Analysis</h2>

      <textarea
        placeholder="Enter review..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={analyze}>Analyze</button>

      {result && (
        <div>
          <p>Sentiment: {result.sentiment}</p>
          <p>Confidence: {result.confidence}</p>
          <p>Hybrid Score: {result.hybridScore}</p>
        </div>
      )}
    </div>
  );
}
