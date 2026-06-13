const API_BASE_URL = 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle logout or unauthorized response code
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMsg = data.message || 'Something went wrong';
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  register: (fullName, username, email, password) => 
    request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, email, password }),
    }),
    
  login: (loginCredential, password) => {
    const body = loginCredential.includes('@')
      ? { email: loginCredential, password }
      : { username: loginCredential, password };
      
    return request('/users/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  
  logout: () => 
    request('/users/logout', {
      method: 'POST',
    }),

  // Accounts
  createAccount: () => 
    request('/accounts/create', {
      method: 'POST',
    }),
    
  getMyAccounts: () => 
    request('/accounts/my', {
      method: 'GET',
    }),
    
  getAccountBalance: (accountId) => 
    request(`/accounts/balance/${accountId}`, {
      method: 'GET',
    }),

  // Transactions
  depositFunds: (toAccount, amount, idempotencyKey) => 
    request('/transactions/intialFunds', {
      method: 'POST',
      body: JSON.stringify({ toAccount, amount: Number(amount), idempotencyKey }),
    }),
    
  transferFunds: (fromAccount, toAccount, amount, idempotencyKey) => 
    request('/transactions/fundsTransfer', {
      method: 'POST',
      body: JSON.stringify({ fromAccount, toAccount, amount: Number(amount), idempotencyKey }),
    }),
    
  getUserLedger: () => 
    request('/transactions/ledger', {
      method: 'GET',
    }),
};
