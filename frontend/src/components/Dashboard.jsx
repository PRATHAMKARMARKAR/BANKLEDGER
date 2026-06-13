import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  LogOut, Plus, RefreshCw, Send, DollarSign, 
  ArrowUpRight, ArrowDownLeft, Landmark, Copy, Check, Info, Clock, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [activeTab, setActiveTab] = useState('transfer'); // 'transfer' or 'deposit'
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  
  const [depositTo, setDepositTo] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const fetchBalancesForAccounts = async (accountsList) => {
    const balanceMap = {};
    for (const acc of accountsList) {
      try {
        const res = await api.getAccountBalance(acc._id);
        balanceMap[acc._id] = res.balance;
      } catch (err) {
        console.error(`Error fetching balance for ${acc._id}:`, err);
        balanceMap[acc._id] = 0;
      }
    }
    setBalances(balanceMap);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch user accounts
      const accountsRes = await api.getMyAccounts();
      const accountsList = accountsRes.accounts || [];
      setAccounts(accountsList);

      // Set default select options
      if (accountsList.length > 0) {
        setTransferFrom(accountsList[0]._id);
        setDepositTo(accountsList[0]._id);
      }

      // Fetch balances
      await fetchBalancesForAccounts(accountsList);

      // Fetch user ledger entries
      const ledgerRes = await api.getUserLedger();
      setLedger(ledgerRes.ledgerEntries || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateAccount = async () => {
    setBtnLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.createAccount();
      setSuccess('Account created successfully!');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!depositTo || !depositAmount || Number(depositAmount) <= 0) {
      setError('Please select an account and specify a valid amount.');
      return;
    }

    setBtnLoading(true);
    try {
      const idempotencyKey = `dep-${depositTo}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const res = await api.depositFunds(depositTo, depositAmount, idempotencyKey);
      setSuccess(res.message || 'Deposit successful!');
      setDepositAmount('');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Deposit failed.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!transferFrom || !transferTo || !transferAmount || Number(transferAmount) <= 0) {
      setError('Please fill in all transfer fields.');
      return;
    }

    if (transferFrom === transferTo) {
      setError('Source account and destination account cannot be the same.');
      return;
    }

    setBtnLoading(true);
    try {
      const idempotencyKey = `tx-${transferFrom}-${transferTo}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const res = await api.transferFunds(transferFrom, transferTo, transferAmount, idempotencyKey);
      setSuccess(res.message || 'Transfer successful!');
      setTransferAmount('');
      setTransferTo('');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setBtnLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (val, currency = 'INR') => {
    const amountVal = typeof val === 'number' ? val : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amountVal);
  };

  // Calculate overall balance across all user accounts
  const totalBalance = Object.values(balances).reduce((sum, curr) => sum + curr, 0);

  return (
    <div className="dashboard-layout animated-fade-in">
      {/* Navigation */}
      <header className="navbar">
        <div className="nav-brand">
          <Landmark className="gradient-text" size={26} />
          <span className="gradient-text">LedgerVault</span>
        </div>
        <div className="nav-actions">
          <div className="user-info">
            <div className="avatar">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'none', md: 'block' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user?.fullName}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user?.username}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-logout" title="Log Out">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="dashboard-content">
        
        {/* Left Side: Summary, Accounts & Ledger */}
        <section className="main-section">
          {/* Messages */}
          {error && <div className="alert alert-error"><AlertTriangle size={18} /> {error}</div>}
          {success && <div className="alert alert-success"><Check size={18} /> {success}</div>}

          {/* Hero Section */}
          <div className="balance-hero glass-panel">
            <p className="balance-hero-header">Total Available Balance</p>
            <h1 className="balance-hero-amount">{formatCurrency(totalBalance)}</h1>
            <div className="balance-hero-footer">
              <div className="stat-item">
                <span className="stat-label">My Accounts</span>
                <span className="stat-value">{accounts.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Currency</span>
                <span className="stat-value">INR (₹)</span>
              </div>
            </div>
          </div>

          {/* Accounts List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="section-title">
                <Landmark size={20} className="gradient-text" />
                My Accounts
              </h2>
              <button 
                onClick={handleCreateAccount} 
                className="btn btn-primary" 
                disabled={btnLoading || loading}
                style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <Plus size={16} /> Create Account
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <RefreshCw className="empty-state-icon" style={{ animation: 'spin 2s linear infinite' }} />
                <p>Loading accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="glass-card empty-state">
                <Landmark className="empty-state-icon" size={48} />
                <p style={{ fontWeight: '500' }}>No active accounts found.</p>
                <p style={{ fontSize: '0.875rem' }}>Create an account to load initial funds and make transfers.</p>
              </div>
            ) : (
              <div className="accounts-grid">
                {accounts.map((acc, index) => (
                  <div key={acc._id} className="account-card active animated-fade-in">
                    <div className="account-card-header">
                      <span className="account-label">Account #{index + 1}</span>
                      <div 
                        className="account-id-box" 
                        onClick={() => handleCopyId(acc._id)}
                        title="Click to copy account ID"
                      >
                        <span>{acc._id.substring(acc._id.length - 8)}</span>
                        {copiedId === acc._id ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <p className="account-balance-label">Ledger Balance</p>
                      <h2 className="account-balance-amount">{formatCurrency(balances[acc._id] || 0)}</h2>
                    </div>

                    <div className="account-card-footer">
                      <span className="account-status">
                        <span className="status-dot active"></span>
                        {acc.status}
                      </span>
                      <span className="account-currency">{acc.currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ledger History */}
          <div className="ledger-section">
            <h2 className="section-title">
              <Clock size={20} className="gradient-text" />
              Double-Entry Ledger
            </h2>

            {loading ? (
              <div className="empty-state">
                <RefreshCw className="empty-state-icon" style={{ animation: 'spin 2s linear infinite' }} />
                <p>Loading ledger details...</p>
              </div>
            ) : ledger.length === 0 ? (
              <div className="glass-card empty-state">
                <Clock className="empty-state-icon" size={48} />
                <p>No transaction history.</p>
                <p style={{ fontSize: '0.875rem' }}>Fund your account or transfer money to see your transactions.</p>
              </div>
            ) : (
              <div className="ledger-container">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Opposite Account</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => {
                      const isDebit = entry.type === 'debit';
                      const tx = entry.transaction || {};
                      
                      // For a given ledger entry, the "opposite" account is either the fromAccount or toAccount depending on type
                      let oppositeAccId = 'N/A';
                      if (tx) {
                        const fromAccId = typeof tx.fromAccount === 'object' ? tx.fromAccount?._id : tx.fromAccount;
                        const toAccId = typeof tx.toAccount === 'object' ? tx.toAccount?._id : tx.toAccount;
                        oppositeAccId = isDebit ? toAccId : fromAccId;
                      }

                      // Check if opposite account is the Bank Reserve system user
                      const oppositeDetails = oppositeAccId || 'System Reserve';

                      return (
                        <tr key={entry._id} className="animated-fade-in">
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(entry.createdAt || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            ...{entry.account?.substring(entry.account.length - 8)}
                          </td>
                          <td>
                            <span className={`badge ${isDebit ? 'badge-failed' : 'badge-completed'}`} style={{ fontSize: '0.7rem' }}>
                              {entry.type}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {oppositeDetails !== 'System Reserve' && typeof oppositeDetails === 'string'
                              ? `...${oppositeDetails.substring(oppositeDetails.length - 8)}`
                              : oppositeDetails}
                          </td>
                          <td className={`tx-amount ${isDebit ? 'debit' : 'credit'}`}>
                            {isDebit ? '-' : '+'}{formatCurrency(entry.amount)}
                          </td>
                          <td>
                            <span className={`badge badge-${tx.status?.toLowerCase() || 'completed'}`}>
                              {tx.status || 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Actions Panel */}
        <section className="side-section">
          <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <div className="panel-tabs">
              <button 
                className={`tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
                onClick={() => setActiveTab('transfer')}
              >
                <Send size={16} style={{ marginRight: '4px', display: 'inline' }} />
                Send Funds
              </button>
              <button 
                className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
                onClick={() => setActiveTab('deposit')}
              >
                <Landmark size={16} style={{ marginRight: '4px', display: 'inline' }} />
                Add Funds
              </button>
            </div>

            {accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)' }}>
                <Info size={24} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.9rem' }}>Please create a bank account first to enable transactions.</p>
              </div>
            ) : activeTab === 'transfer' ? (
              /* TRANSFER FORM */
              <form onSubmit={handleTransfer} className="animated-fade-in">
                <div className="form-group">
                  <label className="form-label">Source Account</label>
                  <select 
                    className="form-input" 
                    value={transferFrom} 
                    onChange={(e) => setTransferFrom(e.target.value)}
                    required
                  >
                    {accounts.map((acc, index) => (
                      <option key={acc._id} value={acc._id}>
                        Account #{index + 1} (...{acc._id.substring(acc._id.length - 8)}) - {formatCurrency(balances[acc._id] || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Recipient Account ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 24-character Account ID"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    maxLength={24}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (INR)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="1"
                      style={{ paddingLeft: '2rem' }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={btnLoading || loading || !transferAmount || Number(transferAmount) <= 0}
                  style={{ marginTop: '1rem' }}
                >
                  {btnLoading ? 'Processing Transfer...' : <>Send Money <ArrowUpRight size={18} /></>}
                </button>
              </form>
            ) : (
              /* DEPOSIT FORM */
              <form onSubmit={handleDeposit} className="animated-fade-in">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(14, 165, 233, 0.15)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  <Info size={28} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong>Note:</strong> Initial funding is processed as a bank ledger creation. The bank's System Reserve will issue and transfer funds into your selected account.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Account</label>
                  <select 
                    className="form-input" 
                    value={depositTo} 
                    onChange={(e) => setDepositTo(e.target.value)}
                    required
                  >
                    {accounts.map((acc, index) => (
                      <option key={acc._id} value={acc._id}>
                        Account #{index + 1} (...{acc._id.substring(acc._id.length - 8)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Funding Amount (INR)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="1"
                      style={{ paddingLeft: '2rem' }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={btnLoading || loading || !depositAmount || Number(depositAmount) <= 0}
                  style={{ marginTop: '1rem' }}
                >
                  {btnLoading ? 'Processing Funding...' : <>Deposit Funds <ArrowDownLeft size={18} /></>}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      
      {/* CSS Spin style for Lucide loader */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
