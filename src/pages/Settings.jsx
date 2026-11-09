import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { blockchainAPI } from '../services/api';
import {
  Settings as SettingsIcon,
  Database,
  Cpu,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ShieldCheck,
  Save,
  Radio,
  Lock
} from 'lucide-react';

export const Settings = () => {
  const { addToast, resetAllData } = useAttendance();
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ padding: '2rem 1rem', maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div style={{
          padding: '2.5rem 2rem',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Lock size={30} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Administrator Access Only
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            System infrastructure, blockchain RPC endpoints, and database configurations are restricted to College Administrators.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Current Logged-in Role: <strong style={{ color: 'var(--text-main)' }}>{currentUser?.role?.toUpperCase()}</strong>
          </div>
        </div>
      </div>
    );
  }

  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [blockchainStatus, setBlockchainStatus] = useState({
    connected: false,
    network: 'Hardhat Local (Chain ID: 31337)',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    latestBlock: 0,
  });

  const [qrDefaults, setQrDefaults] = useState({
    defaultDurationMinutes: 15,
    allowManualCheckIn: true,
    enforceEnrollment: true,
    autoBlockDuplicates: true,
  });

  const [dbSettings, setDbSettings] = useState({
    engine: 'SQLite (Primary Development)',
    mysqlFallback: 'MySQL 8.0 Supported via DATABASE_URL',
    status: 'Operational',
  });

  // Check health on mount
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setBackendStatus('checking');
    try {
      const res = await blockchainAPI.getStatus();
      if (res.data) {
        setBackendStatus('connected');
        setBlockchainStatus({
          connected: res.data.connected,
          network: res.data.network || 'Hardhat Local (Chain ID: 31337)',
          contractAddress: res.data.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          latestBlock: res.data.block_number || 0,
        });
        addToast('Connected to Flask Backend & Web3.py!', 'success');
      }
    } catch (err) {
      setBackendStatus('offline');
      setBlockchainStatus((prev) => ({ ...prev, connected: false }));
      addToast('Backend not detected on :5000. Operating in LocalStorage Mode.', 'info');
    }
  };

  const handleSaveQrSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('qr_att_settings', JSON.stringify(qrDefaults));
    addToast('Attendance security settings saved.', 'success');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            System Settings & Infrastructure
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Configure database connectivity, blockchain node RPC endpoints, and QR anti-proxy parameters.
          </p>
        </div>

        <button onClick={checkSystemHealth} className="btn btn-outline btn-sm">
          <RefreshCw size={15} />
          <span>Test Infrastructure Connectivity</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Backend & Database Health */}
        <Card title="Database & Flask Services" subtitle="Operational Backend Engines" icon={Server}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Flask REST API Service:</span>
              <Badge variant={backendStatus === 'connected' ? 'success' : backendStatus === 'checking' ? 'neutral' : 'warning'}>
                {backendStatus === 'connected' ? 'Connected (Port 5000)' : backendStatus === 'checking' ? 'Probing...' : 'Offline (LocalStorage Fallback)'}
              </Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Database Engine:</span>
              <strong style={{ color: 'var(--text-main)' }}>{dbSettings.engine}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>MySQL 8+ Production Mode:</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Supported via <code>DATABASE_URL</code></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database State:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} /> Synchronized & Healthy
              </span>
            </div>

            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={resetAllData}
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', width: '100%', justifyContent: 'center' }}
              >
                Restore Factory Demo Data
              </button>
            </div>
          </div>
        </Card>

        {/* Blockchain Node & Contract Configuration */}
        <Card title="Hardhat Blockchain & Web3.py" subtitle="Decentralized Verification Ledger" icon={Cpu}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blockchain RPC Status:</span>
              <Badge variant={blockchainStatus.connected ? 'success' : 'neutral'}>
                {blockchainStatus.connected ? 'Connected (Hardhat Node)' : 'Awaiting Hardhat Node'}
              </Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Network:</span>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>{blockchainStatus.network}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>RPC Node URL:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>http://127.0.0.1:8545</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Deployed Smart Contract Address:
              </span>
              <div style={{
                padding: '0.55rem 0.75rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                wordBreak: 'break-all',
                color: 'var(--primary)',
                fontWeight: 600,
                border: '1px solid var(--border-color)'
              }}>
                {blockchainStatus.contractAddress}
              </div>
            </div>
          </div>
        </Card>

        {/* QR Anti-Proxy & Expiration Policies */}
        <Card title="QR Attendance Policies" subtitle="Anti-Proxy Validation Rules" icon={Clock} style={{ gridColumn: '1 / -1' }}>
          <form onSubmit={handleSaveQrSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Default QR Expiration Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={qrDefaults.defaultDurationMinutes}
                  onChange={(e) => setQrDefaults({ ...qrDefaults, defaultDurationMinutes: Number(e.target.value) })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duplicate Attendance Prevention</label>
                <select
                  value={qrDefaults.autoBlockDuplicates ? 'true' : 'false'}
                  onChange={(e) => setQrDefaults({ ...qrDefaults, autoBlockDuplicates: e.target.value === 'true' })}
                  className="form-control form-select"
                >
                  <option value="true">Strict: Reject duplicate scan on same day</option>
                  <option value="false">Relaxed: Allow re-check-in</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Class Enrollment Enforcement</label>
                <select
                  value={qrDefaults.enforceEnrollment ? 'true' : 'false'}
                  onChange={(e) => setQrDefaults({ ...qrDefaults, enforceEnrollment: e.target.value === 'true' })}
                  className="form-control form-select"
                >
                  <option value="true">Strict: Only enrolled batch students may scan</option>
                  <option value="false">Auditor mode: Allow any verified student</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={15} />
                <span>Save System Parameters</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
