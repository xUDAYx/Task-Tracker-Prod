# API Documentation

This document outlines the API endpoints for the Task & Time Tracker application. All API routes are prefixed with `/api/v1/`.

## Authentication Endpoints

### Register User

- **URL**: `/auth/register/`
- **Method**: `POST`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee" // or "manager"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee",
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```
- **Error Response**: `400 Bad Request`

### Login

- **URL**: `/auth/login/`
- **Method**: `POST`
- **Description**: Authenticate user and get JWT tokens
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```
- **Error Response**: `401 Unauthorized`

### Refresh Token

- **URL**: `/auth/token/refresh/`
- **Method**: `POST`
- **Description**: Get a new access token using refresh token
- **Request Body**:
  ```json
  {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```
- **Error Response**: `401 Unauthorized`

## Task Endpoints

### Create Task

- **URL**: `/tasks/`
- **Method**: `POST`
- **Auth Required**: Yes (Employee or Manager)
- **Description**: Create a new task
- **Request Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Task Description",
    "hours_spent": 2.5,
    "tags": ["development", "frontend"],
    "task_date": "2023-05-01"
  }
  ```
- **Success Response**: `201 Created`
- **Error Response**: `400 Bad Request` (validation errors)

### Get Tasks (Employee)

- **URL**: `/tasks/`
- **Method**: `GET`
- **Auth Required**: Yes (Employee)
- **Description**: Get all tasks for the logged-in employee
- **Query Parameters**: 
  - `status`: Filter by status (pending, approved, rejected)
  - `start_date`: Filter by start date
  - `end_date`: Filter by end date
  - `tag`: Filter by tag
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "title": "Task Title",
      "description": "Task Description",
      "hours_spent": 2.5,
      "tags": ["development", "frontend"],
      "task_date": "2023-05-01",
      "status": "pending",
      "feedback": null,
      "created_at": "2023-05-01T10:00:00Z",
      "updated_at": "2023-05-01T10:00:00Z"
    }
  ]
  ```

### Get Tasks (Manager)

- **URL**: `/tasks/team/`
- **Method**: `GET`
- **Auth Required**: Yes (Manager only)
- **Description**: Get all tasks for the manager's team
- **Query Parameters**: 
  - `employee_id`: Filter by employee
  - `status`: Filter by status
  - `start_date`: Filter by start date
  - `end_date`: Filter by end date
  - `tag`: Filter by tag
- **Success Response**: `200 OK`

### Get Task Detail

- **URL**: `/tasks/{id}/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Get details of a specific task
- **Success Response**: `200 OK`
- **Error Response**: `404 Not Found`

### Update Task

- **URL**: `/tasks/{id}/`
- **Method**: `PUT`
- **Auth Required**: Yes (Employee who created the task)
- **Description**: Update a task (only if status is pending or rejected)
- **Request Body**: Same as Create Task
- **Success Response**: `200 OK`
- **Error Response**: 
  - `400 Bad Request` (validation errors)
  - `403 Forbidden` (if task is approved or user doesn't have permission)

### Delete Task

- **URL**: `/tasks/{id}/`
- **Method**: `DELETE`
- **Auth Required**: Yes (Employee who created the task)
- **Description**: Delete a task (only if status is pending)
- **Success Response**: `204 No Content`
- **Error Response**: 
  - `403 Forbidden` (if task is approved/rejected or user doesn't have permission)

### Approve Task

- **URL**: `/tasks/{id}/approve/`
- **Method**: `POST`
- **Auth Required**: Yes (Manager only)
- **Description**: Approve a pending task
- **Success Response**: `200 OK`
- **Error Response**: 
  - `403 Forbidden` (if user is not a manager)
  - `400 Bad Request` (if task is not pending)

### Reject Task

- **URL**: `/tasks/{id}/reject/`
- **Method**: `POST`
- **Auth Required**: Yes (Manager only)
- **Description**: Reject a pending task with feedback
- **Request Body**:
  ```json
  {
    "feedback": "Reason for rejection"
  }
  ```
- **Success Response**: `200 OK`
- **Error Response**: 
  - `403 Forbidden` (if user is not a manager)
  - `400 Bad Request` (if task is not pending)

## Analytics Endpoints

### Employee Weekly Summary

- **URL**: `/analytics/employee/{employee_id}/weekly/`
- **Method**: `GET`
- **Auth Required**: Yes (Manager or the employee themselves)
- **Description**: Get weekly summary of tasks for an employee
- **Query Parameters**:
  - `start_date`: Beginning of week
  - `end_date`: End of week
- **Success Response**: `200 OK`

### Team Analytics

- **URL**: `/analytics/team/`
- **Method**: `GET`
- **Auth Required**: Yes (Manager only)
- **Description**: Get team analytics and metrics
- **Query Parameters**:
  - `start_date`: Start date for analysis
  - `end_date`: End date for analysis
- **Success Response**: `200 OK`

### Export Tasks

- **URL**: `/analytics/export/`
- **Method**: `GET`
- **Auth Required**: Yes (Manager only)
- **Description**: Export tasks data as CSV
- **Query Parameters**: Same as Get Tasks (Manager)
- **Success Response**: `200 OK` with CSV file download

## User Management Endpoints

### Get User Profile

- **URL**: `/users/me/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Get current user's profile
- **Success Response**: `200 OK`

### Update User Profile

- **URL**: `/users/me/`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Description**: Update current user's profile
- **Request Body**:
  ```json
  {
    "first_name": "Updated",
    "last_name": "Name",
    "email": "updated@example.com"
  }
  ```
- **Success Response**: `200 OK`

### Get Team Members

- **URL**: `/users/team/`
- **Method**: `GET`
- **Auth Required**: Yes (Manager only)
- **Description**: Get all team members for a manager
- **Success Response**: `200 OK` 