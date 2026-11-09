import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  Sparkles,
  RefreshCw,
  QrCode
} from 'lucide-react';

export const QRScanner = () => {
  const { sessions, markAttendance, addToast } = useAttendance();
  const { currentUser } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [selectedSessionToken, setSelectedSessionToken] = useState('');

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((err) => console.log('Scanner stop err:', err));
      }
    };
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    setScanResult(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        handleProcessScan(decodedText, 'Camera Scan');
        stopScanner();
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // Frame by frame error, silent
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Camera startup error:', err);
      setIsScanning(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera permissions in your browser or use the manual demo entry below.'
          : `Camera not accessible: ${err.message || 'No video input device detected.'} You can use the manual demo check-in below.`
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error('Failed to stop scanner:', e);
      }
    }
    setIsScanning(false);
  };

  const handleProcessScan = async (tokenToVerify, method = 'QR Camera') => {
    if (!tokenToVerify) {
      addToast('Please provide a session token.', 'error');
      return;
    }

    const studentId = currentUser?.role === 'student' ? currentUser.id : 'STU-001';

    const res = await markAttendance({
      token: tokenToVerify.trim(),
      studentId,
      method,
    });

    if (res.success) {
      setScanResult({
        type: 'success',
        title: 'Attendance Verified & Recorded!',
        message: `Successfully verified presence for ${res.record?.subjectName || 'Course Session'}.`,
        record: res.record,
        blockchain: res.blockchain,
      });
    } else {
      setScanResult({
        type: 'error',
        title: 'Check-in Failed',
        message: res.error,
      });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScan(manualCode.trim(), 'Manual Entry');
  };

  const handleSelectActiveDemo = (token) => {
    setSelectedSessionToken(token);
    setManualCode(token);
    handleProcessScan(token, 'One-Click Demo Scan');
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          QR Code Attendance Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
          Scan the classroom attendance QR code using your device camera or test with active demo sessions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Camera Scanner View */}
        <Card
          title="Live Camera Scanner"
          subtitle="Point your camera towards the projected classroom QR"
          icon={Camera}
        >
          {/* Viewfinder Element */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #334155'
          }}>
            <div id={scannerContainerId} style={{ width: '100%' }} />

            {!isScanning && (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <Camera size={48} style={{ margin: '0 auto 1rem', color: '#64748b' }} />
                <p style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>
                  Camera is currently idle.
                </p>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  Click below to enable webcam or mobile camera.
                </p>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              color: '#92400e',
              fontSize: '0.82rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Notice:</strong> {cameraError}
              </div>
            </div>
          )}

          {/* Controls */}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {!isScanning ? (
              <button onClick={startScanner} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                <Camera size={18} />
                <span>Start Camera Scanner</span>
              </button>
            ) : (
              <button onClick={stopScanner} className="btn btn-danger" style={{ padding: '0.65rem 1.5rem' }}>
                <CameraOff size={18} />
                <span>Stop Scanner</span>
              </button>
            )}
          </div>
        </Card>

        {/* Scan Results & Manual Demo Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Result Card if scanned */}
          {scanResult && (
            <Card
              className={scanResult.type === 'success' ? 'badge-success' : 'badge-danger'}
              style={{
                backgroundColor: scanResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
                borderColor: scanResult.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                {scanResult.type === 'success' ? (
                  <CheckCircle2 size={26} style={{ color: 'var(--success)', flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={26} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: scanResult.type === 'success' ? '#166534' : '#991b1b',
                    margin: 0
                  }}>
                    {scanResult.title}
                  </h4>
                  <p style={{
                    fontSize: '0.86rem',
                    color: scanResult.type === 'success' ? '#15803d' : '#b91c1c',
                    margin: '0.25rem 0 0.5rem'
                  }}>
                    {scanResult.message}
                  </p>

                  {scanResult.record && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#ffffff',
                      border: '1px solid #dcfce7',
                      fontSize: '0.78rem'
                    }}>
                      <div><strong>Student:</strong> {scanResult.record.studentName} ({scanResult.record.rollNo})</div>
                      <div><strong>Subject:</strong> {scanResult.record.subjectName}</div>
                      <div><strong>Time:</strong> {scanResult.record.date} at {scanResult.record.time}</div>
                      {scanResult.blockchain?.tx_hash || scanResult.record?.txHash ? (
                        <div style={{ wordBreak: 'break-all', marginTop: '0.35rem' }}>
                          <strong>Blockchain Tx Hash:</strong>{' '}
                          <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                            {scanResult.blockchain?.tx_hash || scanResult.record?.txHash}
                          </span>{' '}
                          <span className={`badge ${(scanResult.blockchain?.status === 'CONFIRMED' || scanResult.record?.blockchainStatus === 'CONFIRMED') ? 'badge-success' : 'badge-warning'}`}>
                            {scanResult.blockchain?.status || scanResult.record?.blockchainStatus || 'PENDING'}
                          </span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.35rem' }}>
                          <strong>Blockchain Status:</strong>{' '}
                          <span className={`badge ${(scanResult.blockchain?.status === 'CONFIRMED' || scanResult.record?.blockchainStatus === 'CONFIRMED') ? 'badge-success' : 'badge-warning'}`}>
                            {scanResult.blockchain?.status || scanResult.record?.blockchainStatus || 'RECORDED IN DATABASE (PENDING ON-CHAIN)'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Manual Demo Check-in Form */}
          <Card
            title="Manual Demo Code Entry"
            subtitle="Guaranteed testing without camera hardware"
            icon={Sparkles}
          >
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="manual-token-input">QR Token or Session ID</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="manual-token-input"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. QR-SUB-BC401-..."
                    className="form-control"
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    <Send size={16} />
                    <span>Verify</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Quick 1-Click Active Sessions */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                CURRENT ACTIVE DEMO SESSIONS (CLICK TO TEST SCAN):
              </div>

              {sessions.filter((s) => (s.status || '').toUpperCase() === 'OPEN' || s.status === 'Active').length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No active sessions found. Go to QR Generator to create one!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sessions
                    .filter((s) => (s.status || '').toUpperCase() === 'OPEN' || s.status === 'Active')
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectActiveDemo(s.token)}
                        className="btn btn-outline btn-sm"
                        style={{
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          padding: '0.65rem 0.85rem',
                          borderColor: 'var(--primary-border)',
                          backgroundColor: 'var(--primary-light)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            {s.subjectName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {s.className} • Token: {s.token}
                          </div>
                        </div>
                        <Badge variant="success">Scan Now</Badge>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
