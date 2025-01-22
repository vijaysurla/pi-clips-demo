declare global {
    interface Window {
      Pi: any;
    }
  }
  
  export const authenticate = async () => {
    try {
      const scopes = ['username', 'payments', 'wallet_address'];
      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      console.log('Pi authentication result:', auth);
      return auth;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };
  
  const onIncompletePaymentFound = (payment: any) => {
    console.log('Incomplete payment found:', payment);
    // Handle incomplete payment here
  };
  
  
  
  
  
  