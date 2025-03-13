export interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message?: string;
  createdAt: string;
  formattedDate: string;
  statusInfo: {
    label: string;
    className: string;
  };
}
