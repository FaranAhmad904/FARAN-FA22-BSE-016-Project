// Simple test to check if recommendation API is working
console.log('🧪 Testing Recommendation API...\n');

const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 7000,
  path: '/api/deals/recommended',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  console.log(`✅ Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log(`✅ Response Length: ${jsonData.length} deals`);
      
      if (jsonData.length > 0) {
        console.log('\n🎉 SUCCESS! Found recommended deals:');
        jsonData.slice(0, 2).forEach((deal, index) => {
          console.log(`\n${index + 1}. ${deal.title}`);
          console.log(`   Restaurant: ${deal.restaurantName}`);
          console.log(`   Hybrid Score: ${deal.hybridScore}`);
          console.log(`   Reviews: ${deal.reviews?.length || 0}`);
          
          if (deal.reviews && deal.reviews.length > 0) {
            const positiveReviews = deal.reviews.filter(r => r.sentiment === 'positive');
            console.log(`   Positive Reviews: ${positiveReviews.length}`);
            
            if (positiveReviews.length > 0) {
              console.log('   Positive Review Details:');
              positiveReviews.forEach((review, rIndex) => {
                console.log(`     Review ${rIndex + 1}: "${review.comment}"`);
                console.log(`       Sentiment: ${review.sentiment}`);
                console.log(`       Confidence: ${review.confidence}`);
                console.log(`       Hybrid Score: ${review.hybridScore}`);
              });
            }
          }
        });
        
        console.log('\n🌐 Frontend should now show these deals!');
        console.log('Check browser console for DEBUG messages...');
        
      } else {
        console.log('❌ No recommended deals found');
        console.log('Check Node server console for DEBUG messages...');
      }
      
    } catch (error) {
      console.error('❌ Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('🔥 Node server not running on localhost:7000');
  }
});

req.end();
