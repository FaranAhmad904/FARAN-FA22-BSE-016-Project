// Test the exact same flow as review controller
const testReviewFlow = async () => {
  console.log('🧪 Testing Exact Review Flow...\n');
  
  const axios = require('axios');
  
  try {
    // Test the exact same request as review controller
    console.log('📡 Making exact same request as review controller...');
    
    const response = await axios.post('http://127.0.0.1:5000/sentiment/analyze', {
      text: "This was amazing!"
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', response.data);
    
    // Check if we have the expected values
    if (response.data.sentiment && response.data.confidence > 0 && response.data.hybridScore !== 0) {
      console.log('🎯 SUCCESS! Sentiment analysis working correctly!');
      console.log(`   Sentiment: ${response.data.sentiment}`);
      console.log(`   Confidence: ${response.data.confidence}`);
      console.log(`   Hybrid Score: ${response.data.hybridScore}`);
    } else {
      console.log('❌ ISSUE: Values are still zero or missing');
      console.log('   Full response:', JSON.stringify(response.data, null, 2));
    }
    
    // Now test what happens when we save this to database
    console.log('\n📊 Testing database save simulation...');
    const simulatedReview = {
      userId: 'test-user-id',
      rating: 5,
      comment: "This was amazing!",
      sentiment: response.data.sentiment,
      confidence: response.data.confidence,
      hybridScore: response.data.hybridScore,
      createdAt: new Date()
    };
    
    console.log('📝 Simulated review to be saved:', simulatedReview);
    
    // Test deal recommendations
    console.log('\n🎯 Testing deal recommendations...');
    try {
      const recommendationsResponse = await axios.get('http://localhost:7000/api/deals/recommended');
      console.log(`📊 Found ${recommendationsResponse.data.length} recommended deals`);
      
      if (recommendationsResponse.data.length > 0) {
        const firstDeal = recommendationsResponse.data[0];
        console.log('🔍 First recommended deal:');
        console.log(`   Title: ${firstDeal.title}`);
        console.log(`   Hybrid Score: ${firstDeal.hybridScore}`);
        console.log(`   Reviews: ${firstDeal.reviews?.length || 0}`);
        
        if (firstDeal.reviews && firstDeal.reviews.length > 0) {
          const firstReview = firstDeal.reviews[0];
          console.log('📝 First review in deal:');
          console.log(`   Comment: "${firstReview.comment}"`);
          console.log(`   Sentiment: ${firstReview.sentiment}`);
          console.log(`   Confidence: ${firstReview.confidence}`);
          console.log(`   Hybrid Score: ${firstReview.hybridScore}`);
        }
      }
    } catch (error) {
      console.error('❌ Recommendations test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔥 CRITICAL: AI service not running!');
    }
  }
};

testReviewFlow();
