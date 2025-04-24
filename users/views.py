from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer
)
from .permissions import IsManager

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration."""
    
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return user data without password
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view to include user data and role."""
    
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating user profile."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class TeamMembersView(generics.ListAPIView):
    """View for listing team members (for managers only)."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]
    
    def get_queryset(self):
        # For simplicity, managers can see all employees
        # In a real application, you might want to filter by department or team
        return User.objects.filter(role=User.ROLE_EMPLOYEE)
