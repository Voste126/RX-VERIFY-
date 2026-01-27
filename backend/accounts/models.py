import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with UUID primary key and role-based access control."""
    
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Pharmacist', 'Pharmacist'),
        ('Patient', 'Patient'),
        ('Distributor', 'Distributor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Patient')
    
    # Pharmacist-specific fields
    pharmacy_name = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Legal pharmacy name (for pharmacists)"
    )
    pharmacy_phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Pharmacy contact phone (for pharmacists)"
    )
    license_number = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Professional license number (for pharmacists and distributors)"
    )
    
    # Distributor-specific fields
    company_name = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Company/distributor name (for distributors)"
    )
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
