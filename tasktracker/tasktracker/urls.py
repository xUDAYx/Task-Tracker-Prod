"""
URL configuration for tasktracker project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    UserRegistrationView,
    CustomTokenObtainPairView,
    UserProfileView,
    TeamMembersView
)
from tasks.views import (
    TaskListCreateView,
    TaskDetailView,
    TaskApproveView,
    TaskRejectView
)
from analytics.views import (
    EmployeeWeeklySummaryView,
    TeamAnalyticsView,
    ExportTasksView
)

# API URL patterns
api_v1_patterns = [
    # Authentication endpoints
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('users/me/', UserProfileView.as_view(), name='user_profile'),
    path('users/team/', TeamMembersView.as_view(), name='team_members'),
    
    # Task endpoints
    path('tasks/', TaskListCreateView.as_view(), name='task_list_create'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task_detail'),
    path('tasks/<int:pk>/approve/', TaskApproveView.as_view(), name='task_approve'),
    path('tasks/<int:pk>/reject/', TaskRejectView.as_view(), name='task_reject'),
    
    # Analytics endpoints
    path('analytics/employee/<int:employee_id>/weekly/', 
         EmployeeWeeklySummaryView.as_view(), name='employee_weekly_summary'),
    path('analytics/employee/weekly/', 
         EmployeeWeeklySummaryView.as_view(), name='current_employee_weekly_summary'),
    path('analytics/team/', TeamAnalyticsView.as_view(), name='team_analytics'),
    path('analytics/export/', ExportTasksView.as_view(), name='export_tasks'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
]
