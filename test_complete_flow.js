import axios from 'axios';

// Comprehensive test of the complete review sentiment flow
const testCompleteFlow = async () => {
  console.log('🧪 Testing Complete Review Sentiment Flow...\n');
  
  try {
    // Step 1: Test AI Service Directly
    console.log('📡 Step 1: Testing AI Service...');
    try {
      const aiResponse = await axios.post('http://127.0.0.1:5000/sentiment/analyze', {
        text: "This restaurant is absolutely amazing! The food was delicious and service was excellent!"
      });
      console.log('✅ AI Service Working:', aiResponse.data);
    } catch (error) {
      console.error('❌ AI Service Error:', error.message);
      console.log('⚠️  Make sure AI service is running on localhost:5000');
      return;
    }
    
    // Step 2: Test Node Server Connection
    console.log('\n📡 Step 2: Testing Node Server...');
    try {
      const serverResponse = await axios.get('http://localhost:7000/api/restaurants');
      console.log(`✅ Node Server Working - Found ${serverResponse.data.length} restaurants`);
    } catch (error) {
      console.error('❌ Node Server Error:', error.message);
      console.log('⚠️  Make sure Node server is running on localhost:7000');
      return;
    }
    
    // Step 3: Test Review Submission (you'll need to replace with actual credentials)
    console.log('\n📝 Step 3: Testing Review Submission...');
    console.log('⚠️  Note: You need to replace with actual login credentials');
    
    // Get first restaurant and deal for testing
    const restaurantsResponse = await axios.get('http://localhost:7000/api/restaurants');
    const restaurant = restaurantsResponse.data[0];
    const deal = restaurant.deals[0];
    
    if (!restaurant || !deal) {
      console.log('❌ No restaurants or deals found for testing');
      return;
    }
    
    console.log(`📍 Testing with: ${restaurant.name} - ${deal.title}`);
    
    // This is where you would normally login and get a token
    console.log('\n🔐 To test review submission:');
    console.log('1. Login to the frontend');
    console.log('2. Navigate to a restaurant/deal page');
    console.log('3. Submit a review with text like "This is amazing!"');
    console.log('4. Check the Node server console for DEBUG messages');
    
    // Step 4: Test Deal Recommendations
    console.log('\n🎯 Step 4: Testing Deal Recommendations...');
    try {
      const recommendationsResponse = await axios.get('http://127.0.0.1:7000/api/deals/recommended');
      console.log(`✅ Found ${recommendationsResponse.data.length} recommended deals`);
      
      if (recommendationsResponse.data.length > 0) {
        console.log('\n📊 Sample Deal Data:');
        recommendationsResponse.data.slice(0, 2).forEach((deal, index) => {
          console.log(`\n${index + 1}. ${deal.title}`);
          console.log(`   Hybrid Score: ${deal.hybridScore?.toFixed(2) || '0.00'}`);
          console.log(`   Reviews: ${deal.reviews?.length || 0}`);
          
          if (deal.reviews && deal.reviews.length > 0) {
            deal.reviews.slice(0, 2).forEach((review, rIndex) => {
              console.log(`   Review ${rIndex + 1}: "${review.comment}"`);
              console.log(`     Sentiment: ${review.sentiment || 'N/A'}`);
              console.log(`     Confidence: ${review.confidence || 'N/A'}`);
              console.log(`     Hybrid Score: ${review.hybridScore || 'N/A'}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('❌ Recommendations Error:', error.message);
    }
    
    console.log('\n✅ Complete Flow Test Summary:');
    console.log('📋 What to check:');
    console.log('  1. AI Service console for DEBUG messages');
    console.log('  2. Node Server console for DEBUG messages');
    console.log('  3. Submit a review manually in frontend');
    console.log('  4. Check database for sentiment values');
    console.log('  5. Check sentiment recommendations page');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
};

testCompleteFlow();
