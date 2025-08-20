# Component System for EMS Dashboard

This document explains the new reusable component system for the EMS dashboard that allows you to load sidebar and topbar components dynamically.

## Overview

The component system consists of:
- `sidebar.html` - Reusable sidebar component with role-based navigation
- `topbar.html` - Reusable topbar component with logo, title, and user info
- `js/components.js` - JavaScript utility to load and manage components

## Features Preserved

✅ **Role-based sidebar functionality** - Different sidebars for normal users, supervisors, and superadmins
✅ **Sidebar toggle logic** - Collapse/expand functionality works exactly as before
✅ **Active navigation highlighting** - Current page is highlighted in the sidebar
✅ **User role display** - Shows correct user icon and name in topbar
✅ **Navigation between pages** - All navigation links work as expected

## How to Use

### For New Pages

1. **Include the required scripts (order matters):**
```html
<script src="js/script.js"></script>
<script src="js/components.js"></script>
```

2. **Initialize components in your page:**
```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    loadPageComponents('Your Page Title', 'your-page.html');
  });
</script>
```

3. **That's it!** All sidebar and topbar functionality is automatically set up.

### Example Page Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="css/style.css" />
  <title>Your Page Title</title>
</head>

<body class="dashboard-body">
  <main class="main-content">
    <!-- Your page content here -->
    <h1>Your Page Content</h1>
  </main>

  <script src="js/script.js"></script>
  <script src="js/components.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      loadPageComponents('Your Page Title', 'your-page.html');
    });
  </script>
</body>
</html>
```

## Migration Guide

### Converting Existing Pages

To convert an existing page to use the component system:

1. **Remove the existing sidebar and topbar HTML** from your page
2. **Keep only the `<main class="main-content">` section**
3. **Add the component scripts** as shown above
4. **Initialize components** with the appropriate title and page name

### Before (Old Way)
```html
<body class="dashboard-body">
  <!-- Topbar/Header -->
  <header class="topbar">
    <!-- ... topbar HTML ... -->
  </header>

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar-superadmin">
    <!-- ... sidebar HTML ... -->
  </aside>

  <main class="main-content">
    <!-- Your content -->
  </main>
</body>
```

### After (New Way)
```html
<body class="dashboard-body">
  <main class="main-content">
    <!-- Your content -->
  </main>

  <script src="js/script.js"></script>
  <script src="js/components.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      loadPageComponents('Your Page Title', 'your-page.html');
    });
  </script>
</body>
```

## Component Details

### Sidebar Component (`sidebar.html`)

Contains three role-based sidebars:
- `sidebar-normal` - For normal users/admins
- `sidebar-supervisor` - For supervisors (read-only access)
- `sidebar-superadmin` - For superadmins (full access)

Each sidebar includes:
- Toggle button with SVG icon
- Navigation links with data-page attributes
- Logout link
- Proper styling and functionality

### Topbar Component (`topbar.html`)

Contains:
- ADLEX logo
- Page title (dynamically updated)
- User role display with appropriate icon
- Responsive layout

### Component Loader (`js/components.js`)

The `ComponentLoader` class handles:
- Loading HTML components via fetch
- Setting up role-based sidebar display
- Configuring navigation links and click handlers
- Setting active navigation highlighting
- Setting up sidebar toggle functionality
- Displaying user information in topbar

## Benefits

1. **DRY Principle** - No more duplicating sidebar/topbar HTML across pages
2. **Consistency** - All pages have identical sidebar and topbar behavior
3. **Maintainability** - Changes to sidebar/topbar only need to be made in one place
4. **Easier Development** - New pages can be created quickly with minimal boilerplate
5. **Preserved Functionality** - All existing features work exactly as before

## Troubleshooting

### Components Not Loading
- Ensure `components.js` is included before calling `loadPageComponents`
- Check browser console for fetch errors
- Verify that `sidebar.html` and `topbar.html` exist in the public directory

### Sidebar Not Showing
- Check that user role is properly set in localStorage or authManager
- Verify that the appropriate sidebar element exists and is visible

### Navigation Not Working
- Ensure `script.js` is loaded (contains the `navigate` function)
- Check that navigation links have proper `data-page` attributes

### Toggle Not Working
- Verify that sidebar toggle buttons have the correct ID (`sidebarToggle`)
- Check that the component loader is setting up event listeners properly
- Ensure `components.js` is loaded before `script.js` in the page

## Files Modified

### New Component Files
- `sidebar.html` - New reusable sidebar component
- `topbar.html` - New reusable topbar component  
- `js/components.js` - New component loader utility
- `example-page.html` - New example page demonstrating the system

### Updated Pages (All now use component system)
- `superadmin-dashboard.html` - Updated to use component system
- `users.html` - Updated to use component system
- `devices.html` - Updated to use component system
- `logs.html` - Updated to use component system
- `supervisors.html` - Updated to use component system
- `support.html` - Updated to use component system
- `elevatorerror.html` - Updated to use component system
- `specific_userdevice.html` - Updated to use component system
- `user_device_overview.html` - Updated to use component system
- `super_device_overview.html` - Updated to use component system
- `totaldevicestats.html` - Updated to use component system

### Cleaned Up Files
- `js/script.js` - Removed duplicate sidebar logic (now handled by component system)

## Future Enhancements

Potential improvements to consider:
- Add support for custom sidebar items per page
- Implement component caching for better performance
- Add support for dynamic page titles based on content
- Create a component builder for custom sidebars
