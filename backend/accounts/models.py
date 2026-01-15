import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with UUID primary key and role-based access control."""
    
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Pharmacist', 'Pharmacist'),
        ('Patient', 'Patient'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Patient')
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
