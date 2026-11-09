import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  User,
  Mail,
  Shield,
  GraduationCap,
  BookOpen,
  Hash,
  Building,
  KeyRound,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const UserProfile = () => {
  const { currentUser } = useAuth();

  const role = currentUser?.role || 'admin';

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          User Profile & Credentials
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
          Personal academic profile, cryptographic student pseudonym identifier, and role privileges.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Profile Details Card */}
        <Card title="Account Overview" subtitle="Registered Institutional Information" icon={User}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              {currentUser?.avatar || currentUser?.name?.slice(0, 2)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {currentUser?.name || 'Authorized User'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <Badge variant={role === 'admin' ? 'danger' : role === 'teacher' ? 'info' : 'success'}>
                  {role.toUpperCase()}
                </Badge>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  ID: {currentUser?.id || currentUser?.rollNo || 'USR-001'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> Official Email
              </span>
              <strong style={{ color: 'var(--text-main)' }}>{currentUser?.email || 'user@demo.edu'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} /> Department
              </span>
              <strong style={{ color: 'var(--text-main)' }}>{currentUser?.department || 'Computer Science'}</strong>
            </div>

            {role === 'student' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Hash size={16} /> Roll Number
                  </span>
                  <strong style={{ fontFamily: 'monospace' }}>{currentUser?.rollNo || 'CS2024-001'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={16} /> Enrolled Class
                  </span>
                  <strong>{currentUser?.className || 'CS - 4th Sem (Sec A)'}</strong>
                </div>
              </>
            )}

            {role === 'teacher' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={16} /> Assigned Subjects
                </span>
                <div style={{ textAlign: 'right' }}>
                  {(currentUser?.subjects || ['Blockchain Technology', 'Computer Networks']).map((s, i) => (
                    <div key={i} style={{ fontWeight: 600 }}>{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Security & Cryptographic Identity Card */}
        <Card title="Blockchain Cryptographic Identity" subtitle="Zero-Knowledge Pseudonymity" icon={KeyRound}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #bfdbfe',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            color: '#1e40af'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} /> Privacy-Preserving On-Chain Pseudonym
            </div>
            To comply with data privacy standards, student names, phone numbers, and emails are <strong>never stored on the public blockchain</strong>. Only a salted keccak256 hash is sealed on-chain.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.84rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Calculated On-Chain Identifier (Bytes32):
              </span>
              <div style={{
                padding: '0.65rem 0.75rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                wordBreak: 'break-all',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)'
              }}>
                0x7d9a8e2f01c34b568912e47a8bc93f0192a8e3d74f6b1029c8e7a6b5c4d3e2f1
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Role Access Level:</span>
              <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} /> Authenticated ({role})
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Auth Token Status:</span>
              <strong style={{ color: 'var(--primary)' }}>Active JWT Session</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
