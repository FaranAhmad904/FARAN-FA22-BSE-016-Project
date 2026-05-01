// Test the exact same API call that the frontend makes
const testFrontendAPI = async () => {
  console.log('🧪 Testing Frontend API Call...\n');
  
  try {
    // Test the exact same URL the frontend uses
    console.log('📡 Making request to /api/deals/recommended (same as frontend)...');
    
    const response = await fetch('/api/deals/recommended');
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Response Data Length:', data.length);
    console.log('✅ Sample Deal:', data[0]);
    
    if (data.length > 0) {
      console.log('\n🎉 SUCCESS! Frontend API call works!');
      console.log('🔍 Issue might be in frontend rendering logic...');
    } else {
      console.log('❌ No deals returned - backend filtering issue');
    }
    
  } catch (error) {
    console.error('❌ Frontend API call failed:', error.message);
    console.log('🔥 This explains why frontend shows no deals!');
  }
};

// Run in browser context
if (typeof window !== 'undefined') {
  testFrontendAPI();
} else {
  console.log('❌ This test must be run in browser console');
}
