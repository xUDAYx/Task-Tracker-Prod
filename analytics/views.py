from django.shortcuts import render
import csv
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Avg
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, views
from rest_framework.response import Response

from tasks.models import Task
from users.models import User
from users.permissions import IsManager, IsManagerOrTaskOwner


class EmployeeWeeklySummaryView(views.APIView):
    """View for getting weekly summary for an employee."""
    
    permission_classes = [permissions.IsAuthenticated, IsManagerOrTaskOwner]
    
    def get(self, request, employee_id=None):
        # Default to current user if no employee_id or user is not a manager
        if not employee_id or not request.user.is_manager:
            employee_id = request.user.id
            
        # Get start and end dates from query params or use current week
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            # Default to current week
            today = timezone.now().date()
            # Get the previous Monday
            start_date = today - timedelta(days=today.weekday())
            # Get the Sunday
            end_date = start_date + timedelta(days=6)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get tasks for the employee in date range
        tasks = Task.objects.filter(
            user_id=employee_id,
            task_date__range=[start_date, end_date]
        )
        
        # Group tasks by date and calculate stats
        stats = tasks.values('task_date').annotate(
            total_hours=Sum('hours_spent'),
            task_count=Count('id')
        ).order_by('task_date')
        
        # Count tasks by status
        status_counts = {
            'pending': tasks.filter(status=Task.STATUS_PENDING).count(),
            'approved': tasks.filter(status=Task.STATUS_APPROVED).count(),
            'rejected': tasks.filter(status=Task.STATUS_REJECTED).count(),
        }
        
        # Calculate total hours worked
        total_hours = tasks.aggregate(total=Sum('hours_spent'))['total'] or 0
        
        # Get most used tags
        tags_data = {}
        for task in tasks:
            for tag in task.tags:
                if tag in tags_data:
                    tags_data[tag] += 1
                else:
                    tags_data[tag] = 1
        
        # Sort tags by frequency
        top_tags = sorted(tags_data.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return Response({
            'employee_id': employee_id,
            'start_date': start_date,
            'end_date': end_date,
            'daily_stats': stats,
            'status_counts': status_counts,
            'total_hours': total_hours,
            'top_tags': top_tags
        })


class TeamAnalyticsView(views.APIView):
    """View for team analytics (for managers only)."""
    
    permission_classes = [permissions.IsAuthenticated, IsManager]
    
    def get(self, request):
        # Get start and end dates from query params or use current month
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            # Default to current month
            today = timezone.now().date()
            start_date = today.replace(day=1)
            # End date is the end of the month
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get all tasks in date range
        tasks = Task.objects.filter(task_date__range=[start_date, end_date])
        
        # Tasks by status
        status_counts = {
            'pending': tasks.filter(status=Task.STATUS_PENDING).count(),
            'approved': tasks.filter(status=Task.STATUS_APPROVED).count(),
            'rejected': tasks.filter(status=Task.STATUS_REJECTED).count(),
        }
        
        # Hours by employee
        employee_hours = tasks.values(
            'user__id', 'user__first_name', 'user__last_name', 'user__email'
        ).annotate(
            total_hours=Sum('hours_spent'),
            task_count=Count('id')
        ).order_by('-total_hours')
        
        # Total hours for the team
        total_hours = tasks.aggregate(total=Sum('hours_spent'))['total'] or 0
        
        # Tasks per day
        tasks_per_day = tasks.values('task_date').annotate(
            task_count=Count('id'),
            total_hours=Sum('hours_spent')
        ).order_by('task_date')
        
        # Get most used tags
        tags_data = {}
        for task in tasks:
            for tag in task.tags:
                if tag in tags_data:
                    tags_data[tag] += 1
                else:
                    tags_data[tag] = 1
        
        # Sort tags by frequency
        top_tags = sorted(tags_data.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'status_counts': status_counts,
            'employee_hours': employee_hours,
            'total_hours': total_hours,
            'tasks_per_day': tasks_per_day,
            'top_tags': top_tags,
            'pending_approval_count': status_counts['pending']
        })


class ExportTasksView(views.APIView):
    """View for exporting tasks data as CSV."""
    
    permission_classes = [permissions.IsAuthenticated, IsManager]
    
    def get(self, request):
        # Get filters from query params
        status_filter = request.query_params.get('status')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        tag = request.query_params.get('tag')
        employee_id = request.query_params.get('employee_id')
        
        # Start with all tasks
        queryset = Task.objects.all().order_by('task_date', 'user__email')
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if start_date:
            queryset = queryset.filter(task_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(task_date__lte=end_date)
        
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        
        if employee_id:
            queryset = queryset.filter(user_id=employee_id)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="tasks_export.csv"'
        
        # Create CSV writer
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Date', 'Employee', 'Title', 'Description', 
            'Hours', 'Tags', 'Status', 'Feedback', 'Created At'
        ])
        
        # Add task data
        for task in queryset:
            writer.writerow([
                task.id,
                task.task_date,
                task.user.email,
                task.title,
                task.description,
                task.hours_spent,
                ', '.join(task.tags),
                task.status,
                task.feedback or '',
                task.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
