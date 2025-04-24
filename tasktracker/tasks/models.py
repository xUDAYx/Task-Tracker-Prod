from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Task(models.Model):
    """
    Model representing a task logged by an employee.
    """
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'))
    hours_spent = models.DecimalField(
        _('hours spent'), 
        max_digits=4, 
        decimal_places=2,
        validators=[
            MinValueValidator(0.1),
            MaxValueValidator(8.0)
        ]
    )
    tags = models.JSONField(_('tags'), default=list)
    task_date = models.DateField(_('task date'))
    status = models.CharField(
        _('status'),
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    feedback = models.TextField(_('feedback'), null=True, blank=True)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        ordering = ['-task_date', '-created_at']
        verbose_name = _('task')
        verbose_name_plural = _('tasks')
    
    def __str__(self):
        return f"{self.title} ({self.task_date})"
    
    @property
    def is_pending(self):
        return self.status == self.STATUS_PENDING
    
    @property
    def is_approved(self):
        return self.status == self.STATUS_APPROVED
    
    @property
    def is_rejected(self):
        return self.status == self.STATUS_REJECTED
    
    def can_be_edited(self):
        """Check if task can be edited based on status."""
        return self.status in [self.STATUS_PENDING, self.STATUS_REJECTED]
    
    def approve(self):
        """Approve the task."""
        if not self.is_pending:
            raise ValueError(_("Only pending tasks can be approved."))
        self.status = self.STATUS_APPROVED
        self.save()
    
    def reject(self, feedback):
        """Reject the task with feedback."""
        if not self.is_pending:
            raise ValueError(_("Only pending tasks can be rejected."))
        if not feedback:
            raise ValueError(_("Feedback is required when rejecting a task."))
        self.status = self.STATUS_REJECTED
        self.feedback = feedback
        self.save()
        
    @classmethod
    def validate_daily_hours(cls, user, task_date, hours_spent, exclude_id=None):
        """
        Validate that total hours spent by user on task_date + new hours_spent
        does not exceed 8 hours.
        """
        tasks = cls.objects.filter(user=user, task_date=task_date)
        if exclude_id:
            tasks = tasks.exclude(id=exclude_id)
        
        total_hours = sum(task.hours_spent for task in tasks)
        new_total = total_hours + hours_spent
        
        if new_total > 8:
            raise ValueError(_(
                f"Total hours for {task_date} would exceed 8 hours limit. "
                f"Current total: {total_hours}, Attempting to add: {hours_spent}"
            ))
        
        return True
