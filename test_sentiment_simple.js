import axios from 'axios';

const testSentiment = async () => {
  console.log('🧪 Testing sentiment analysis...\n');
  
  try {
    const response = await axios.post('http://localhost:5000/sentiment/analyze', {
      text: "This restaurant is amazing! The food was delicious and service was excellent!"
    });
    
    console.log('✅ Success! Response:', response.data);
    console.log(`   Sentiment: ${response.data.sentiment}`);
    console.log(`   Confidence: ${response.data.confidence}`);
    console.log(`   Hybrid Score: ${response.data.hybridScore}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testSentiment();
