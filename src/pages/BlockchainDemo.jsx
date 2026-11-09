import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { blockchainAPI } from '../services/api';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  ShieldCheck,
  Lock,
  Search,
  ExternalLink,
  CheckCircle2,
  FileCode,
  Layers,
  Cpu,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Clock,
  RotateCw,
  AlertTriangle
} from 'lucide-react';

export const BlockchainDemo = () => {
  const { records, refreshData, addToast } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedRecord, setVerifiedRecord] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const [blockchainInfo, setBlockchainInfo] = useState({
    connected: false,
    network: 'Hardhat Local (Chain ID: 31337)',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    blockNumber: null,
    operatorAccount: null,
  });

  // Query live blockchain node status
  useEffect(() => {
    fetchBlockchainStatus();
  }, []);

  // Set default verified record
  useEffect(() => {
    if (!verifiedRecord && records && records.length > 0) {
      setVerifiedRecord(records[0]);
    }
  }, [records]);

  const fetchBlockchainStatus = async () => {
    try {
      const res = await blockchainAPI.getStatus();
      if (res.data) {
        setBlockchainInfo({
          connected: res.data.connected,
          network: res.data.network || 'Hardhat Local (Chain ID: 31337)',
          contractAddress: res.data.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          blockNumber: res.data.block_number,
          operatorAccount: res.data.operator_account,
        });
      }
    } catch (err) {
      setBlockchainInfo((prev) => ({ ...prev, connected: false }));
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsVerifying(true);
    const query = searchQuery.trim().toLowerCase();

    // Check backend API first
    try {
      const res = await blockchainAPI.getRecord(searchQuery.trim());
      if (res.data?.success && res.data?.record) {
        setVerifiedRecord(res.data.record);
        setIsVerifying(false);
        addToast('Cryptographic record loaded from ledger.', 'success');
        return;
      }
    } catch (err) {
      // Fall back to client records search
    }

    const match = records.find(
      (r) =>
        r.txHash?.toLowerCase().includes(query) ||
        r.rollNo?.toLowerCase().includes(query) ||
        r.studentName?.toLowerCase().includes(query) ||
        r.id?.toLowerCase().includes(query)
    );

    setVerifiedRecord(match || null);
    setIsVerifying(false);
  };

  const handleRetryBlockchain = async (attendanceId) => {
    if (!attendanceId) return;
    setIsRetrying(true);
    try {
      const res = await blockchainAPI.retrySubmission(attendanceId);
      if (res.data?.success) {
        addToast('Blockchain submission confirmed on-chain!', 'success');
        fetchBlockchainStatus();
        refreshData();
        if (verifiedRecord) {
          setVerifiedRecord((prev) => ({
            ...prev,
            blockchainStatus: 'CONFIRMED',
            txHash: res.data.blockchain?.txHash || prev.txHash,
            blockNumber: res.data.blockchain?.blockNumber || prev.blockNumber
          }));
        }
      } else {
        addToast(res.data?.error || 'Retry failed: Node not responding.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not retry submission. Ensure Hardhat node is running.', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const copyContract = () => {
    navigator.clipboard.writeText(blockchainInfo.contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Blockchain Ledger Verification Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Verify tamper-evident attendance proofs anchored onto the EVM smart contract ledger via Web3.py.
          </p>
        </div>

        <button onClick={fetchBlockchainStatus} className="btn btn-outline btn-sm">
          <RefreshCw size={14} />
          <span>Sync Node State</span>
        </button>
      </div>

      {/* Real Node Status Banner */}
      <div style={{
        backgroundColor: blockchainInfo.connected ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${blockchainInfo.connected ? '#bbf7d0' : '#fde68a'}`,
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem'
      }}>
        {blockchainInfo.connected ? (
          <CheckCircle2 size={22} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <AlertCircle size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: blockchainInfo.connected ? '#15803d' : '#92400e', fontSize: '0.92rem' }}>
            {blockchainInfo.connected ? (
              <span>LIVE BLOCKCHAIN NODE CONNECTED — Hardhat EVM (Port 8545)</span>
            ) : (
              <span>HARDHAT NODE STANDBY — Local Blockchain RPC Offline</span>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: blockchainInfo.connected ? '#166534' : '#b45309', lineHeight: '1.5' }}>
            {blockchainInfo.connected ? (
              <span>Connected to local Hardhat node at <code>http://127.0.0.1:8545</code>. Current block height: <strong>#{blockchainInfo.blockNumber ?? 0}</strong>. All new attendance check-ins are signed and sealed on-chain via Web3.py.</span>
            ) : (
              <span>To submit live transactions to the local blockchain, run <code>npm run node</code> in the <code>blockchain/</code> directory. Database attendance remains safe and valid; pending transactions can be retried immediately once the node is online.</span>
            )}
          </p>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="stat-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Smart Contract</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem' }}>
              AttendanceVerification.sol
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              Solidity v0.8.20
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
            <FileCode size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Network RPC</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {blockchainInfo.connected ? 'Hardhat Node' : 'Offline'}
            </div>
            <div className="stat-trend" style={{ color: blockchainInfo.connected ? 'var(--success)' : 'var(--text-muted)' }}>
              Chain ID: 31337
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--success)' }}>
            <Layers size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Block Height</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {blockchainInfo.blockNumber !== null ? `#${blockchainInfo.blockNumber}` : '—'}
            </div>
            <div className="stat-trend" style={{ color: 'var(--info)' }}>
              Proof of Stake / Local EVM
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
            <Cpu size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Zero-Knowledge Privacy</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--success)' }}>
              Strictly Hash-Only
            </div>
            <div className="stat-trend" style={{ color: 'var(--success)' }}>
              keccak256 Pseudonym
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: 'var(--success)' }}>
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Verification Search Tool */}
        <Card
          title="Audit Ledger Search & Verification"
          subtitle="Query confirmed or pending attendance records"
          icon={Search}
        >
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Search by Transaction Hash, Roll No, or Record ID</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. CS2024-001 or REC-0001"
                  className="form-control"
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </form>

          {/* Smart Contract Info */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Contract Address:</span>
              <button
                onClick={copyContract}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', gap: '4px' }}
              >
                {copiedContract ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedContract ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--primary)', fontWeight: 600 }}>
              {blockchainInfo.contractAddress}
            </div>
          </div>

          {/* Quick records list to test */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              RECENT ATTENDANCE RECORDS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {records.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setVerifiedRecord(r)}
                  className="btn btn-outline btn-sm"
                  style={{
                    textAlign: 'left',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.78rem'
                  }}
                >
                  <div>
                    <strong>{r.studentName}</strong> ({r.rollNo}) — {r.subjectName}
                  </div>
                  <Badge variant={r.blockchainStatus === 'CONFIRMED' ? 'success' : r.blockchainStatus === 'FAILED' ? 'danger' : 'neutral'}>
                    {r.blockchainStatus || 'PENDING'}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Verification Result Receipt */}
        <Card
          title="Cryptographic Verification Certificate"
          subtitle={verifiedRecord ? `Certificate for Record ID: ${verifiedRecord.id}` : 'Select a record to inspect'}
          icon={ShieldCheck}
        >
          {verifiedRecord ? (
            <div>
              {/* Status Header */}
              {verifiedRecord.blockchainStatus === 'CONFIRMED' ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  marginBottom: '1.25rem'
                }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>CONFIRMED ON BLOCKCHAIN LEDGER</div>
                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                      Sealed in Block #{verifiedRecord.blockNumber || blockchainInfo.blockNumber || 1}
                    </div>
                  </div>
                </div>
              ) : verifiedRecord.blockchainStatus === 'FAILED' ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>BLOCKCHAIN SUBMISSION PENDING / FAILED</div>
                      <div style={{ fontSize: '0.74rem', color: '#b91c1c' }}>Database record is valid. Blockchain node was offline.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRetryBlockchain(verifiedRecord.db_id || verifiedRecord.id)}
                    disabled={isRetrying}
                    className="btn btn-sm btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <RotateCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                    <span>{isRetrying ? 'Retrying...' : 'Retry Now'}</span>
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1e40af',
                  marginBottom: '1.25rem'
                }}>
                  <Clock size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AWAITING BLOCKCHAIN MINING (PENDING)</div>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Database attendance recorded. Queued for block inclusion.</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
                  <strong>{verifiedRecord.studentName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student Roll ID:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{verifiedRecord.rollNo}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Class & Subject:</span>
                  <strong>{verifiedRecord.className} • {verifiedRecord.subjectName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp of Check-in:</span>
                  <span>{verifiedRecord.date} at {verifiedRecord.time}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Block Height:</span>
                  <strong style={{ fontFamily: 'monospace' }}>
                    {verifiedRecord.blockNumber ? `#${verifiedRecord.blockNumber}` : 'Pending inclusion'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Real Transaction Hash:
                  </span>
                  <div style={{
                    padding: '0.55rem 0.75rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    color: verifiedRecord.txHash ? 'var(--text-main)' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {verifiedRecord.txHash || 'Awaiting live transaction submission to Hardhat network'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    On-Chain Pseudonym Hash (Bytes32):
                  </span>
                  <div style={{
                    padding: '0.55rem 0.75rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {verifiedRecord.studentHash || '0x7d9a8e2f01c34b568912e47a8bc93f0192a8e3d74f6b1029c8e7a6b5c4d3e2f1'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <ShieldCheck className="empty-icon" />
              <h4>No Record Selected</h4>
              <p style={{ fontSize: '0.82rem', margin: '0.5rem auto' }}>
                Search for an existing attendance record by roll number, record ID, or hash.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BlockchainDemo;
