// components.js - Dynamic component loader for sidebar and topbar

class ComponentLoader {
  constructor() {
    this.componentsLoaded = false;
  }

  /**
   * Clean up any existing components to prevent duplicates
   */
  cleanupExistingComponents() {
    // Remove any existing topbars
    const existingTopbars = document.querySelectorAll('.topbar');
    existingTopbars.forEach(topbar => topbar.remove());
    
    // Remove any existing sidebars
    const existingSidebars = document.querySelectorAll('.sidebar');
    existingSidebars.forEach(sidebar => sidebar.remove());
    
    console.log('Cleaned up existing components');
  }

  /**
   * Load sidebar and topbar components
   * @param {string} pageTitle - Title to display in the topbar
   * @param {string} currentPage - Current page for active navigation highlighting
   */
  async loadComponents(pageTitle = 'Dashboard', currentPage = '') {
    // Prevent duplicate loading
    if (this.componentsLoaded) {
      console.log('Components already loaded, updating title and nav only');
      this.updatePageTitle(pageTitle);
      this.setActiveNavLink(currentPage);
      return;
    }
    
    // Check if components already exist in DOM
    if (document.querySelector('.sidebar') || document.querySelector('.topbar')) {
      console.log('Components already exist in DOM, skipping load');
      this.componentsLoaded = true;
      this.setupSidebar(currentPage);
      this.setupUserRoleDisplay();
      return;
    }

    try {
      // Load topbar
      const topbarResponse = await fetch('topbar.html');
      const topbarHtml = await topbarResponse.text();
      
      // Load sidebar
      const sidebarResponse = await fetch('sidebar.html');
      const sidebarHtml = await sidebarResponse.text();

      // Clean up any existing components first
      this.cleanupExistingComponents();
      
      // Insert components into the page
      document.body.insertAdjacentHTML('afterbegin', topbarHtml);
      document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

      // Update page title
      this.updatePageTitle(pageTitle);

      // Set up sidebar functionality
      this.setupSidebar(currentPage);

      // Set up user role display
      this.setupUserRoleDisplay();

      this.componentsLoaded = true;
      console.log('Components loaded successfully');
    } catch (error) {
      console.error('Error loading components:', error);
    }
  }

  /**
   * Update the page title in the topbar
   * @param {string} title - New page title
   */
  updatePageTitle(title) {
    const pageTitleElement = document.getElementById('pageTitle');
    if (pageTitleElement) {
      pageTitleElement.textContent = title;
    }
  }

  /**
   * Set up sidebar functionality including role-based display and toggle
   * @param {string} currentPage - Current page for active navigation highlighting
   */
  setupSidebar(currentPage) {
    // Get user role
    let role = null;
    if (window.authManager && window.authManager.user) {
      role = window.authManager.user.role;
    } else {
      role = localStorage.getItem('userRole');
    }

    // Get sidebar elements
    const sidebarNormal = document.getElementById('sidebar-normal');
    const sidebarSupervisor = document.getElementById('sidebar-supervisor');
    const sidebarSuperadmin = document.getElementById('sidebar-superadmin');

    console.log('Setting up sidebar for role:', role);
    console.log('Sidebar elements found:', {
      normal: !!sidebarNormal,
      supervisor: !!sidebarSupervisor,
      superadmin: !!sidebarSuperadmin
    });

    if (sidebarNormal && sidebarSupervisor && sidebarSuperadmin) {
      // Hide all sidebars first
      sidebarNormal.style.display = 'none';
      sidebarSupervisor.style.display = 'none';
      sidebarSuperadmin.style.display = 'none';

      // Show appropriate sidebar based on role
      if (role === 'supervisor') {
        sidebarSupervisor.style.display = '';
        console.log('Showing supervisor sidebar');
      } else if (role === 'superadmin') {
        sidebarSuperadmin.style.display = '';
        console.log('Showing superadmin sidebar');
      } else {
        sidebarNormal.style.display = '';
        console.log('Showing normal sidebar');
      }
    } else {
      console.error('Some sidebar elements not found:', {
        normal: sidebarNormal,
        supervisor: sidebarSupervisor,
        superadmin: sidebarSuperadmin
      });
    }

    // Set up navigation links
    this.setupNavigationLinks();

    // Set up sidebar toggle functionality
    this.setupSidebarToggle();
    
    // Set active navigation link AFTER sidebar is fully set up
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
      this.setActiveNavLink(currentPage);
    }, 100);
  }

  /**
   * Set up navigation links with click handlers
   */
  setupNavigationLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        if (page) {
          // Use navi function for supervisor-specific navigation
          if (window.navi && typeof window.navi === 'function') {
            navi(page);
          } else {
            navigate(page);
          }
        }
      });
    });
  }

  /**
   * Set the active navigation link based on current page
   * @param {string} currentPage - Current page name
   */
  setActiveNavLink(currentPage) {
    // Get user role
    let role = null;
    if (window.authManager && window.authManager.user) {
      role = window.authManager.user.role;
    } else {
      role = localStorage.getItem('userRole');
    }

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to current page link
    if (currentPage) {
      const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }

    // Set active tab based on page hierarchy
    this.setActiveTabByPageHierarchy(currentPage, role);
  }

  /**
   * Set active tab based on page hierarchy
   * This ensures that when navigating between related pages, the correct tab stays active
   * 
   * PAGE HIERARCHY:
   * ===============
   * LOCATION TAB: users.html → user_device_overview.html → specific_userdevice.html
   * SUPERVISOR LOCATION TAB: supervisors.html → super_device_overview.html  
   * LOGS TAB: logs.html
   * SUPPORT TAB: support.html, elevatorerror.html
   * STATISTICS TAB: totaldevicestats.html, superadmin-dashboard.html
   */
  setActiveTabByPageHierarchy(currentPage, role) {
    console.log('Setting active tab for page:', currentPage, 'for role:', role);
  
    // Define which tab each page belongs to
    const pageToTab = {
      // Location tab - Users & Devices flow
      'users.html': 'users.html',
      'user_device_overview.html': 'users.html', 
      'specific_userdevice.html': 'users.html',
      'devices.html': 'devices.html',
      'elevatorerror.html': 'users.html',
      'totaldevicestats.html': 'users.html',
      
      // Supervisor tab - Supervisor flow
      'supervisors.html': 'supervisors.html',
      'super_device_overview.html': 'supervisors.html',
      
      // Logs tab
      'logs.html': 'logs.html',
      
      // Support tab
      'support.html': 'support.html',
     
      // Superadmin tab
      'superadmin-dashboard.html': 'superadmin-dashboard.html',
    };
  
    // Find which navigation link should be active
    const activeNavPage = pageToTab[currentPage];
    console.log('Active nav page:', activeNavPage);
  
    if (activeNavPage) {
      // Select only the sidebar that belongs to the logged-in role
      let sidebarId = 
        role === 'superadmin' ? '#sidebar-superadmin' :
        role === 'supervisor' ? '#sidebar-supervisor' : 
        '#sidebar-normal';
      
      // Remove active class from all nav links inside the correct sidebar only
      const allNavLinks = document.querySelectorAll(`${sidebarId} .nav-link`);
      console.log(`Found nav links in ${sidebarId}:`, allNavLinks.length);
      allNavLinks.forEach(link => {
        link.classList.remove('active');
      });
  
      // Add active class to the correct navigation link inside that sidebar
      const activeNavLink = document.querySelector(`${sidebarId} .nav-link[data-page="${activeNavPage}"]`);
      if (activeNavLink) {
        activeNavLink.classList.add('active');
        console.log(`✅ Active nav link: ${activeNavPage} for page: ${currentPage} (role: ${role})`);
      } else {
        console.warn(`⚠️ Navigation link not found in ${sidebarId} for: ${activeNavPage}`);
        console.log('Available nav links in this sidebar:', 
          Array.from(document.querySelectorAll(`${sidebarId} .nav-link`)).map(l => l.getAttribute('data-page'))
        );
      }
    } else {
      console.warn(`⚠️ No tab mapping found for page: ${currentPage}`);
    }
  }
  

  /**
   * Set up sidebar toggle functionality
   */
  setupSidebarToggle() {
    // Set up toggle functionality for the sidebar
    const sidebarToggles = document.querySelectorAll('#sidebarToggle');
    
    sidebarToggles.forEach(toggle => {
      // Remove any existing event listeners to avoid duplicates
      const newToggle = toggle.cloneNode(true);
      toggle.parentNode.replaceChild(newToggle, toggle);
      
      // Add the toggle event listener
      newToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const sidebar = this.closest('.sidebar');
        if (sidebar) {
          sidebar.classList.toggle('collapsed');
          console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
        }
      });
    });
    
    // Set up mobile menu functionality
    this.setupMobileMenu();
    
    console.log('Sidebar toggle setup completed');
  }

  /**
   * Set up mobile menu functionality
   */
  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebars = document.querySelectorAll('.sidebar');
    
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function() {
        // Toggle mobile-open class on all sidebars
        sidebars.forEach(sidebar => {
          sidebar.classList.toggle('mobile-open');
        });
      });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        const isClickInsideSidebar = e.target.closest('.sidebar');
        const isClickOnMobileMenuBtn = e.target.closest('#mobileMenuBtn');
        
        if (!isClickInsideSidebar && !isClickOnMobileMenuBtn) {
          sidebars.forEach(sidebar => {
            sidebar.classList.remove('mobile-open');
          });
        }
      }
    });
  }



  /**
   * Set up user role display in the topbar
   */
  setupUserRoleDisplay() {
    let role = null;
    let username = null;
    let userIcon = '👤';

    if (window.authManager && window.authManager.user) {
      role = window.authManager.user.role;
      username = window.authManager.user.username;
    } else {
      role = localStorage.getItem('userRole');
      username = localStorage.getItem('userId');
    }

    // Set user icon based on role
    if (role === 'superadmin') {
      userIcon = '👑';
    } else if (role === 'supervisor') {
      userIcon = '🧑‍💼';
    }

    // Update user role display
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const userIconElement = document.getElementById('userIcon');
    
    if (userRoleDisplay) {
      userRoleDisplay.textContent = username || 'User';
    }
    
    if (userIconElement) {
      userIconElement.textContent = userIcon;
    }

    // Set up logout modal functionality
    this.setupLogoutModal();

    // Apply supervisor restrictions if needed
    this.applySupervisorRestrictions();
  }

  /**
   * Set up logout modal functionality
   */
  setupLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancelBtn = document.getElementById('logoutCancelBtn');
    const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');

    if (logoutModal && logoutCancelBtn && logoutConfirmBtn) {
      // Show logout modal when logout link is clicked
      const logoutLinks = document.querySelectorAll('.logout-link');
      logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showLogoutModal();
        });
      });

      // Cancel button - hide modal
      logoutCancelBtn.addEventListener('click', () => {
        this.hideLogoutModal();
      });

      // Confirm button - proceed with logout
      logoutConfirmBtn.addEventListener('click', () => {
        this.performLogout();
      });

      // Close modal when clicking outside
      logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
          this.hideLogoutModal();
        }
      });

      // Close modal with Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && logoutModal.style.display !== 'none') {
          this.hideLogoutModal();
        }
      });
    }
  }

  /**
   * Show logout confirmation modal
   */
  showLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
      logoutModal.style.display = 'flex';
      // Focus on cancel button for accessibility
      const cancelBtn = document.getElementById('logoutCancelBtn');
      if (cancelBtn) {
        cancelBtn.focus();
      }
    }
  }

  /**
   * Hide logout confirmation modal
   */
  hideLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  }

  /**
   * Perform the actual logout
   */
  performLogout() {
    this.hideLogoutModal();
    
    // Use authManager logout if available, otherwise fallback to simple redirect
    if (window.authManager && typeof window.authManager.logout === 'function') {
      window.authManager.logout().then(() => {
        window.location.href = "login.html";
      }).catch(() => {
        window.location.href = "login.html";
      });
    } else {
      // Clear localStorage and redirect
      localStorage.clear();
      window.location.href = "login.html";
    }
  }

  /**
   * Apply supervisor role-based restrictions
   */
  applySupervisorRestrictions() {
    if (window.isSupervisor && window.isSupervisor()) {
      const isLogsPage = /(^|\/)logs\.html(\?|$)/i.test(window.location.pathname);
      if (!isLogsPage) {
        // On non-logs pages, hide or disable action checkboxes for supervisors
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.disabled = true;
          cb.style.display = 'none';
        });
        // Hide or disable edit buttons
        document.querySelectorAll('.edit-user-btn, .edit-device-btn').forEach(btn => {
          btn.disabled = true;
        });
      }
    }
  }
}

// Create global instance
window.componentLoader = new ComponentLoader();

// Helper function to load components on page load
function loadPageComponents(pageTitle, currentPage) {
  if (window.componentLoader) {
    window.componentLoader.loadComponents(pageTitle, currentPage);
  }
}

// Components are now loaded manually by each page using loadPageComponents()
// This prevents duplicate loading and ensures proper initialization order
