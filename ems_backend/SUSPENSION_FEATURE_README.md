# Admin Suspension Feature

## Overview
This feature allows superadmins to suspend admin users instead of deleting them, with the ability to reassign their supervisors to other active admins. This provides better data integrity and allows for temporary suspension rather than permanent deletion.

## Database Changes

### New Fields Added
1. **admins table**: Added `status` field (enum: 'active', 'suspended')
2. **users_login table**: Added `status` field (enum: 'active', 'suspended')
3. **supervisors table**: Added `admin_id` field to track which admin supervises each supervisor

### SQL Script
Run the `add_suspension_support.sql` script to add the necessary database fields:

```sql
-- Add status field to admins table
ALTER TABLE `admins` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `phone`;

-- Add status field to users_login table
ALTER TABLE `users_login` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `role`;

-- Add admin_id field to supervisors table
ALTER TABLE `supervisors` ADD COLUMN `admin_id` varchar(50) DEFAULT NULL AFTER `phone`;

-- Add indexes for better performance
CREATE INDEX `idx_supervisors_admin_id` ON `supervisors` (`admin_id`);
CREATE INDEX `idx_admins_status` ON `admins` (`status`);
CREATE INDEX `idx_users_login_status` ON `users_login` (`status`);
```

## New API Endpoints

### 1. Suspend Admin
**POST** `/api/admins/:id/suspend`

Suspends an admin and optionally reassigns their supervisors to another admin.

**Request Body:**
```json
{
  "newAdminId": "admin_username" // Optional: admin to reassign supervisors to
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin suspended successfully and supervisors reassigned to admin_username"
}
```

### 2. Reactivate Admin
**POST** `/api/admins/:id/reactivate`

Reactivates a suspended admin.

**Response:**
```json
{
  "success": true,
  "message": "Admin reactivated successfully"
}
```

### 3. Get Available Admins
**GET** `/api/admins/available`

Returns a list of active admins for supervisor reassignment.

**Response:**
```json
{
  "success": true,
  "admins": [
    {
      "admin_id": "admin1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  ]
}
```

## Frontend Changes

### UI Updates
1. **Status Column**: Added a new "Status" column to the admin table showing "Active" or "Suspended"
2. **Action Buttons**: 
   - "Suspend" button for active admins
   - "Reactivate" button for suspended admins
   - Removed "Delete" button

### Suspend Modal
The suspend modal includes:
- Admin information display
- Radio buttons for supervisor reassignment options:
  - Reassign to another admin
  - Leave supervisors unassigned
- Dropdown to select the target admin
- List of supervisors that will be reassigned

### Status Badges
- **Active**: Green badge with "Active" text
- **Suspended**: Red badge with "Suspended" text

## Authentication Changes

### Login Protection
Suspended users cannot log in and will receive an error message:
```
"Your account has been suspended. Please contact the administrator."
```

## Transaction Safety

All suspend/reactivate operations use database transactions to ensure data consistency:
- If any part of the operation fails, all changes are rolled back
- Supervisors are reassigned atomically with admin suspension
- Both `admins` and `users_login` tables are updated in the same transaction

## Usage Workflow

1. **Suspend Admin**:
   - Click "Suspend" button on an active admin
   - Choose supervisor reassignment option
   - Select target admin if reassigning
   - Confirm suspension

2. **Reactivate Admin**:
   - Click "Reactivate" button on a suspended admin
   - Confirm reactivation

3. **View Status**:
   - Status column shows current admin status
   - Suspended admins are visually distinct

## Benefits

1. **Data Preservation**: Admin data is preserved for audit trails
2. **Temporary Suspension**: Admins can be temporarily suspended and reactivated
3. **Supervisor Management**: Supervisors can be reassigned to maintain operational continuity
4. **Transaction Safety**: All operations are atomic and safe
5. **User Experience**: Clear visual indicators and intuitive workflow

## Security Considerations

1. **Authentication**: Suspended users cannot authenticate
2. **Authorization**: Only superadmins can suspend/reactivate admins
3. **Data Integrity**: All operations use transactions
4. **Audit Trail**: Status changes are tracked in the database
