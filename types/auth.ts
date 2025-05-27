export interface PagePermission {
    page: string;
    actions: {
      [key: string]: boolean | undefined;
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
    };
  }
  
  export interface SessionUser {
    id: string;
    email: string;
    isEmployee: boolean;
    permissions?: PagePermission[];
  }