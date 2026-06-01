/**
 * API Service Layer for GodemarsEmpire2 Social Platform
 * Provides methods to interact with backend API endpoints
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Helper to get stored auth token
function getAuthToken() {
  const userData = localStorage.getItem('userAuthToken');
  return userData ? JSON.parse(userData).access_token : null;
}

// Helper to make authenticated requests
async function fetchWithAuth(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

// ========== POSTS/FEED ==========

export async function getFeed(limit = 20, offset = 0, sort = 'recent') {
  return fetchWithAuth(`/social/feed?limit=${limit}&offset=${offset}&sort=${sort}`);
}

export async function createPost(content, imageUrl = null) {
  return fetchWithAuth('/social/posts', {
    method: 'POST',
    body: JSON.stringify({ content, image_url: imageUrl }),
  });
}

export async function getPost(postId) {
  return fetchWithAuth(`/social/posts/${postId}`);
}

export async function deletePost(postId) {
  return fetchWithAuth(`/social/posts/${postId}`, { method: 'DELETE' });
}

// ========== COMMENTS ==========

export async function addComment(postId, content) {
  return fetchWithAuth(`/social/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId) {
  return fetchWithAuth(`/social/comments/${commentId}`, { method: 'DELETE' });
}

// ========== LIKES ==========

export async function toggleLike(postId = null, commentId = null) {
  if (!postId && !commentId) {
    throw new Error('Either postId or commentId is required');
  }
  return fetchWithAuth('/social/likes', {
    method: 'POST',
    body: JSON.stringify({ post_id: postId, comment_id: commentId }),
  });
}

// ========== COMMUNITIES ==========

export async function getCommunities(limit = 20, offset = 0, sort = 'trending') {
  return fetchWithAuth(`/social/communities?limit=${limit}&offset=${offset}&sort=${sort}`);
}

export async function getUserCommunities() {
  return fetchWithAuth('/social/user/communities');
}

export async function createCommunity(name, description, icon, isPrivate = false) {
  return fetchWithAuth('/social/communities', {
    method: 'POST',
    body: JSON.stringify({ name, description, icon, is_private: isPrivate }),
  });
}

export async function joinCommunity(communityId) {
  return fetchWithAuth(`/social/communities/${communityId}/join`, { method: 'POST' });
}

export async function leaveCommunity(communityId) {
  return fetchWithAuth(`/social/communities/${communityId}/leave`, { method: 'POST' });
}

// ========== USERS/PROFILES ==========

export async function getUserProfile(userId) {
  return fetchWithAuth(`/social/users/${userId}`);
}

export async function updateProfile(firstName, bio, location, website, avatar) {
  return fetchWithAuth('/social/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ first_name: firstName, bio, location, website, avatar }),
  });
}

export async function followUser(userId) {
  return fetchWithAuth(`/social/users/${userId}/follow`, { method: 'POST' });
}

export async function unfollowUser(userId) {
  return fetchWithAuth(`/social/users/${userId}/unfollow`, { method: 'POST' });
}

export async function getUserFollowers(userId, limit = 20, offset = 0) {
  return fetchWithAuth(`/social/users/${userId}/followers?limit=${limit}&offset=${offset}`);
}

// ========== MESSAGING/CONVERSATIONS ==========

export async function getConversations() {
  return fetchWithAuth('/social/conversations');
}

export async function getOrCreateConversation(userId) {
  return fetchWithAuth(`/social/conversations/${userId}`, { method: 'POST' });
}

export async function getConversationMessages(conversationId, limit = 50, offset = 0) {
  return fetchWithAuth(`/social/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`);
}

export async function sendMessage(conversationId, content) {
  return fetchWithAuth(`/social/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ========== AUTHENTICATION ==========

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  return data.data; // Returns { access_token, user }
}

export async function register(email, password, firstName, tenantId = null) {
  const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, first_name: firstName, tenant_id: tenantId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const data = await response.json();
  return data.data; // Returns { access_token, user }
}

export async function getCurrentUser() {
  return fetchWithAuth('/v1/auth/me');
}

export async function logout() {
  try {
    return await fetchWithAuth('/v1/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error (expected if endpoint not available):', err);
  }
}
