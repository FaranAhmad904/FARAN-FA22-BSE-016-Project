// Copy and paste this in browser console on the sentiment-recommendations page
console.log('🔍 Testing API call from browser...');

fetch('/api/deals/recommended')
  .then(response => {
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ Response Data:', data);
    console.log('✅ Data Length:', data.length);
    
    if (data.length > 0) {
      console.log('🎉 SUCCESS! API returns deals but frontend not rendering them');
      console.log('🔍 Check React state or rendering logic');
    } else {
      console.log('❌ API returns empty array - backend filtering issue');
    }
  })
  .catch(error => {
    console.error('❌ API call failed:', error);
    console.log('🔥 This is why frontend shows no deals!');
  });
