// Test if AI service is accessible from Node server
const testAIService = async () => {
  console.log('🔍 Testing AI Service Accessibility...\n');
  
  try {
    // Test 1: Direct connection
    console.log('📡 Test 1: Direct connection to AI service...');
    const response1 = await fetch('http://localhost:5000/sentiment/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: "This food was amazing!"
      })
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Direct test successful:', data1);
    } else {
      console.log('❌ Direct test failed:', response1.status, response1.statusText);
    }
    
    // Test 2: Simulate Node server call (same as review controller)
    console.log('\n📡 Test 2: Simulating Node server call...');
    const axios = require('axios');
    
    try {
      const response2 = await axios.post('http://127.0.0.1:5000/sentiment/analyze', {
        text: "This food was amazing!"
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Axios test successful:', response2.data);
      
      // Test 3: Check if values are non-zero
      if (response2.data.confidence > 0 && response2.data.hybridScore !== 0) {
        console.log('🎯 SUCCESS: Sentiment analysis working correctly!');
        console.log(`   Sentiment: ${response2.data.sentiment}`);
        console.log(`   Confidence: ${response2.data.confidence}`);
        console.log(`   Hybrid Score: ${response2.data.hybridScore}`);
      } else {
        console.log('❌ ISSUE: Values are still zero or missing');
        console.log('   Response:', response2.data);
      }
      
    } catch (error) {
      console.error('❌ Axios test failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('🔥 CRITICAL: AI service not running or not accessible');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAIService();
