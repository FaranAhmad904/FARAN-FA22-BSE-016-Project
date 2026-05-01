// Quick test to check if AI service is working
const testAIService = async () => {
  try {
    console.log('🔍 Testing AI service...');
    
    const response = await fetch('http://localhost:5000/sentiment/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'This restaurant is absolutely amazing!'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Service Working!');
      console.log('📊 Response:', data);
    } else {
      console.log('❌ AI Service Error:', response.status);
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
};

testAIService();
