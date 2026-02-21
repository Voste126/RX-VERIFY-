from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to create/update/delete.
    Read-only access for all authenticated users.
    """

    def has_permission(self, request, view):
        # Allow read-only access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admin users
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'


class IsPharmacist(permissions.BasePermission):
    """Only allow pharmacists to access."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Pharmacist'


class IsPatient(permissions.BasePermission):
    """Only allow patients to access."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Patient'


class IsDistributor(permissions.BasePermission):
    """Only allow distributors to access."""
    
    def has_permission(self, request, view):
        import logging
        logger = logging.getLogger(__name__)
        result = bool(request.user and request.user.is_authenticated and request.user.role == 'Distributor')
        logger.error(f"=== IsDistributor CHECK: user={getattr(request.user, 'username', 'anon')}, role='{getattr(request.user, 'role', 'N/A')}', authenticated={getattr(request.user, 'is_authenticated', False)}, RESULT={result} ===")
        return result



class IsPharmacistOrPatient(permissions.BasePermission):
    """Only pharmacists and patients can access."""
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role in ['Pharmacist', 'Patient']
        )


# Alias for backward compatibility
IsPatientOrPharmacist = IsPharmacistOrPatient


class IsAdminOrPatientOrPharmacist(permissions.BasePermission):
    """
    Admins get full access (list, retrieve, destroy, and custom actions like resolve/unresolve).
    Patients and Pharmacists can list, retrieve, and CREATE flags.
    No other roles are permitted.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', None)

        # Admins can do everything except create flags
        if role == 'Admin':
            return True

        # Patients and Pharmacists can read and create
        if role in ('Patient', 'Pharmacist'):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', None)

        # Admins can access any flag object
        if role == 'Admin':
            return True

        # Patients/Pharmacists can only touch their own flags
        if role in ('Patient', 'Pharmacist'):
            return obj.user == request.user

        return False



class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Only allow object owners or admins to modify.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admins have full access
        if request.user.role == 'Admin':
            return True
        
        # Check if object has 'user' attribute for ownership
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if object has 'pharmacist' attribute (for ReceiptEvent)
        if hasattr(obj, 'pharmacist'):
            return obj.pharmacist == request.user
        
        # Check if object has 'patient' attribute (for CrowdFlag)
        if hasattr(obj, 'patient'):
            return obj.patient == request.user
        
        return False


class IsPharmacistForReceipts(permissions.BasePermission):
    """
    Pharmacists can create receipt events.
    All authenticated users can read.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read access for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write access only for pharmacists
        return request.user.role == 'Pharmacist'


class IsDistributorOrAdminForCreate(permissions.BasePermission):
    """
    Custom permission to allow distributors to create/manage medicines
    and admins to have full access.
    - Distributors can CREATE and UPDATE medicines
    - Admins have full access (CREATE, UPDATE, DELETE)
    - All authenticated users can READ
    """
    
    def has_permission(self, request, view):
        """Check if user has permission for the action."""
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"=== MEDICINE PERMISSION CHECK ===")
        logger.error(f"User: {request.user}")
        logger.error(f"Authenticated: {request.user.is_authenticated if request.user else 'No user'}")
        logger.error(f"Role: {request.user.role if request.user and hasattr(request.user, 'role') else 'No role'}")
        logger.error(f"Action: {view.action if hasattr(view, 'action') else 'No action'}")
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            logger.error(f"DENIED: Not authenticated")
            return False
        
        # Read operations - all authenticated users
        if view.action in ['list', 'retrieve']:
            logger.error(f"ALLOWED: Read operation")
            return True
        
        # Create and Update - distributors and admins
        if view.action in ['create', 'update', 'partial_update']:
            result = request.user.role in ['Distributor', 'Admin']
            logger.error(f"CREATE/UPDATE check: user_role='{request.user.role}', allowed={result}")
            return result
        
        # Delete - admins only
        if view.action == 'destroy':
            result = request.user.role == 'Admin'
            logger.error(f"DELETE check: user_role='{request.user.role}', allowed={result}")
            return result
        
        # Default deny
        logger.error(f"DENIED: Default deny for action {view.action if hasattr(view, 'action') else 'unknown'}")
        return False
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission for specific object."""
        # Read operations - all authenticated users
        if view.action == 'retrieve':
            return True
        
        # Admins can do anything
        if request.user.role == 'Admin':
            return True
        
        # Distributors can update medicines associated with their entity
        if view.action in ['update', 'partial_update']:
            if request.user.role == 'Distributor':
                # Check if this medicine belongs to distributor's entity
                try:
                    distributor_entity = request.user.distributor_entities.first()
                    return obj.distributor == distributor_entity
                except:
                    return False
        
        # Delete - only admins (already handled above)
        return False


class IsDistributorOrAdminForManifests(permissions.BasePermission):
    """
    Custom permission for lot manifest operations.
    
    - READ: All authenticated users
    - CREATE: Distributors and Admins
    - UPDATE: Distributors and Admins (own manifests) or Admins (all)
    - DELETE: Admins only
    """
    
    def has_permission(self, request, view):
        """Check if user has permission for the action."""
        import logging
        logger = logging.getLogger(__name__)
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            logger.error(f"=== MANIFEST PERMISSION DENIED: Not authenticated ===")
            return False
        
        logger.error(f"=== MANIFEST PERMISSION CHECK ===")
        logger.error(f"User: {request.user.username}")
        logger.error(f"Role: '{request.user.role}'")
        logger.error(f"Action: '{view.action}'")
        logger.error(f"Method: {request.method}")
        
        # Read operations - all authenticated users
        if view.action in ['list', 'retrieve', 'verify', 'verify_qr']:
            logger.error(f"ALLOWED: read action")
            return True
        
        # Create and Update - distributors and admins
        if view.action in ['create', 'update', 'partial_update']:
            result = request.user.role in ['Distributor', 'Admin']
            logger.error(f"CREATE/UPDATE check: role='{request.user.role}', allowed={result}")
            return result
        
        # Delete - admins only
        if view.action == 'destroy':
            return request.user.role == 'Admin'
        
        # Default deny
        logger.error(f"DENIED: unhandled action '{view.action}'")
        return False

    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission for specific object."""
        # Read operations - all authenticated users
        if view.action in ['retrieve', 'verify', 'verify_qr']:
            return True
        
        # Admins can do anything
        if request.user.role == 'Admin':
            return True
        
        # Distributors can update their own manifests
        if view.action in ['update', 'partial_update']:
            if request.user.role == 'Distributor':
                # Check if this manifest belongs to distributor's entity
                try:
                    distributor_entity = request.user.distributor_entities.first()
                    return obj.distributor == distributor_entity
                except:
                    return False
        
        # Delete - only admins (already handled above)
        return False
