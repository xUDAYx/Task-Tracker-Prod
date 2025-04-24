# Task & Time Tracker for Teams

## Project Overview
A full-stack task and time tracking application for internal team use. This system allows employees to log their daily work activities while managers can review, approve, or reject those logs. The application includes role-based access control, validation rules, and analytics dashboards for effective team management.

## Tech Stack
- **Backend**: Django + Django REST Framework
- **Frontend**: React (with Redux Toolkit for state management)
- **Database**: PostgreSQL 
- **Authentication**: JWT-based authentication
- **Deployment**: To be determined

## User Roles

### Employee
- Create, read, update, and delete tasks (CRUD operations)
- Log daily tasks with title, description, hours spent, tags, and date
- View status of submitted tasks
- Edit rejected tasks and resubmit them
- Cannot modify approved tasks

### Manager
- View all team tasks with filtering options
- Approve or reject tasks (with optional feedback)
- Access analytics and reporting dashboards
- Export data for external analysis

## Core Features

### 1. Authentication & Role-Based Access
- JWT-based login and registration system
- Role assignment during registration
- Access control based on assigned role
- Secure endpoints with proper authorization

### 2. Task Logging (Employee)
- Daily task logging with detailed information
- System validation to ensure total logged hours ≤ 8 per day
- Status tracking (Pending, Approved, Rejected)
- Conditional editing based on task status
- Clear status indicators in the UI

### 3. Task Approval Workflow (Manager)
- Comprehensive view of all employee-submitted tasks
- Approval/rejection functionality with optional feedback
- Task state management through the approval workflow
- Email notifications for status changes (optional enhancement)

### 4. Manager Dashboard
- Team task overview with multiple filtering options
- Statistical insights on team performance
- Visual representation of pending approvals
- Team productivity metrics

### 5. Reports & Analytics
- Weekly progress reports per employee
- CSV export functionality
- Advanced filtering by various parameters
- Data visualization for better insights

### 6. UI Features
- Responsive design for all device types
- Date validation for accurate record-keeping
- Visual indicators for approval status
- User-friendly forms with validation
- Intuitive navigation and information architecture

## Project Architecture
The application follows a client-server architecture with:
- Django backend providing RESTful API endpoints
- React frontend consuming these APIs
- Redux for centralized state management
- Database layer for persistent storage
- JWT for secure authentication and authorization

## Development Approach
- Feature-driven development focusing on core functionalities first
- Test-driven development to ensure code quality
- Iterative approach with continuous refinement
- Mobile-responsive design from the beginning
- Emphasis on error handling and user experience
