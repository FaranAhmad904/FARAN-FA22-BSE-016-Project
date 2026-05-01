import axios from 'axios';

// Test the complete review submission flow with sentiment analysis
const testReviewSubmission = async () => {
  console.log('🧪 Testing review submission with sentiment analysis...\n');
  
  try {
    // First, get a token (you'll need to replace with actual login)
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:7000/api/auth/login', {
      email: 'test@example.com', // Replace with actual user
      password: 'password123'      // Replace with actual password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Find a restaurant and deal to review
    console.log('\n🔍 Finding restaurants...');
    const restaurantsResponse = await axios.get('http://localhost:7000/api/restaurants');
    const restaurant = restaurantsResponse.data[0];
    
    if (!restaurant) {
      console.log('❌ No restaurants found');
      return;
    }
    
    const deal = restaurant.deals[0];
    if (!deal) {
      console.log('❌ No deals found');
      return;
    }
    
    console.log(`📍 Found: ${restaurant.name} - ${deal.title}`);
    
    // Test different review sentiments
    const testReviews = [
      {
        rating: 5,
        comment: "This restaurant is absolutely amazing! The food was delicious and service was excellent!"
      },
      {
        rating: 2,
        comment: "Terrible experience. The food was cold and staff was very rude."
      },
      {
        rating: 3,
        comment: "It was okay. Nothing special but not bad either."
      }
    ];
    
    for (let i = 0; i < testReviews.length; i++) {
      const review = testReviews[i];
      
      console.log(`\n📝 Submitting review ${i + 1}: "${review.comment}"`);
      
      try {
        const response = await axios.post(
          `http://localhost:7000/api/user/reviews/${restaurant._id}/${deal._id}`,
          {
            rating: review.rating,
            comment: review.comment
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Review submitted successfully');
        console.log(`   Response:`, response.data);
        
      } catch (error) {
        console.error('❌ Error submitting review:', error.response?.data || error.message);
      }
      
      // Wait a moment between reviews
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Now test deal recommendations to see if sentiment analysis worked
    console.log('\n🎯 Testing deal recommendations...');
    const recommendationsResponse = await axios.get('http://localhost:7000/api/deals/recommended');
    
    console.log(`📊 Found ${recommendationsResponse.data.length} recommended deals:`);
    
    recommendationsResponse.data.forEach((deal, index) => {
      console.log(`\n${index + 1}. ${deal.title}`);
      console.log(`   Hybrid Score: ${deal.hybridScore?.toFixed(2) || '0.00'}`);
      console.log(`   Reviews: ${deal.reviews?.length || 0}`);
      
      if (deal.reviews && deal.reviews.length > 0) {
        deal.reviews.forEach((review, rIndex) => {
          console.log(`   Review ${rIndex + 1}: "${review.comment}"`);
          console.log(`     Sentiment: ${review.sentiment || 'N/A'}`);
          console.log(`     Confidence: ${review.confidence || 'N/A'}`);
          console.log(`     Hybrid Score: ${review.hybridScore || 'N/A'}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test:', error.response?.data || error.message);
  }
  
  console.log('\n✅ Review submission test completed!');
};

// Run the test
testReviewSubmission();
