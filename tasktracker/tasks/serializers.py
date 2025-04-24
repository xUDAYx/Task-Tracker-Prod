from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Task

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for the Task model."""
    
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'hours_spent', 'tags',
            'task_date', 'status', 'feedback', 'user', 'user_email',
            'user_name', 'can_edit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'feedback', 'user', 'created_at', 'updated_at']
    
    def get_user_email(self, obj):
        return obj.user.email
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def get_can_edit(self, obj):
        return obj.can_be_edited()
    
    def validate(self, data):
        # Get current user
        user = self.context['request'].user
        
        # Get task_date from request or instance
        task_date = data.get('task_date', None)
        if task_date is None and self.instance:
            task_date = self.instance.task_date
        
        # Get hours_spent from request or instance
        hours_spent = data.get('hours_spent', None)
        if hours_spent is None and self.instance:
            hours_spent = self.instance.hours_spent
        
        # Validate daily hours limit
        task_id = self.instance.id if self.instance else None
        try:
            Task.validate_daily_hours(user, task_date, hours_spent, exclude_id=task_id)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ManagerTaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for manager to assign tasks to employees."""
    
    user_id = serializers.IntegerField(write_only=True)
    user_email = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    can_edit = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'hours_spent', 'tags',
            'task_date', 'status', 'feedback', 'user', 'user_id', 'user_email',
            'user_name', 'can_edit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'feedback', 'user', 'created_at', 'updated_at']
    
    def get_user_email(self, obj):
        return obj.user.email
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def get_can_edit(self, obj):
        return obj.can_be_edited()
    
    def validate(self, data):
        # Get assigned user
        user_id = data.pop('user_id', None)
        
        if not user_id:
            raise serializers.ValidationError(_("Employee must be selected for task assignment."))
            
        try:
            assigned_user = User.objects.get(id=user_id, role=User.ROLE_EMPLOYEE)
            self._assigned_user = assigned_user
        except User.DoesNotExist:
            raise serializers.ValidationError(_("Selected employee does not exist."))
        
        # Get task_date from request or instance
        task_date = data.get('task_date', None)
        if task_date is None and self.instance:
            task_date = self.instance.task_date
        
        # Get hours_spent from request or instance
        hours_spent = data.get('hours_spent', None)
        if hours_spent is None and self.instance:
            hours_spent = self.instance.hours_spent
        
        # Validate daily hours limit for the assigned user
        task_id = self.instance.id if self.instance else None
        try:
            Task.validate_daily_hours(assigned_user, task_date, hours_spent, exclude_id=task_id)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    def create(self, validated_data):
        # Set the user to the assigned employee
        validated_data['user'] = self._assigned_user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Keep the existing user for updates
        validated_data.pop('user', None)
        return super().update(instance, validated_data)


class TaskApprovalSerializer(serializers.Serializer):
    """Serializer for approving a task."""
    
    def validate(self, data):
        task = self.instance
        if not task.is_pending:
            raise serializers.ValidationError(_("Only pending tasks can be approved."))
        return data
    
    def update(self, instance, validated_data):
        instance.approve()
        return instance


class TaskRejectionSerializer(serializers.Serializer):
    """Serializer for rejecting a task with feedback."""
    
    feedback = serializers.CharField(required=True)
    
    def validate(self, data):
        task = self.instance
        if not task.is_pending:
            raise serializers.ValidationError(_("Only pending tasks can be rejected."))
        return data
    
    def update(self, instance, validated_data):
        instance.reject(validated_data['feedback'])
        return instance 