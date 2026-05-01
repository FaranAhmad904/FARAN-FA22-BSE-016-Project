import axios from 'axios';

// Test the sentiment analysis endpoint
const testSentimentAnalysis = async () => {
  try {
    console.log('Testing sentiment analysis endpoint...');
    
    const testTexts = [
      "This restaurant is amazing! The food was delicious and the service was excellent.",
      "Terrible experience. The food was cold and the staff was rude.",
      "It was okay. Nothing special but not bad either."
    ];

    for (const text of testTexts) {
      console.log(`\nTesting: "${text}"`);
      
      try {
        const response = await axios.post('http://localhost:5000/sentiment/analyze', {
          text: text
        });
        
        console.log('Result:', response.data);
      } catch (error) {
        console.error('Error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

// Test the Node.js proxy endpoint
const testNodeProxy = async () => {
  try {
    console.log('\n\nTesting Node.js proxy endpoint...');
    
    const response = await axios.post('http://localhost:7000/api/sentiment/analyze', {
      text: "Great food and wonderful atmosphere!"
    });
    
    console.log('Proxy result:', response.data);
  } catch (error) {
    console.error('Proxy test failed:', error.response?.data || error.message);
  }
};

// Run tests
testSentimentAnalysis().then(() => {
  testNodeProxy();
  console.log('\n✅ Sentiment analysis tests completed!');
});
