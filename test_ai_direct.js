import axios from 'axios';

// Direct test of AI service to identify the exact issue
const testDirect = async () => {
  console.log('🔍 Testing AI service directly...\n');
  
  try {
    console.log('📡 Sending request to AI service...');
    
    const response = await axios.post('http://localhost:5000/sentiment/analyze', {
      text: "This restaurant is absolutely amazing! The food was delicious and service was excellent!"
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ AI Service Response:');
    console.log('📊 Full response:', response.data);
    console.log(`\n🎯 Key values:`);
    console.log(`   Sentiment: ${response.data.sentiment}`);
    console.log(`   Confidence: ${response.data.confidence}`);
    console.log(`   Hybrid Score: ${response.data.hybridScore}`);
    
    if (response.data.error) {
      console.log(`   Error: ${response.data.error}`);
    }
    
    // Test with different text
    console.log('\n📡 Testing with negative text...');
    
    const negResponse = await axios.post('http://localhost:5000/sentiment/analyze', {
      text: "Terrible experience. The food was cold and staff was very rude."
    });
    
    console.log('✅ Negative test response:');
    console.log(`   Sentiment: ${negResponse.data.sentiment}`);
    console.log(`   Confidence: ${negResponse.data.confidence}`);
    console.log(`   Hybrid Score: ${negResponse.data.hybridScore}`);
    
  } catch (error) {
    console.error('❌ Error testing AI service:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   Request failed - AI service may not be running');
    } else {
      console.error('   Message:', error.message);
    }
  }
};

testDirect();
