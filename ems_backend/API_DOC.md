# EMS Backend API & Routing Documentation

## 1. API Endpoint Functionality

| Method | Path                                         | Purpose/Functionality                                                                 | Input (req)                | Output (res)                |
|--------|----------------------------------------------|---------------------------------------------------------------------------------------|----------------------------|-----------------------------|
| POST   | /api/login                                   | User authentication                                                                  | { username, password }     | { success, role, username } |
| POST   | /api/register                                | Register a new user                                                                  | user info, device, supervisor | { success }                 |
| GET    | /api/users                                   | Get all users (with supervisor info)                                                 | -                          | [users]                     |
| POST   | /api/assign-supervisor                       | Assign a supervisor to a user                                                        | { username, supervisor_id }| { success }                 |
| POST   | /api/assign-device                           | Assign a device to a user                                                            | { username, tb_device_id } | { success }                 |
| GET    | /api/user-devices/:username                  | Get all devices for a specific user                                                  | :username                  | [devices]                   |
| GET    | /api/unassigned-devices                      | Get all devices not assigned to any user                                             | -                          | [devices]                   |
| POST   | /api/register-supervisor                     | Register a new supervisor                                                            | supervisor info            | { success }                 |
| GET    | /api/supervisors                             | Get all supervisors                                                                  | -                          | [supervisors]               |
| GET    | /api/supervisors-summary                     | Get summary of supervisors (users/devices count)                                     | -                          | [summary]                   |
| GET    | /api/supervisor-users-devices/:supervisor_id | Get all users and devices for a supervisor                                           | :supervisor_id             | [users+devices]             |
| POST   | /api/device/:tb_device_id/sync-telemetry     | Sync telemetry for a device from ThingsBoard                                         | :tb_device_id              | telemetry data              |
| POST   | /api/sync-thingsboard-devices                | Sync all devices from ThingsBoard                                                    | -                          | { success, count }          |
| GET    | /api/user-devices-details/:username          | Get detailed device info for a user                                                  | :username                  | [device details]            |

---

## 2. API to HTML Page Mapping

| HTML Page                  | APIs Used                                                                                 | Purpose/Usage                                                                                  |
|----------------------------|------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| login.html                 | POST /api/login                                                                          | Authenticates user and redirects based on role                                                 |
| register.html              | GET /api/unassigned-devices, POST /api/register, GET /api/supervisors                    | Shows available devices, supervisors, and registers new user                                   |
| register_super.html        | POST /api/register-supervisor                                                             | Registers a new supervisor                                                                    |
| users.html                 | GET /api/users, POST /api/assign-supervisor, POST /api/assign-device                     | Lists users, assigns supervisors/devices                                                      |
| user_device_overview.html  | GET /api/user-devices/:username, GET /api/user-devices-details/:username                 | Shows all devices for a user, with details                                                    |
| specific_userdevice.html   | GET /api/user-devices-details/:username, POST /api/device/:tb_device_id/sync-telemetry   | Shows details and telemetry for a specific device                                             |
| supervisors.html           | GET /api/supervisors, GET /api/supervisors-summary                                       | Lists supervisors and their summary info                                                      |
| super_device_overview.html | GET /api/supervisor-users-devices/:supervisor_id                                         | Shows all users and devices managed by a supervisor                                           |
| totaldevicestats.html      | GET /api/users, GET /api/user-devices-details/:username, GET /api/unassigned-devices     | Aggregates stats across all devices/users                                                     |
| logs.html                  | (Likely) GET /api/user-devices/:username, GET /api/users, GET /api/user-devices-details  | Displays logs with user/device context                                                        |
| elevatorerror.html         | (Likely) GET /api/user-devices/:username, GET /api/user-devices-details/:username        | Shows device errors/statuses                                                                  |
| support.html               | (No direct API, possibly static or mailto link)                                          | Static support info                                                                           |

---

## 3. Routing Flow (Frontend-Backend Navigation)

1. **User visits `/`**  
   → Redirected to `login.html`

2. **Login (`login.html`)**  
   → On success, user is redirected based on role (user, supervisor, admin)  
   → User: `user_device_overview.html?username=...`  
   → Supervisor: `super_device_overview.html?supervisor_id=...`  
   → Admin: `users.html` or dashboard

3. **User Registration (`register.html`)**  
   → Fetches available devices and supervisors  
   → On submit, calls `/api/register`

4. **User Device Overview (`user_device_overview.html`)**  
   → Fetches devices for the user  
   → Links to `specific_userdevice.html?deviceId=...&username=...`

5. **Specific Device (`specific_userdevice.html`)**  
   → Fetches device details and telemetry  
   → Can trigger telemetry sync

6. **Supervisors (`supervisors.html`)**  
   → Lists supervisors and their summary

7. **Supervisor Device Overview (`super_device_overview.html`)**  
   → Shows all users/devices for a supervisor

8. **Total Device Stats (`totaldevicestats.html`)**  
   → Aggregates stats for all devices/users

---

**This document provides a comprehensive overview of the backend API, its relation to frontend pages, and the routing/navigation flow in the EMS project.** 