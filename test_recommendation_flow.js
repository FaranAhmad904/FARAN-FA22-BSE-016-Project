// Test complete sentiment-based recommendation flow
const testRecommendationFlow = async () => {
  console.log('🎯 Testing Complete Recommendation Flow...\n');
  
  const axios = require('axios');
  
  try {
    // Step 1: Test deal recommendations API
    console.log('📡 Step 1: Testing deal recommendations API...');
    
    const recommendationsResponse = await axios.get('http://127.0.0.1:7000/api/deals/recommended');
    
    console.log(`✅ API Response Status: ${recommendationsResponse.status}`);
    console.log(`📊 Found ${recommendationsResponse.data.length} recommended deals`);
    
    if (recommendationsResponse.data.length > 0) {
      console.log('\n🎉 SUCCESS! Recommended deals:');
      recommendationsResponse.data.forEach((deal, index) => {
        console.log(`\n${index + 1}. ${deal.title}`);
        console.log(`   Restaurant: ${deal.restaurantName} (${deal.restaurantCity})`);
        console.log(`   Price: Rs. ${deal.price}`);
        console.log(`   Hybrid Score: ${deal.hybridScore?.toFixed(2) || '0.00'}`);
        console.log(`   Reviews: ${deal.reviews?.length || 0}`);
        
        if (deal.reviews && deal.reviews.length > 0) {
          console.log('   Review Details:');
          deal.reviews.forEach((review, rIndex) => {
            console.log(`     Review ${rIndex + 1}: "${review.comment}"`);
            console.log(`       Sentiment: ${review.sentiment}`);
            console.log(`       Confidence: ${review.confidence}`);
            console.log(`       Hybrid Score: ${review.hybridScore}`);
          });
        }
      });
      
      console.log('\n🌐 Now test in browser:');
      console.log('1. Visit: http://localhost:3000/sentiment-recommendations');
      console.log('2. Should see the above deals displayed');
      console.log('3. Should see hybrid scores and sentiment analysis');
      
    } else {
      console.log('❌ No recommended deals found');
      console.log('🔍 Check Node server console for DEBUG messages');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔥 Node server not running on localhost:7000');
    }
  }
};

testRecommendationFlow();
