"""
Custom permission classes for role-based access control.

This module defines permissions based on user roles (Admin, Pharmacist, Patient).
"""
from rest_framework import permissions


class IsPharmacist(permissions.BasePermission):
    """
    Permission class that only allows pharmacists to access the view.
    
    Used for endpoints that require pharmaceutical professional privileges,
    such as creating receipt events.
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is authenticated and has the 'Pharmacist' role.
        
        Args:
            request: The HTTP request object
            view: The view being accessed
            
        Returns:
            bool: True if user is an authenticated pharmacist, False otherwise
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'Pharmacist'
        )


class IsPatientOrPharmacist(permissions.BasePermission):
    """
    Permission class that allows both patients and pharmacists to access the view.
    
    Used for endpoints that are accessible to general users and pharmaceutical
    professionals, such as creating crowd flags for quality reports.
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is authenticated and has either 'Patient' or 'Pharmacist' role.
        
        Args:
            request: The HTTP request object
            view: The view being accessed
            
        Returns:
            bool: True if user is an authenticated patient or pharmacist, False otherwise
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['Patient', 'Pharmacist']
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows read access to anyone, but write access only to admins.
    
    Used for reference data endpoints like distributors and medicines.
    """
    
    def has_permission(self, request, view):
        """
        Check if the request is a safe method (GET, HEAD, OPTIONS) or if user is admin.
        
        Args:
            request: The HTTP request object
            view: The view being accessed
            
        Returns:
            bool: True if safe method or admin user, False otherwise
        """
        # Allow read permissions to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admin users
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'Admin'
        )
