import React, { useState, useEffect } from 'react';
import api from '../api';

const ApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, name) => {
    setLoading(true);
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await api.get(endpoint);
      console.log(`${name} Success:`, response.data);
      setResults(prev => ({ ...prev, [name]: { success: true, data: response.data } }));
    } catch (error) {
      console.error(`${name} Error:`, error);
      setResults(prev => ({ ...prev, [name]: { success: false, error: error.message, details: error.response?.data } }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test basic endpoints
    testEndpoint('/', 'Health Check');
    testEndpoint('/api/restaurants', 'Restaurants');
  }, []);

  const testAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      testEndpoint('/api/auth/profile', 'Auth Profile');
    } else {
      setResults(prev => ({ ...prev, 'Auth Profile': { success: false, error: 'No token found' } }));
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>API Test Component</h2>
      <p>Check browser console for detailed logs</p>
      
      <button onClick={testAuth} style={{ margin: '10px', padding: '10px' }}>
        Test Auth Profile
      </button>

      <div style={{ marginTop: '20px' }}>
        <h3>Test Results:</h3>
        {Object.entries(results).map(([name, result]) => (
          <div key={name} style={{ 
            margin: '10px 0', 
            padding: '10px', 
            border: `1px solid ${result.success ? 'green' : 'red'}`,
            borderRadius: '5px',
            backgroundColor: result.success ? '#f0fff0' : '#fff0f0'
          }}>
            <strong>{name}:</strong> {result.success ? 'SUCCESS' : 'FAILED'}
            <br />
            {result.error && <span style={{ color: 'red' }}>Error: {result.error}</span>}
            {result.data && (
              <details>
                <summary>Data (click to expand)</summary>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
            {result.details && (
              <details>
                <summary>Error Details (click to expand)</summary>
                <pre style={{ fontSize: '12px', overflow: 'auto', color: 'red' }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {loading && <p>Loading tests...</p>}
    </div>
  );
};

export default ApiTest;
