// auth.js - Frontend authentication utilities

class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
  }

  /**
   * Login user - server handles token storage in HTTP-only cookies
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login result
   */
  async login(username, password) {
    try {
      console.log('Attempting login for user:', username);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ username, password })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (data.success) {
        // Server stores token in HTTP-only cookie, we only store user info
        this.user = {
          username: data.username,
          role: data.role,
          name: data.name
        };
        this.isAuthenticated = true;
        
        // Store only user data (no tokens) in localStorage
        localStorage.setItem('userData', JSON.stringify(this.user));
        
        // Set session for navigation protection
        extendSession();
        
        console.log('Login successful:', this.user);
        console.log('Session extended:', sessionStorage.getItem(SESSION_KEY));
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
   * Logout user - server clears HTTP-only cookie
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies in request
      });

      const data = await response.json();

      // Clear local storage (no tokens to clear)
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('userData');
      sessionStorage.removeItem(SESSION_KEY);

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
      console.log('Checking authentication...');
      const response = await fetch('/api/auth/verify', {
        credentials: 'include' // Include cookies in request
      });

      console.log('Auth response status:', response.status);
      
      if (response.status === 401) {
        console.log('Authentication failed - 401 response');
        this.isAuthenticated = false;
        return false;
      }

      const data = await response.json();
      console.log('Auth response data:', data);

      if (data.success) {
        this.user = data.user;
        this.isAuthenticated = true;
        console.log('Authentication successful:', this.user);
        return true;
      } else {
        console.log('Authentication failed - success: false');
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
   * Add authentication headers to fetch requests
   * @param {Object} options - Fetch options
   * @returns {Object} Updated fetch options
   */
  addAuthHeaders(options = {}) {
    // No need to add Authorization header - server uses HTTP-only cookies
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
          // Clear any stored user data
          this.user = null;
          this.isAuthenticated = false;
          localStorage.removeItem('userData');
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

// Session management for navigation protection
const SESSION_KEY = 'ems_session_active';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Skip authentication check on login page
  if (window.location.pathname === '/login.html' || window.location.pathname === '/') {
    console.log('Login page detected - clearing session');
    sessionStorage.removeItem(SESSION_KEY);
    return; // Don't check auth on login page
  }

  // Add a small delay to ensure cookies are properly set after login
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('Starting authentication check...');
  
  try {
    // First, check if user is authenticated via server
    const isAuth = await authManager.checkAuth();
    
    if (!isAuth) {
      // User is not authenticated, redirect to login
      console.log('User not authenticated - redirecting to login');
      forceLogout();
      return;
    }

    // User is authenticated, check session
    const sessionActive = checkSessionActive();
    if (!sessionActive) {
      // No session but user is authenticated - create new session
      console.log('User authenticated but no session - creating new session');
      extendSession();
    } else {
      // Session exists and user is authenticated - extend session
      console.log('User authenticated with active session - extending session');
      extendSession();
    }

    // Update UI for authenticated user - REMOVED (script.js handles this)
    console.log('User authenticated - UI will be updated by script.js');
    // updateUIForAuthenticatedUser();
  } catch (error) {
    console.error('Authentication check failed:', error);
    // Don't force logout on error, just log it
  }
});

/**
 * Check if the current session is active
 * @returns {boolean} Session status
 */
function checkSessionActive() {
  const sessionData = sessionStorage.getItem(SESSION_KEY);
  if (!sessionData) return false;
  
  try {
    const { timestamp } = JSON.parse(sessionData);
    const now = Date.now();
    const isExpired = (now - timestamp) > SESSION_TIMEOUT;
    
    if (isExpired) {
      console.log('Session expired');
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error parsing session data:', error);
    sessionStorage.removeItem(SESSION_KEY);
    return false;
  }
}

/**
 * Extend the current session
 */
function extendSession() {
  const sessionData = {
    timestamp: Date.now(),
    path: window.location.pathname
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Force logout and redirect to login
 */
function forceLogout() {
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all cookies by setting them to expire
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Clear browser cache for this domain
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
  
  // Redirect to login with cache-busting parameter
  const timestamp = Date.now();
  window.location.replace(`/login.html?t=${timestamp}`);
}

/**
 * Update UI for authenticated user - REMOVED (script.js handles this)
 */
// function updateUIForAuthenticatedUser() {
//   if (authManager.user) {
//     // Update user display
//     const userDisplay = document.getElementById('userRoleDisplay');
//     if (userDisplay) {
//       userDisplay.textContent = authManager.user.username;
//     }
//     
//     // Show/hide elements based on role
//     const adminElements = document.querySelectorAll('.admin-only');
//     const supervisorElements = document.querySelectorAll('.supervisor-only');
//     
//     adminElements.forEach(el => {
//       el.style.display = authManager.user.role === 'admin' ? 'block' : 'none';
//     });
//     
//     supervisorElements.forEach(el => {
//       el.style.display = ['admin', 'supervisor'].includes(authManager.user.role) ? 'block' : 'none';
//     });
//   }
// }

/**
 * Handle logout button click
 */
function handleLogout() {
  authManager.logout().then(() => {
    // Use forceLogout for proper cleanup
    forceLogout();
  });
}

// Enhanced navigation protection
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was loaded from back-forward cache
    console.log('Page loaded from cache - checking authentication');
    // Force a fresh authentication check
    authManager.checkAuth().then(isAuth => {
      if (!isAuth) {
        forceLogout();
      } else {
        extendSession();
      }
    });
  }
});

// Prevent back navigation to protected pages after logout
window.addEventListener('popstate', (event) => {
  console.log('Back/forward navigation detected');
  
  // Check if we're trying to navigate to a protected page
  const protectedPages = [
    '/superadmin-dashboard.html',
    '/users.html',
    '/supervisors.html',
    '/devices.html',
    '/logs.html',
    '/support.html',
    '/super_device_overview.html',
    '/user_device_overview.html',
    '/totaldevicestats.html'
  ];
  
  if (protectedPages.includes(window.location.pathname)) {
    const sessionActive = checkSessionActive();
    if (!sessionActive) {
      console.log('Attempting to access protected page without session - redirecting');
      forceLogout();
      return;
    }
    
    // Double-check authentication
    authManager.checkAuth().then(isAuth => {
      if (!isAuth) {
        console.log('Authentication failed on navigation - redirecting');
        forceLogout();
      }
    });
  }
});

// Prevent access to protected pages via direct URL
window.addEventListener('load', () => {
  const protectedPages = [
    '/superadmin-dashboard.html',
    '/users.html',
    '/supervisors.html',
    '/devices.html',
    '/logs.html',
    '/support.html',
    '/super_device_overview.html',
    '/user_device_overview.html',
    '/totaldevicestats.html'
  ];
  
  if (protectedPages.includes(window.location.pathname)) {
    const sessionActive = checkSessionActive();
    if (!sessionActive) {
      console.log('Direct access to protected page without session - redirecting');
      forceLogout();
    }
  }
});



// Extend session on user activity
let sessionActivityTimer;
function resetSessionTimer() {
  clearTimeout(sessionActivityTimer);
  sessionActivityTimer = setTimeout(() => {
    // Extend session every 5 minutes of activity
    if (authManager.isAuthenticated) {
      extendSession();
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Track user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
  document.addEventListener(event, resetSessionTimer, true);
});

// Prevent page refresh/close without logout - TEMPORARILY DISABLED FOR TESTING
// window.addEventListener('beforeunload', (event) => {
//   if (authManager.isAuthenticated && !isLoggedOut) {
//     // Don't show the dialog, just prevent the action
//     event.preventDefault();
//     event.returnValue = '';
    
//     // Force logout if user tries to close/refresh
//     forceLogout();
//   }
// });

// Prevent page visibility change (tab switching, minimizing)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && authManager.isAuthenticated) {
    // User switched tabs or minimized - extend session
    extendSession();
  }
});

// Periodic authentication check (every 5 minutes) - TEMPORARILY DISABLED FOR TESTING
// setInterval(async () => {
//   if (authManager.isAuthenticated && !isLoggedOut) {
//     const isAuth = await authManager.checkAuth();
//     if (!isAuth) {
//       console.log('Periodic auth check failed - logging out');
//       forceLogout();
//     } else {
//       extendSession();
//     }
//   }
// }, 5 * 60 * 1000); // 5 minutes

// Global logout function for use in other scripts - REMOVED (conflicts with script.js)
// window.logout = handleLogout;

// Global navigation function for use in other scripts - REMOVED (conflicts with script.js)
// window.navigate = function(page) {
//   if (isLoggedOut) {
//     console.log('Blocked navigation after logout');
//     return;
//   }
//   
//   const protectedPages = [
//     '/superadmin-dashboard.html',
//     '/users.html',
//     '/supervisors.html',
//     '/devices.html',
//     '/logs.html',
//     '/support.html',
//     '/super_device_overview.html',
//     '/user_device_overview.html',
//     '/totaldevicestats.html',
//     '/specific_userdevice.html',
//     '/elevatorerror.html',
//     '/register.html',
//     '/register_super.html'
//   ];
//   
//   if (protectedPages.includes(page)) {
//     const sessionActive = checkSessionActive();
//     if (!sessionActive) {
//       console.log('Blocked navigation to protected page without session');
//       forceLogout();
//       return;
//     }
//   }
//   
//   window.location.href = page;
// };

// Export for use in other scripts
window.authManager = authManager;

// Prevent history manipulation after logout
let isLoggedOut = false;

// Override history methods to prevent back navigation after logout
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  if (isLoggedOut) {
    console.log('Blocked pushState after logout');
    return;
  }
  return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
  if (isLoggedOut) {
    console.log('Blocked replaceState after logout');
    return;
  }
  return originalReplaceState.apply(this, args);
};

// Mark as logged out when forceLogout is called
const originalForceLogout = forceLogout;
forceLogout = function() {
  isLoggedOut = true;
  return originalForceLogout();
};

// Reset logout flag on successful login
const originalLogin = authManager.login;
authManager.login = async function(username, password) {
  const result = await originalLogin.call(this, username, password);
  if (result.success) {
    isLoggedOut = false; // Reset logout flag on successful login
  }
  return result;
};
