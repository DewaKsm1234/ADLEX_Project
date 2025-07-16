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