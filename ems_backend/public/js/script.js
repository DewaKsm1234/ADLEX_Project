// script.js - Shared navigation and sidebar logic for EMS dashboard

// Navigation helper
function navigate(page) {
  window.location.href = page;
}

// }

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
}
// ... existing code ...
function navi(url) {
  const role = localStorage.getItem('userRole');
  const username = localStorage.getItem('username'); // this is supervisor_id
  if (role === 'supervisor' && url.includes('super_device_overview.html')) {
    if (username) {
      url += `?supervisor_id=${username}`;
    } else {
      alert('Supervisor session expired. Please log in again.');
      window.location.href = 'login.html';
      return;
    }
  }
  // Redirect using final URL
  window.location.href = url;
}


// Sidebar toggle logic for hamburger and arrow
const sidebar = document.getElementById('sidebar-normal');
const sidebarSupervisor = document.getElementById('sidebar-supervisor');
const sidebarArrow = document.getElementById('sidebarArrow');
const sidebarHamburger = document.getElementById('sidebarHamburger');

if (sidebarArrow && sidebar && sidebarHamburger && sidebarSupervisor) {
  sidebarArrow.addEventListener('click', function() {
    sidebar.classList.add('collapsed');
    sidebarSupervisor.classList.add('collapsed');
    sidebarHamburger.style.display = 'block';
  });
  sidebarHamburger.addEventListener('click', function() {
    sidebar.classList.remove('collapsed');
    sidebarSupervisor.classList.remove('collapsed');
    sidebarHamburger.style.display = 'none';
  });
  // Hide hamburger by default if sidebar is visible
  if (!sidebar.classList.contains('collapsed')) {
    sidebarSupervisor.classList.remove('collapsed');
    sidebarHamburger.style.display = 'none';
  }
}
function logout() {
  const confirmLogout = confirm("Are you sure you want to log out?");
  if (confirmLogout) {
    window.location.href = "login.html";
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const role = localStorage.getItem('userRole');
  const sidebarNormal = document.getElementById('sidebar-normal');
  const sidebarSupervisor = document.getElementById('sidebar-supervisor');
  if (sidebarNormal && sidebarSupervisor) {
    if (role === 'supervisor') {
      sidebarSupervisor.style.display = '';
      sidebarNormal.style.display = 'none';
      // Optionally, make page read-only here
    } else {
      sidebarNormal.style.display = '';
      sidebarSupervisor.style.display = 'none';
    }
  }
  console.log('userRole', localStorage.getItem('userRole'));

  // Set up sidebar toggle logic AFTER visibility is set
  const sidebarArrowNormal = document.getElementById('sidebarArrowNormal');
  const sidebarArrowSupervisor = document.getElementById('sidebarArrowSupervisor');
  const sidebarHamburger = document.getElementById('sidebarHamburger');

  // console.log('🔍 DEBUG: Sidebar toggle setup -');
  // console.log('  sidebarArrowNormal found:', !!sidebarArrowNormal);
  // console.log('  sidebarArrowSupervisor found:', !!sidebarArrowSupervisor);
  // console.log('  sidebarHamburger found:', !!sidebarHamburger);
  // console.log('  sidebarArrowNormal element:', sidebarArrowNormal);
  // console.log('  sidebarArrowSupervisor element:', sidebarArrowSupervisor);
  // console.log('  sidebarHamburger element:', sidebarHamburger);

  // Get the active arrow button based on which sidebar is visible
  function getActiveArrowButton() {
    if (sidebarNormal && sidebarNormal.style.display !== 'none' && sidebarArrowNormal) {
      return sidebarArrowNormal;
    }
    if (sidebarSupervisor && sidebarSupervisor.style.display !== 'none' && sidebarArrowSupervisor) {
      return sidebarArrowSupervisor;
    }
    return null;
  }

  const activeArrowButton = getActiveArrowButton();
  console.log('  Active arrow button:', activeArrowButton);

  // if (activeArrowButton) {
  //   console.log('  Active arrow button disabled:', activeArrowButton.disabled);
  //   console.log('  Active arrow button display:', activeArrowButton.style.display);
  //   console.log('  Active arrow button visibility:', activeArrowButton.style.visibility);
  //   console.log('  Active arrow button onclick:', activeArrowButton.onclick);
  //   console.log('  Active arrow button event listeners:', activeArrowButton.onclick ? 'has onclick' : 'no onclick');
  // }

  // if (sidebarHamburger) {
  //   console.log('  sidebarHamburger disabled:', sidebarHamburger.disabled);
  //   console.log('  sidebarHamburger display:', sidebarHamburger.style.display);
  //   console.log('  sidebarHamburger visibility:', sidebarHamburger.style.visibility);
  //   console.log('  sidebarHamburger onclick:', sidebarHamburger.onclick);
  //   console.log('  sidebarHamburger event listeners:', sidebarHamburger.onclick ? 'has onclick' : 'no onclick');
  // }

  function getActiveSidebar() {
    // Only one sidebar is visible at a time
    if (sidebarNormal && sidebarNormal.style.display !== 'none') return sidebarNormal;
    if (sidebarSupervisor && sidebarSupervisor.style.display !== 'none') return sidebarSupervisor;
    return null;
  }

  if (activeArrowButton && sidebarHamburger) {
    console.log('✅ DEBUG: Adding event listeners to sidebar toggle buttons');

    // Test if buttons are clickable
    activeArrowButton.style.pointerEvents = 'auto';
    sidebarHamburger.style.pointerEvents = 'auto';
    console.log('  Set pointer-events to auto for both buttons');

    activeArrowButton.addEventListener('click', function(e) {
      // console.log('🔄 DEBUG: Sidebar arrow clicked!');
      // console.log('  Event:', e);
      // console.log('  Target:', e.target);
      // console.log('  Current target:', e.currentTarget);
      e.preventDefault();
      e.stopPropagation();

      const activeSidebar = getActiveSidebar();
      console.log('  Active sidebar found:', !!activeSidebar);
      if (activeSidebar) {
        // console.log('  Adding collapsed class to:', activeSidebar.id);
        // console.log('  Before - has collapsed class:', activeSidebar.classList.contains('collapsed'));
        activeSidebar.classList.add('collapsed');
        // console.log('  After - has collapsed class:', activeSidebar.classList.contains('collapsed'));
        // console.log('  Sidebar display style:', activeSidebar.style.display);
        // console.log('  Sidebar transform style:', activeSidebar.style.transform);
      }
      //console.log('  Setting hamburger display to block');
      //console.log('  Hamburger before - display:', sidebarHamburger.style.display);
      sidebarHamburger.style.display = 'block';
      //console.log('  Hamburger after - display:', sidebarHamburger.style.display);
      //console.log('  Hamburger computed display:', window.getComputedStyle(sidebarHamburger).display);
    });

    sidebarHamburger.addEventListener('click', function(e) {
      // console.log('🔄 DEBUG: Sidebar hamburger clicked!');
      // console.log('  Event:', e);
      // console.log('  Target:', e.target);
      // console.log('  Current target:', e.currentTarget);
      e.preventDefault();
      e.stopPropagation();

      const activeSidebar = getActiveSidebar();
      console.log('  Active sidebar found:', !!activeSidebar);
      if (activeSidebar) {
        // console.log('  Removing collapsed class from:', activeSidebar.id);
        // console.log('  Before - has collapsed class:', activeSidebar.classList.contains('collapsed'));
        activeSidebar.classList.remove('collapsed');
        // console.log('  After - has collapsed class:', activeSidebar.classList.contains('collapsed'));
        // console.log('  Sidebar display style:', activeSidebar.style.display);
        // console.log('  Sidebar transform style:', activeSidebar.style.transform);
      }
      // console.log('  Setting hamburger display to none');
      // console.log('  Hamburger before - display:', sidebarHamburger.style.display);
      sidebarHamburger.style.display = 'none';
      // console.log('  Hamburger after - display:', sidebarHamburger.style.display);
      // console.log('  Hamburger computed display:', window.getComputedStyle(sidebarHamburger).display);
    });


    // Hide hamburger by default if sidebar is visible
    const activeSidebar = getActiveSidebar();
    console.log('🔍 DEBUG: Initial sidebar state -');
    console.log('  Active sidebar:', activeSidebar ? activeSidebar.id : 'none');
    console.log('  Active sidebar has collapsed class:', activeSidebar ? activeSidebar.classList.contains('collapsed') : 'N/A');

    if (activeSidebar && !activeSidebar.classList.contains('collapsed')) {
      console.log('  Hiding hamburger button (sidebar is visible)');
      sidebarHamburger.style.display = 'none';
    } else {
      console.log('  Showing hamburger button (sidebar is collapsed or not found)');
      sidebarHamburger.style.display = 'block';
    }
  } else {
    console.log('❌ DEBUG: Sidebar toggle buttons not found!');
    console.log('  activeArrowButton:', activeArrowButton);
    console.log('  sidebarHamburger:', sidebarHamburger);
  }
});

function isSupervisor() {
  return localStorage.getItem('userRole') === 'supervisor';
}
document.addEventListener('DOMContentLoaded', function() {
  if (typeof isSupervisor === 'function' && isSupervisor()) {
    // Disable all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      console.log(cb);
      cb.disabled = true;
      cb.style.display = 'none';
    });
    // Hide or disable edit buttons
    document.querySelectorAll('.edit-user-btn, .edit-device-btn ').forEach(btn => {
      btn.disabled = true;
      //btn.style.display = 'none'; 
      // or just disable if you want them visible but not clickable
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const role = localStorage.getItem('userRole');
  const roleDisplay = document.getElementById('userRoleDisplay');
  if (roleDisplay && role) {
    // Capitalize first letter for display
    roleDisplay.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  }
});

//Dark mode Logic
document.getElementById('darkModeToggle').addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  document.documentElement.classList.toggle('dark-mode');
  // Optionally, save preference
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    this.textContent = '☀️';
  } else {
    localStorage.setItem('theme', 'light');
    this.textContent = '🌙';
  }
});

// On page load, set theme from localStorage
document.addEventListener('DOMContentLoaded', function() {
  const theme = localStorage.getItem('theme');
  const btn = document.getElementById('darkModeToggle');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
    if (btn) btn.textContent = '☀️';
  }
});

// XLS export using SheetJS
function downloadXLSFromDevices(devices) {
  if (!devices.length) return;
  const columns = [
    { header: 'Device Name', key: 'device_name' },
    { header: 'Device Id', key: 'DeviceId' },
    { header: 'Serial Number', key: 'SerialNum' },
    { header: 'Address', key: 'address' },
    { header: 'Location', key: 'Location' },
    { header: 'Status', key: 'Status' }
  ];
  // Prepare data rows
  const data = devices.map(dev => ({
    device_name: dev.device_name || '',
    DeviceId: dev.DeviceId || '',
    SerialNum: dev.SerialNum || '',
    address: dev.address || '',
    Location: dev.Location || '',
    Status: dev.Status || ''
  }));
  // SheetJS
  const ws_data = [columns.map(col => col.header), ...data.map(row => columns.map(col => row[col.key]))];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  // Center align all cells
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell) {
        cell.s = cell.s || {};
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        if (R === 0) {
          cell.s.font = { bold: true };
        }
      }
    }
  }
  // Add company name and logo as a title row (SheetJS Community doesn't support images, so just add a title row)
  XLSX.utils.sheet_add_aoa(ws, [["ADLEX - Devices List"]], { origin: 'A1' });
  // Shift data down by 2 rows
  XLSX.utils.sheet_add_aoa(ws, [columns.map(col => col.header)], { origin: 'A3' });
  XLSX.utils.sheet_add_aoa(ws, data.map(row => columns.map(col => row[col.key])), { origin: 'A4' });
  // Merge title row
  ws['!merges'] = ws['!merges'] || [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } });
  ws['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center', vertical: 'center' } };
  // Set column widths
  ws['!cols'] = columns.map(() => ({ wch: 20 }));
  // Create workbook and export
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Devices');
  XLSX.writeFile(wb, 'devices.xlsx');
}
// PDF export using jsPDF + autotable
function downloadPDFfromDevices(devices) {
  if (!devices.length) return;
  const columns = [
    { header: 'Device Name', dataKey: 'device_name' },
    { header: 'Device Id', dataKey: 'DeviceId' },
    { header: 'Serial Number', dataKey: 'SerialNum' },
    { header: 'Address', dataKey: 'address' },
    { header: 'Location', dataKey: 'Location' },
    { header: 'Status', dataKey: 'Status' }
  ];
  const data = devices.map(dev => ({
    device_name: dev.device_name || '',
    DeviceId: dev.DeviceId || '',
    SerialNum: dev.SerialNum || '',
    address: dev.address || '',
    Location: dev.Location || '',
    Status: dev.Status || ''
  }));
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  // Add logo and title
  const img = new Image();
  img.src = 'assets/adlex_logo.png';
  img.onload = function() {
    doc.addImage(img, 'PNG', 15, 10, 30, 20);
    doc.setFontSize(18);
    doc.text('ADLEX - Devices List', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey])),
      startY: 35,
      styles: { halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [0, 123, 255], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { halign: 'center' },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });
    doc.save('devices.pdf');
  };
  // If image fails to load, fallback to no logo
  img.onerror = function() {
    doc.setFontSize(18);
    doc.text('ADLEX - Devices List', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey])),
      startY: 35,
      styles: { halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [0, 123, 255], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { halign: 'center' },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });
    doc.save('devices.pdf');
  };
}
//------------------------------------------------------------------------------------------------------------------------------------
// Help Widget JavaScript
class HelpWidget {  
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.faqData = this.getFAQData();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename || 'index.html';
  }

  getFAQData() {
    return {
      general: [
        {
          question: "How do I add a new device?",
          answer: "Navigate to the Devices page and click the 'Add Device' button. Fill in the required information including device name, ID, serial number, and location."
        },
        {
          question: "How to reset my password?",
          answer: "Contact your system administrator to reset your password. You can also use the 'Forgot Password' option on the login page if available."
        },
        {
          question: "Where can I find device error logs?",
          answer: "Go to the Logs page to view all device error logs. You can filter by device, date range, or error type."
        },
        {
          question: "How to add new users and view stats?",
          answer: "Navigate to the Users page to add new users. Statistics are available on the dashboard and can be exported in various formats."
        }
      ],
      devices: [
        {
          question: "What do device statuses mean?",
          answer: "Active: Device is online and functioning. Inactive: Device is offline or has issues. Mapped: Device is assigned to a location. Unmapped: Device is not yet assigned."
        },
        {
          question: "How to assign a device to a location?",
          answer: "In the Devices page, click on the device row and use the assignment dropdown to select a location."
        },
        {
          question: "How to export device data?",
          answer: "Use the Download button in the Devices page to export data in CSV, XLS, or PDF formats."
        }
      ],
      users: [
        {
          question: "How to create a new user account?",
          answer: "Go to the Users page and click 'Add User'. Fill in the required fields including username, email, and role."
        },
        {
          question: "What are the different user roles?",
          answer: "Admin: Full access to all features. Supervisor: Read-only access to assigned devices. User: Limited access based on permissions."
        },
        {
          question: "How to assign devices to users?",
          answer: "In the Users page, click on a user and use the device assignment feature to link devices to that user."
        }
      ],
      logs: [
        {
          question: "How to filter log entries?",
          answer: "Use the search box and date filters on the Logs page to find specific entries."
        },
        {
          question: "What information is shown in logs?",
          answer: "Logs show device status changes, error messages, user actions, and system events with timestamps."
        }
      ]
    };
  }

  getContextualHelp() {
    const contextualHelp = {
      'devices.html': {
        title: "Device Management Help",
        items: [
          "How to add a new device",
          "Understanding device statuses",
          "Assigning devices to locations",
          "Exporting device data"
        ]
      },
      'users.html': {
        title: "User Management Help",
        items: [
          "Creating new user accounts",
          "Understanding user roles",
          "Assigning devices to users",
          "Managing user permissions"
        ]
      },
      'supervisors.html': {
        title: "Supervisor Management Help",
        items: [
          "Adding new supervisors",
          "Assigning devices to supervisors",
          "Managing supervisor permissions",
          "Viewing supervisor statistics"
        ]
      },
      'logs.html': {
        title: "Log Management Help",
        items: [
          "Understanding log entries",
          "Filtering and searching logs",
          "Exporting log data",
          "Interpreting error messages"
        ]
      },
      'super_device_overview.html': {
        title: "Supervisor Dashboard Help",
        items: [
          "Viewing assigned devices",
          "Understanding device status",
          "Accessing device logs",
          "Getting support"
        ]
      }
    };

    return contextualHelp[this.currentPage] || {
      title: "General Help",
      items: [
        "Navigating the dashboard",
        "Understanding the interface",
        "Getting support",
        "Managing your account"
      ]
    };
  }

  createHelpButton() {
    const button = document.createElement('button');
    button.className = 'help-widget';
    button.innerHTML = '?';
    button.setAttribute('aria-label', 'Help and Support');
    button.title = 'Help & Support';
    
    button.addEventListener('click', () => this.openHelpModal());
    
    return button;
  }

  createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'help-modal-overlay';
    overlay.id = 'helpModalOverlay';
    
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = this.getModalContent();
    
    overlay.appendChild(modal);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeHelpModal();
      }
    });
    
    return overlay;
  }

  getModalContent() {
    const contextualHelp = this.getContextualHelp();
    
    return `
      <div class="help-modal-header">
        <h2 class="help-modal-title">Help & Support Center</h2>
        <button class="help-modal-close" onclick="helpWidget.closeHelpModal()">&times;</button>
      </div>
      <div class="help-modal-content">
        <!-- Search Section -->
        <div class="help-search-section">
          <div class="help-search-box">
            <span class="help-search-icon"></span>
            <input type="text" class="help-search-input" placeholder="Search for help topics..." onkeyup="helpWidget.searchHelp(this.value)">
          </div>
        </div>

        <!-- Contextual Help -->
        <div class="contextual-help">
          <h4>${contextualHelp.title}</h4>
          <ul>
            ${contextualHelp.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <!-- Quick Links -->
        <div class="help-quick-links">
          <a href="#" class="help-quick-link" onclick="helpWidget.showFAQ('general')">
            <span class="help-quick-link-icon">❓</span>
            <span>FAQ</span>
          </a>
          <a href="#" class="help-quick-link" onclick="helpWidget.showFAQ('devices')">
            <span class="help-quick-link-icon"></span>
            <span>Device Help</span>
          </a>
          <a href="#" class="help-quick-link" onclick="helpWidget.showFAQ('users')">
            <span class="help-quick-link-icon"></span>
            <span>User Management</span>
          </a>
          <a href="#" class="help-quick-link" onclick="helpWidget.showFAQ('logs')">
            <span class="help-quick-link-icon"></span>
            <span>Logs Help</span>
          </a>
        </div>

        <!-- FAQ Section -->
        <div class="help-faq-section" id="helpFAQSection">
          <h4>Frequently Asked Questions</h4>
          <div id="helpFAQContent">
            ${this.renderFAQ('general')}
          </div>
        </div>

        <!-- Contact Section -->
        <div class="help-contact-section">
          <h4>Need More Help?</h4>
          <div class="help-contact-item">
            <span class="help-contact-icon"></span>
            <span>Email: india@samsanlabs.com</span>
          </div>
          <div class="help-contact-item">
            <span class="help-contact-icon"></span>
            <span>Phone: +91 895-692-7909</span>
          </div>
          <div class="help-contact-item">
            <span class="help-contact-icon"></span>
            <span>Visit: <a href="support.html" target="_blank">Support Center</a></span>
          </div>
        </div>
      </div>
    `;
  }

  renderFAQ(category) {
    const faqs = this.faqData[category] || this.faqData.general;
    return faqs.map((faq, index) => `
      <div class="help-faq-item">
        <div class="help-faq-question" onclick="helpWidget.toggleFAQ(${index})">
          ${faq.question}
          <button class="help-faq-toggle">▼</button>
        </div>
        <div class="help-faq-answer" id="faq-answer-${index}">
          ${faq.answer}
        </div>
      </div>
    `).join('');
  }

  showFAQ(category) {
    const faqContent = document.getElementById('helpFAQContent');
    if (faqContent) {
      faqContent.innerHTML = this.renderFAQ(category);
    }
  }

  toggleFAQ(index) {
    const answer = document.getElementById(`faq-answer-${index}`);
    const toggle = event.target.querySelector('.help-faq-toggle') || event.target;
    
    if (answer.classList.contains('show')) {
      answer.classList.remove('show');
      toggle.classList.remove('rotated');
    } else {
      answer.classList.add('show');
      toggle.classList.add('rotated');
    }
  }

  searchHelp(query) {
    if (!query.trim()) {
      this.showFAQ('general');
      return;
    }

    const allFAQs = Object.values(this.faqData).flat();
    const filteredFAQs = allFAQs.filter(faq => 
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase())
    );

    const faqContent = document.getElementById('helpFAQContent');
    if (faqContent) {
      faqContent.innerHTML = filteredFAQs.map((faq, index) => `
        <div class="help-faq-item">
          <div class="help-faq-question" onclick="helpWidget.toggleFAQ(${index})">
            ${faq.question}
            <button class="help-faq-toggle">▼</button>
          </div>
          <div class="help-faq-answer" id="faq-answer-${index}">
            ${faq.answer}
          </div>
        </div>
      `).join('');
    }
  }

  openHelpModal() {
    const overlay = document.getElementById('helpModalOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  closeHelpModal() {
    const overlay = document.getElementById('helpModalOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  init() {
    // Add help button to page
    const helpButton = this.createHelpButton();
    document.body.appendChild(helpButton);

    // Add modal to page
    const modal = this.createModal();
    document.body.appendChild(modal);

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeHelpModal();
      }
    });
  }
}

// Initialize help widget
const helpWidget = new HelpWidget();