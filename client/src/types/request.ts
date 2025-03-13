export interface RequestModel {
    id: number;
    name: string;
    email: string;
    phone?: string;
    serviceLabel: string;
    message: string;
    formattedDate: string;
    status: string;
    statusClass: string;
    notes?: string[];
  }
  
  export interface RequestNote {
    id: number;
    text: string;
    formattedDate: string;
    benutzer: string;
  }
  
  export interface RequestDetailResponse {
    request: RequestModel;
    notes: RequestNote[];
  }