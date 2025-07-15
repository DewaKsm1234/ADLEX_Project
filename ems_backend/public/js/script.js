// script.js - Shared navigation and sidebar logic for EMS dashboard

// Navigation helper
function navigate(page) {
  window.location.href = page;
}

// // Highlight current link in sidebar
// window.onload = () => {
//   const links = document.querySelectorAll(".nav-link");
//   links.forEach(link => {
//     if (window.location.href.includes(link.getAttribute("onclick").split("'")[1])) {
//       link.classList.add("active");
//     }
//   });

//   // if (document.getElementById("user-table-body")) populateUserTable();
// };

// //password toggle logic
// function loginUser(event) {
//   event.preventDefault();
//   //Validation to be done here
//   window.location.href = "dashboard.html";
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

// // ✅ Fetch user data from backend JSON
// async function populateUserTable() {
//   const tbody = document.getElementById("user-table-body");
//   tbody.innerHTML = "";

//   try {
//     const response = await fetch("/api/users");
//     let users = await response.json();
//     // Filter out users with missing name
//     users = users.filter(user => user && user.name);

//     users.forEach(user => {
//       const row = document.createElement("tr");
//       row.innerHTML = `
//         <td><input type="checkbox" /></td>
//         <td>${user.name}</td>
//         <td><a href="devices.html">${user.devices}</a></td>
//         <td>${user.supervisor}</td>
//       `;
//       tbody.appendChild(row);
//     });
//   } catch (error) {
//     console.error("Error loading users:", error);
//   }
// }
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
    });
    // Hide or disable edit buttons
    document.querySelectorAll('.edit-user-btn, .edit-device-btn').forEach(btn => {
      btn.disabled = true;
      //btn.style.display = 'none'; 
      // or just disable if you want them visible but not clickable
    });
  }
});