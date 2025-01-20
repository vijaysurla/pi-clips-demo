declare namespace Pi {
    interface User {
      uid: string;
      username: string;
    }
  
    interface AuthResult {
      user: User;
      accessToken: string;
    }
  
    interface PiSDK {
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<AuthResult>;
    }
  }
  
  interface Window {
    Pi?: Pi.PiSDK;
  }
  
  