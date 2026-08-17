const BASE_URL = '/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('access');

  console.log("TOKEN FROM STORAGE:", token);

  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  console.log("HEADERS SENT:", headers);

  return headers;
};

const request = async (method, path, body = null, isFormData = false) => {
  console.log("REQUEST PATH:", path);

  const headers = getHeaders(isFormData);

  console.log("TOKEN:", localStorage.getItem('access'));
  console.log("HEADERS:", headers);

  const options = { method, headers };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  const data = await res.json().catch(() => ({}));

  console.log("RESPONSE:", data);

  if (!res.ok) throw data;

  return data;
};

// Auth
export const signup = (data) => request('POST', '/signup/', data);
export const login = async (data) => {
  const response = await fetch(`${BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  console.log("LOGIN RESPONSE:", result);

  if (result.access) {
    localStorage.setItem('access', result.access);
    localStorage.setItem('refresh', result.refresh);

    console.log("TOKEN SAVED");
  } else {
    console.log("LOGIN FAILED");
  }

  return result;
};

// Feed
export const getFeed = (page = 1) => request('GET', `/feed/?page=${page}`);

// Posts
export const getAllPosts = () => request('GET', '/posts/');
export const createPost = (formData) => request('POST', '/posts/', formData, true);
export const getUserPosts = (username) => request('GET', `/users/${username}/posts/`);

// Likes
export const likePost = (post_id) => request('POST', '/like/', { post_id });
export const unlikePost = (post_id) => request('POST', '/unlike/', { post_id });

// Comments
export const getComments = (postId) => request('GET', `/posts/${postId}/comments/`);
export const createComment = (postId, text) =>
  request('POST', `/posts/${postId}/comments/create/`, { text });

// Follow
export const followUser = (username) => request('POST', '/follow/', { username });
export const unfollowUser = (username) => request('POST', '/unfollow/', { username });
export const getFollowers = () => request('GET', '/followers/');
export const getFollowing = () => request('GET', '/following/');

// Profile
export const getProfile = (username) => request('GET', `/profile/${username}/`);
export const getMyProfile = () => request('GET', '/my-profile/');
export const updateProfile = (data) => request('PATCH', '/profile/update/', data);
export const uploadProfilePicture = (formData) =>
  request('POST', '/profile/picture/', formData, true);
export const changePassword = (data) => request('PUT', '/change-password/', data);

// Notifications
export const getNotifications = () => request('GET', '/notifications/');
export const markAsRead = (id) => request('POST', `/notifications/${id}/read/`);
export const getUnreadCount = () => request('GET', '/notifications/unread/');

// Search
export const searchUsers = async (query) => {
  try {
    const data = await request('GET', `/search/?search=${query}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("searchUsers error:", err);
    return [];
  }
};
