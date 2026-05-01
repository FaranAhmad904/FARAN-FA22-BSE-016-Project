import axios from 'axios';

// Test sentiment analysis with different review texts
const testSentimentAnalysis = async () => {
  const testTexts = [
    "This restaurant is absolutely amazing! The food was delicious and service was excellent!",
    "Terrible experience. The food was cold and staff was very rude.",
    "It was okay. Nothing special but not bad either.",
    "Great food and wonderful atmosphere!",
    "Poor quality and overpriced."
  ];

  console.log('Testing sentiment analysis...\n');

  for (const text of testTexts) {
    try {
      console.log(`\n🔍 Testing: "${text}"`);
      
      const response = await axios.post('http://localhost:5000/sentiment/analyze', {
        text: text
      });
      
      console.log('📊 Result:', {
        sentiment: response.data.sentiment,
        confidence: response.data.confidence,
        hybridScore: response.data.hybridScore
      });
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n✅ Sentiment analysis testing completed!');
};

// Test deal recommendations
const testDealRecommendations = async () => {
  try {
    console.log('\n🔍 Testing deal recommendations...');
    
    const response = await axios.get('http://localhost:7000/api/deals/recommended');
    
    console.log(`📊 Found ${response.data.length} recommended deals:`);
    
    response.data.forEach((deal, index) => {
      console.log(`\n${index + 1}. ${deal.title}`);
      console.log(`   Restaurant: ${deal.restaurantName} (${deal.restaurantCity})`);
      console.log(`   Price: Rs. ${deal.price}`);
      console.log(`   Hybrid Score: ${deal.hybridScore?.toFixed(2) || '0.00'}`);
      console.log(`   Reviews: ${deal.reviews?.length || 0}`);
      
      if (deal.reviews && deal.reviews.length > 0) {
        const sentiments = deal.reviews.map(r => r.sentiment);
        console.log(`   Sentiments: ${sentiments.join(', ')}`);
      }
    });
    
    console.log('\n✅ Deal recommendations testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing recommendations:', error.response?.data || error.message);
  }
};

// Run both tests
const runAllTests = async () => {
  await testSentimentAnalysis();
  await testDealRecommendations();
};

runAllTests();
