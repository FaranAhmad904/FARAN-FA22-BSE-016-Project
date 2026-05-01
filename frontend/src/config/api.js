const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Restaurants
  RESTAURANTS: `${API_BASE_URL}/api/restaurants`,
  
  // User favorites
  FAVORITES: `${API_BASE_URL}/api/user/favorites`,
  
  // Analytics
  ANALYTICS_VIEW: `${API_BASE_URL}/api/analytics/view`,
  ANALYTICS_CLICK: `${API_BASE_URL}/api/analytics/click`,
  
  // Manager
  MANAGER_ANALYTICS: `${API_BASE_URL}/api/manager/analytics`,
  MANAGER_RESTAURANT: `${API_BASE_URL}/api/manager/restaurant`,
  MANAGER_DEALS: `${API_BASE_URL}/api/manager/deals`,
  MANAGER_UPLOAD_IMAGE: `${API_BASE_URL}/api/manager/upload-image`,
  
  // Subscriptions
  SUBSCRIPTION_PLANS: `${API_BASE_URL}/api/subscriptions/plans`,
  SUBSCRIPTION_MY: `${API_BASE_URL}/api/subscriptions/my-subscription`,
  SUBSCRIPTION_SUBSCRIBE: `${API_BASE_URL}/api/subscriptions/subscribe`,
  
  // AI Recommendations
  DEALS_RECOMMENDED: `${API_BASE_URL}/api/deals/recommended`,
  
  // AI Service (if separate)
  AI_INSIGHTS: `${API_BASE_URL}/api/manager/ai-insights`
};

export const IMAGE_BASE_URL = API_BASE_URL;
