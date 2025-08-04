// auth.js - Frontend authentication utilities

class AuthManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
  }

  /**
   * Login user and store authentication data
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login result
   */
  async login(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage (backup)
        this.token = data.token;
        this.user = {
          username: data.username,
          role: data.role,
          name: data.name
        };
        this.isAuthenticated = true;
        
        // Store in localStorage for persistence
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(this.user));
        
        console.log('Login successful:', this.user);
        return { success: true, user: this.user };
      } else {
        console.log('Login failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  /**
   * Logout user and clear authentication data
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies in request
      });

      const data = await response.json();

      // Clear local storage
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');

      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async checkAuth() {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include' // Include cookies in request
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        this.isAuthenticated = false;
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Get stored token (from localStorage as backup)
   * @returns {string|null} JWT token
   */
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  /**
   * Add authentication headers to fetch requests
   * @param {Object} options - Fetch options
   * @returns {Object} Updated fetch options
   */
  addAuthHeaders(options = {}) {
    const token = this.getToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    options.credentials = 'include'; // Always include cookies
    return options;
  }

  /**
   * Make authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async authenticatedFetch(url, options = {}) {
    const authOptions = this.addAuthHeaders(options);
    
    try {
      const response = await fetch(url, authOptions);
      
      // Handle authentication errors
      if (response.status === 401) {
        const data = await response.json();
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
          return null;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Skip authentication check on login page
  if (window.location.pathname === '/login.html' || window.location.pathname === '/') {
    console.log('Login page detected - skipping authentication check');
    return; // Don't check auth on login page
  }

  // Check if user is already authenticated
  const isAuth = await authManager.checkAuth();
  
  if (!isAuth) {
    // Redirect to login if not authenticated
    console.log('User not authenticated - redirecting to login');
    window.location.href = '/login.html';
  } else {
    // User is authenticated, update UI
    console.log('User authenticated - updating UI');
    updateUIForAuthenticatedUser();
  }
});

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  if (authManager.user) {
    // Update user display
    const userDisplay = document.getElementById('userRoleDisplay');
    if (userDisplay) {
      userDisplay.textContent = authManager.user.username;
    }
    
    // Show/hide elements based on role
    const adminElements = document.querySelectorAll('.admin-only');
    const supervisorElements = document.querySelectorAll('.supervisor-only');
    
    adminElements.forEach(el => {
      el.style.display = authManager.user.role === 'admin' ? 'block' : 'none';
    });
    
    supervisorElements.forEach(el => {
      el.style.display = ['admin', 'supervisor'].includes(authManager.user.role) ? 'block' : 'none';
    });
  }
}

/**
 * Handle logout button click
 */
function handleLogout() {
  authManager.logout().then(() => {
    // Redirect to login page
    window.location.href = '/login.html';
  });
}

// Prevent back button after logout
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was loaded from back-forward cache
    window.location.reload();
  }
});

// Export for use in other scripts
window.authManager = authManager;
