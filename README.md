# Task Tracker

A comprehensive task management application built with modern web technologies that allows teams to collaborate efficiently on projects.

## 🌐 Live Demo

- [View Live Demo](https://task-tracker-prod.vercel.app/)
- [Watch Demo Video](https://komododecks.com/recordings/sqexB9ynvcpSvXpxWfUj)

## ✨ Features

- **Task Management**
  - Create, view, update, and delete tasks
  - Filter and sort tasks by various parameters
  - Add tags for better organization
  - Track task status (pending, approved, rejected)

- **Team Collaboration**
  - Role-based access control (Admin, Manager, Employee)
  - Team member management
  - Assign tasks to specific team members

- **Reporting Tools**
  - Export task data to CSV format
  - Filter exports by date range, employee, status, and tags

- **User Experience**
  - Responsive design for desktop and mobile devices
  - Intuitive UI with clear feedback
  - Light/dark mode support

## 🛠️ Technology Stack

- Frontend: React.js, TailwindCSS, Shadcn UI
- Authentication: NextAuth
- Database: Cloudflare D1 (serverless)
- ORM: Drizzle ORM
- Edge Functions: Cloudflare Wrangler

## 📋 Installation

1. **Clone the repository**
   ```
   git clone https://github.com/xUDAYx/Task-Tracker-Prod.git
   cd Task-Tracker-Prod
   ```

2. **Install dependencies**
   ```
   # Install backend dependencies
   cd tasktracker
   pip install -r requirements.txt

   # Install frontend dependencies
   cd ../task-tracker-ui
   npm install
   ```

3. **Set up environment variables**
   ```
   # Create .env file in task-tracker-ui directory
   cp .env.example .env
   ```

4. **Start the development servers**
   ```
   # Start backend server
   cd tasktracker
   python manage.py runserver

   # In a new terminal, start frontend server
   cd task-tracker-ui
   npm start
   ```

5. **Access the application**
   
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

1. **Login with admin credentials:**
   - Email: jawheriuday@gmail.com
   - Password: admin@123

2. **Create your first task:**
   - Click on "Add Task" button
   - Fill in the task details
   - Click "Save"

3. **Manage your team:**
   - Navigate to "Team" section
   - Add team members and assign roles

4. **Export data:**
   - Go to "Reports" section
   - Set filter parameters
   - Click "Export to CSV"

## 📝 API Documentation

API documentation is available at [/api/docs/](http://localhost:8000/api/docs/) when running locally.

## 👨‍💻 Author

**Uday Jawheri**

- GitHub: [xUDAYx](https://github.com/xUDAYx)
- LinkedIn: [Uday Jawheri](https://linkedin.com/in/udayjawheri)
- Email: jawheriuday@gmail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
