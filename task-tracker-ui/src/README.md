# Task Tracker Frontend

This is the frontend application for the Task Tracker system, built with React and TailwindCSS.

## Features Implemented

### Authentication
- Login form with JWT authentication
- Registration form allowing users to sign up as employees or managers
- Protected routes requiring authentication
- User session management with JWT tokens

### Task Management
- Task listing with status badges (Pending, Approved, Rejected)
- Task creation form with validation (title, description, hours, date, tags)
- Task editing for pending or rejected tasks
- Task deletion
- Daily 8-hour limit validation

### Task Approval Workflow
- Manager review interface for pending tasks
- Approve/reject functionality with feedback
- Status indicators and feedback display
- Resubmission workflow for rejected tasks

### Analytics
- Weekly and team performance metrics
- Hours distribution visualization
- Status distribution visualization
- Top tags visualization
- Date range filtering
- Employee performance breakdown (for managers)

### Data Export
- CSV export functionality for managers
- Filtering options for export (date range, status, employee, tags)

### Team Management
- Team member listing (for managers)
- Role-based interface differences between employees and managers

## Tech Stack
- React 19
- React Router v7
- Axios for API requests
- TailwindCSS for styling
- Chart.js for data visualization
- Shadcn UI components

## Project Structure
- `/components` - React components
- `/contexts` - React context providers (AuthContext)
- `/lib` - Utility functions and API client

## Authentication Flow
1. User logs in with email/password
2. Backend returns JWT token
3. Token is stored in localStorage
4. Token is included in all subsequent API requests
5. User session is restored on page refresh

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Access the application at http://localhost:3000

## Backend Integration
The frontend communicates with the Django REST Framework backend at `http://localhost:8000/api/v1/`. 