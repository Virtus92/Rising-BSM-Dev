'use client';

import { User, Building2 } from 'lucide-react';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

interface CustomerListItemProps {
  customer: CustomerResponseDto;
  onClick: () => void;
}

/**
 * Listenelement für einen einzelnen Kunden
 */
const CustomerListItem: React.FC<CustomerListItemProps> = ({ customer, onClick }) => {
  // Statusbadge mit entsprechender Farbgebung
  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (customer.status) {
      case CommonStatus.ACTIVE:
        return (
          <span className={`${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`}>
            {customer.statusLabel || 'Aktiv'}
          </span>
        );
      case CommonStatus.INACTIVE:
        return (
          <span className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`}>
            {customer.statusLabel || 'Inaktiv'}
          </span>
        );
      case CommonStatus.DELETED:
        return (
          <span className={`${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`}>
            {customer.statusLabel || 'Gelöscht'}
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400`}>
            {customer.statusLabel || customer.status}
          </span>
        );
    }
  };

  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition"
      onClick={onClick}
    >
      <div className="grid grid-cols-12 px-6 py-4">
        {/* Kunde (Name und evtl. Firma) */}
        <div className="col-span-5 md:col-span-3 flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mr-3">
            {customer.type === CustomerType.BUSINESS ? (
              <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            ) : (
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            )}
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {customer.name}
            </div>
            {customer.companyName && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {customer.companyName}
              </div>
            )}
          </div>
        </div>
        
        {/* E-Mail (ausgeblendet auf mobilen Geräten) */}
        <div className="col-span-4 md:col-span-3 hidden md:flex items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {customer.email || '–'}
          </div>
        </div>
        
        {/* Telefon (ausgeblendet auf mobilen Geräten) */}
        <div className="col-span-3 md:col-span-2 hidden md:flex items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {customer.phone || '–'}
          </div>
        </div>
        
        {/* Stadt */}
        <div className="col-span-3 md:col-span-2 flex items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {customer.city || '–'}
          </div>
        </div>
        
        {/* Status */}
        <div className="col-span-4 md:col-span-2 flex items-center justify-end">
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
};

export default CustomerListItem;