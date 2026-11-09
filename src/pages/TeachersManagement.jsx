import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

export const TeachersManagement = () => {
  const { teachers, saveTeacher, deleteTeacher } = useAttendance();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    subjects: 'Blockchain Technology, Computer Networks',
    assignedClasses: 'CS - 4th Sem (Sec A)',
  });

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '+1 (555) 000-0000',
      department: 'Computer Science',
      subjects: 'Operating Systems',
      assignedClasses: 'CS - 4th Sem (Sec B)',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone || '',
      department: t.department,
      subjects: Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects,
      assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses.join(', ') : t.assignedClasses,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveTeacher({
      ...formData,
      subjects: formData.subjects.split(',').map((s) => s.trim()),
      assignedClasses: formData.assignedClasses.split(',').map((c) => c.trim()),
      id: editingTeacher ? editingTeacher.id : undefined,
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteTeacher(id);
    setDeleteConfirmId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Faculty & Lecturer Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Manage teaching faculty, assigned course subjects, and classroom lecture authorizations.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search faculty by name, department, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control search-input"
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filteredTeachers.map((tch) => (
          <Card key={tch.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    {tch.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {tch.name}
                    </h3>
                    <Badge variant="info" style={{ marginTop: '0.2rem' }}>
                      {tch.department}
                    </Badge>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => handleOpenEdit(tch)} className="btn btn-outline btn-sm" style={{ padding: '0.3rem' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(tch.id)} className="btn btn-outline btn-sm" style={{ padding: '0.3rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} color="var(--primary)" />
                  <span>{tch.email}</span>
                </div>
                {tch.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} color="var(--primary)" />
                    <span>{tch.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Assigned Subjects
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(Array.isArray(tch.subjects) ? tch.subjects : [tch.subjects]).map((sub, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: 'var(--text-main)',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Faculty Portfolio' : 'Add New Faculty Member'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name & Title</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-control"
                placeholder="Dr. Jane Doe"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">College Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-control"
                placeholder="jane.doe@demo.edu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Subjects (comma-separated)</label>
              <input
                type="text"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                className="form-control"
                placeholder="Blockchain Technology, Computer Networks"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Faculty Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Removal"
        maxWidth="440px"
      >
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <AlertTriangle size={42} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <h4>Remove faculty member?</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This will dissociate the instructor from active attendance generator access.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button onClick={() => setDeleteConfirmId(null)} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={() => handleDelete(deleteConfirmId)} className="btn btn-danger btn-sm">
            Yes, Remove
          </button>
        </div>
      </Modal>
    </div>
  );
};
