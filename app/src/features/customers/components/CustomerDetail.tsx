'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';
import { useToast } from '@/shared/hooks/useToast';
import { DetailPageLayout, createStatusBadge, getInitials } from '@/shared/components/DetailPageLayout';
import { getEntityConfig, getStatusConfig, getAvatarConfig } from '@/shared/constants/entity-configs';
import { NotesTab } from '@/features/customers/components/NotesTab';
import { CustomerRequestsTab } from '@/features/customers/components/CustomerRequestsTab';
import { CustomerAppointmentsTab } from '@/features/customers/components/CustomerAppointmentsTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Globe,
  CreditCard,
  Bell,
  FileText,
  MessageSquare,
  User,
  RefreshCw,
  Tag,
  Edit
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useEntityModal } from '@/shared/hooks/useModal';
import { FormModal } from '@/shared/components/BaseModal';
import CustomerForm from '@/features/customers/components/CustomerForm';

// Get customer entity configuration
const customerConfig = getEntityConfig('customer');
const customerStatusConfig = getStatusConfig('customer');

// Customer type badge helper
const getCustomerTypeBadge = (type: string) => {
  const typeConfig = {
    [CustomerType.PRIVATE]: { color: 'border-blue-500 text-blue-500', label: 'Private' },
    [CustomerType.BUSINESS]: { color: 'border-purple-500 text-purple-500', label: 'Business' },
    [CustomerType.INDIVIDUAL]: { color: 'border-green-500 text-green-500', label: 'Individual' },
    [CustomerType.GOVERNMENT]: { color: 'border-orange-500 text-orange-500', label: 'Government' },
    [CustomerType.NON_PROFIT]: { color: 'border-pink-500 text-pink-500', label: 'Non-Profit' }
  };
  
  const config = typeConfig[type as keyof typeof typeConfig];
  if (!config) {
    return <Badge variant="outline">{type}</Badge>;
  }
  
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = parseInt(params.id as string);
  
  // State
  const [customer, setCustomer] = useState<CustomerResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Modal for editing customer
  const editModal = useEntityModal<CustomerResponseDto>();
  
  // Permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewCustomer = hasPermission(API_PERMISSIONS.CUSTOMERS.VIEW);
  const canEditCustomer = hasPermission(API_PERMISSIONS.CUSTOMERS.UPDATE);
  const canDeleteCustomer = hasPermission(API_PERMISSIONS.CUSTOMERS.DELETE);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await CustomerService.getCustomerById(customerId);
        
        if (response.success && response.data) {
          setCustomer(response.data);
        } else {
          setError(response.message || 'Failed to fetch customer details');
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };
    
    if (canViewCustomer && !permissionsLoading) {
      fetchCustomer();
    } else if (!permissionsLoading) {
      setLoading(false);
    }
  }, [customerId, canViewCustomer, permissionsLoading]);

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      setChangingStatus(true);
      
      const response = await CustomerService.updateStatus(customerId, newStatus as CommonStatus);
      
      if (response.success) {
        setCustomer(prev => prev ? { ...prev, status: newStatus as CommonStatus } : null);
        
        toast({
          title: 'Status updated',
          description: `Customer status changed to ${newStatus}`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Update failed',
          description: response.message || 'Failed to update customer status',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error('Error updating customer status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update customer status',
        variant: 'error'
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // Handle delete
  const handleDeleteCustomer = async () => {
    try {
      const response = await CustomerService.deleteCustomer(customerId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Customer has been deleted successfully',
          variant: 'success'
        });
        
        router.push('/dashboard/customers');
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete customer',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'error'
      });
    }
  };

  // Handle customer form submission
  const handleCustomerSubmit = async (data: any) => {
    editModal.setError(null);
    editModal.setSuccess(false);
    editModal.setIsSubmitting(true);
    
    try {
      const response = await CustomerService.updateCustomer(customerId, data);
      
      if (response.success && response.data) {
        // Update local customer data
        setCustomer(response.data);
        
        editModal.setSuccess(true);
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
          variant: 'success'
        });
        
        // Close modal after a delay
        setTimeout(() => {
          editModal.closeModal();
        }, 1500);
        
        return response.data;
      } else {
        editModal.setError(response.message || 'Failed to update customer');
        return null;
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      editModal.setError('An unexpected error occurred');
      return null;
    } finally {
      editModal.setIsSubmitting(false);
    }
  };

  // Handle edit action
  const handleEditCustomer = () => {
    if (customer && canEditCustomer) {
      editModal.openEditModal(customer);
    }
  };

  // Permission check
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canViewCustomer) {
    return (
      <NoPermissionView 
        title="Access Denied"
        message="You don't have permission to view customer details."
        permissionNeeded={API_PERMISSIONS.CUSTOMERS.VIEW}
      />
    );
  }

  if (!customer && !loading && !error) {
    return null;
  }

  // Prepare data for DetailPageLayout
  const statusBadge = customer ? createStatusBadge(customer.status, customerStatusConfig) : null;
  const avatarConfig = getAvatarConfig('customer', customer?.name);
  
  const profileInfo = customer ? [
    {
      label: 'Email',
      value: customer.email ? (
        <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline dark:text-blue-400 truncate">
          {customer.email}
        </a>
      ) : null,
      icon: Mail,
      iconColor: 'text-blue-500',
      emptyText: 'Not provided'
    },
    {
      label: 'Phone',
      value: customer.phone ? (
        <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline dark:text-blue-400">
          {customer.phone}
        </a>
      ) : null,
      icon: Phone,
      iconColor: 'text-green-500',
      emptyText: 'Not provided'
    },
    {
      label: 'VAT/Tax ID',
      value: customer.vatNumber ? <span>{customer.vatNumber}</span> : null,
      icon: CreditCard,
      iconColor: 'text-purple-500',
      emptyText: 'Not provided'
    },
    {
      label: 'Newsletter',
      value: <span>{customer.newsletter ? 'Subscribed' : 'Not subscribed'}</span>,
      icon: Bell,
      iconColor: 'text-amber-500'
    }
  ] : [];

  const statusOptions = [
    { value: CommonStatus.ACTIVE, label: 'Active' },
    { value: CommonStatus.INACTIVE, label: 'Inactive' },
    { value: CommonStatus.DELETED, label: 'Deleted' }
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Customer Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h3>
                  
                  {customer?.email && (
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <a 
                          href={`mailto:${customer.email}`} 
                          className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
                        >
                          {customer.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {customer?.phone && (
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <a 
                          href={`tel:${customer.phone}`} 
                          className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {customer?.company && (
                    <div className="flex items-start">
                      <Building className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Company</p>
                        <p className="text-sm">{customer.company}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address Preview</h3>
                  
                  {(customer?.address || customer?.city || customer?.postalCode || customer?.country) ? (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Primary Address</p>
                        <address className="not-italic text-sm">
                          {customer.address && <p>{customer.address}</p>}
                          {(customer.postalCode || customer.city) && (
                            <p>
                              {customer.postalCode && <span>{customer.postalCode} </span>}
                              {customer.city && <span>{customer.city}</span>}
                            </p>
                          )}
                          {customer.country && <p>{customer.country}</p>}
                        </address>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic text-sm">No address information</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-blue-500" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  {statusBadge}
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  {customer && getCustomerTypeBadge(customer.type)}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {customer && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm font-medium flex items-center">
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {new Date(customer.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'address',
      label: 'Address',
      icon: MapPin,
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(customer?.address || customer?.city || customer?.postalCode || customer?.country) ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {customer.address && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</p>
                        <p className="font-medium">{customer.address}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {customer.postalCode && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</p>
                          <p className="font-medium">{customer.postalCode}</p>
                        </div>
                      )}
                      
                      {customer.city && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">City</p>
                          <p className="font-medium">{customer.city}</p>
                        </div>
                      )}
                    </div>
                    
                    {customer.country && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</p>
                        <p className="font-medium flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-500" />
                          {customer.country}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-40 md:h-64 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Map view would be displayed here
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <MapPin className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Address Information</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  This customer doesn't have any address information saved.
                </p>
                {canEditCustomer && (
                  <Button variant="outline" className="mt-4" onClick={handleEditCustomer}>
                    <Edit className="mr-2 h-4 w-4" />
                    Add address details
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: MessageSquare,
      content: <NotesTab customerId={customerId} />
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: MessageSquare,
      content: <CustomerRequestsTab customerId={customerId} />
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      content: <CustomerAppointmentsTab customerId={customerId} />
    }
  ];

  return (
  <>
  <DetailPageLayout
    title={customer?.name || 'Customer'}
    subtitle={customer?.company}
    statusBadge={statusBadge}
    onBack={() => router.push('/dashboard/customers')}
    onEdit={canEditCustomer ? handleEditCustomer : undefined}
    canEdit={canEditCustomer}
    canDelete={canDeleteCustomer}
    onDelete={handleDeleteCustomer}
    currentStatus={customer?.status}
    statusOptions={statusOptions}
    onStatusChange={handleStatusChange}
    changingStatus={changingStatus}
    avatar={avatarConfig}
    profileInfo={profileInfo}
    tabs={tabs}
    defaultTab="overview"
    deleteTitle="Delete Customer"
    deleteDescription={`Are you sure you want to delete ${customer?.name}? This action cannot be undone.`}
    showDeleteDialog={showDeleteDialog}
    setShowDeleteDialog={setShowDeleteDialog}
    isLoading={loading}
    error={error}
      maxWidth="7xl"
      />
      
      {/* Edit Customer Modal */}
      {editModal.action?.type === 'edit' && (
        <FormModal
          isOpen={editModal.isOpen}
          onClose={editModal.closeModal}
          title="Edit Customer"
          description={`Update information for ${customer?.name}`}
          isSubmitting={editModal.isSubmitting}
          error={editModal.error}
          success={editModal.success}
          size="lg"
          showDefaultActions={false}
        >
          <CustomerForm
            initialData={customer || {}}
            onSubmit={handleCustomerSubmit}
            mode="edit"
            isLoading={editModal.isSubmitting}
            error={editModal.error}
            success={editModal.success}
            onCancel={editModal.closeModal}
            submitLabel="Update Customer"
          />
        </FormModal>
      )}
    </>
  );
}