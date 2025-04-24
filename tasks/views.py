from django.shortcuts import render
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from .models import Task
from .serializers import (
    TaskSerializer,
    TaskApprovalSerializer,
    TaskRejectionSerializer,
    ManagerTaskAssignmentSerializer
)
from users.permissions import (
    IsManager,
    IsTaskOwner,
    IsManagerOrTaskOwner
)


class TaskListCreateView(generics.ListCreateAPIView):
    """View for listing and creating tasks."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on user role."""
        if self.request.method == 'POST' and self.request.user.is_manager:
            return ManagerTaskAssignmentSerializer
        return TaskSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all()
        
        # Filter by user unless manager is viewing
        if not user.is_manager:
            queryset = queryset.filter(user=user)
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        tag = self.request.query_params.get('tag')
        employee_id = self.request.query_params.get('employee_id')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if start_date:
            queryset = queryset.filter(task_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(task_date__lte=end_date)
        
        if tag:
            # Filter tasks with specific tag in the JSONField
            queryset = queryset.filter(tags__contains=[tag])
        
        if employee_id and user.is_manager:
            queryset = queryset.filter(user_id=employee_id)
        
        return queryset


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating and deleting tasks."""
    
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrTaskOwner]
    
    def get_queryset(self):
        return Task.objects.all()
    
    def update(self, request, *args, **kwargs):
        task = self.get_object()
        
        # Check if task can be edited
        if not task.can_be_edited():
            return Response(
                {"detail": "Approved tasks cannot be edited."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is the task owner or manager
        if task.user != request.user and not request.user.is_manager:
            return Response(
                {"detail": "You can only edit your own tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # For managers editing assigned tasks
        if request.user.is_manager and task.user != request.user:
            self.serializer_class = ManagerTaskAssignmentSerializer
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        
        # Check if task is pending
        if not task.is_pending:
            return Response(
                {"detail": "Only pending tasks can be deleted."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is the task owner or manager
        if task.user != request.user and not request.user.is_manager:
            return Response(
                {"detail": "You can only delete your own tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class TaskApproveView(generics.UpdateAPIView):
    """View for approving a task."""
    
    serializer_class = TaskApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]
    
    def get_queryset(self):
        return Task.objects.all()
    
    def update(self, request, *args, **kwargs):
        task = self.get_object()
        serializer = self.get_serializer(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return updated task with TaskSerializer
        return Response(TaskSerializer(task).data)


class TaskRejectView(generics.UpdateAPIView):
    """View for rejecting a task with feedback."""
    
    serializer_class = TaskRejectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]
    
    def get_queryset(self):
        return Task.objects.all()
    
    def update(self, request, *args, **kwargs):
        task = self.get_object()
        serializer = self.get_serializer(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return updated task with TaskSerializer
        return Response(TaskSerializer(task).data)
