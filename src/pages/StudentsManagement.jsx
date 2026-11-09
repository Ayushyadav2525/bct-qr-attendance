import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Filter
} from 'lucide-react';

export const StudentsManagement = () => {
  const { students, classes, saveStudent, deleteStudent } = useAttendance();

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    department: 'Computer Science',
    semester: '4th',
    classId: classes[0]?.id || 'CLS-CS4A',
    attendancePct: 85,
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      rollNo: `CS2024-${(students.length + 1).toString().padStart(3, '0')}`,
      email: '',
      department: 'Computer Science',
      semester: '4th',
      classId: classes[0]?.id || 'CLS-CS4A',
      attendancePct: 85,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      department: student.department,
      semester: student.semester,
      classId: student.classId || classes[0]?.id,
      attendancePct: student.attendancePct || 85,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedClass = classes.find((c) => c.id === formData.classId);
    saveStudent({
      ...formData,
      className: selectedClass ? selectedClass.name : 'CS - 4th Sem (Sec A)',
      id: editingStudent ? editingStudent.id : undefined,
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteStudent(id);
    setDeleteConfirmId(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Student Directory Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Register, edit, and track semester attendance records for enrolled college students.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control search-input"
          />
        </div>

        <div className="toolbar-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Class:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="form-control form-select"
              style={{ width: 'auto' }}
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Class / Section</th>
              <th>Department</th>
              <th>Attendance Rate</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No students matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((stu) => {
                const isWarning = (stu.attendancePct || 85) < 75;
                return (
                  <tr key={stu.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {stu.rollNo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{stu.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{stu.email}</div>
                    </td>
                    <td>{stu.className || 'CS - 4th Sem'}</td>
                    <td>{stu.department}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: isWarning ? 'var(--danger)' : 'var(--text-main)' }}>
                          {stu.attendancePct || 85}%
                        </span>
                        <div style={{ width: '50px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${stu.attendancePct || 85}%`,
                            height: '100%',
                            backgroundColor: isWarning ? 'var(--danger)' : 'var(--primary)'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={isWarning ? 'danger' : 'success'}>
                        {isWarning ? 'Low (<75%)' : 'Eligible'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenEdit(stu)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem' }}
                          title="Edit Student"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(stu.id)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                          title="Delete Student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Details' : 'Register New Student'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-control"
                placeholder="e.g. Jordan Smith"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Roll Number / ID</label>
                <input
                  type="text"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="form-control"
                  placeholder="e.g. 4th"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">College Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-control"
                placeholder="student@demo.edu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Class / Batch</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="form-control form-select"
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Student Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Student Deletion"
        maxWidth="440px"
      >
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <AlertTriangle size={42} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Are you sure you want to delete this student?
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This action will remove the student from active rosters and cannot be undone in this session.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button onClick={() => setDeleteConfirmId(null)} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={() => handleDelete(deleteConfirmId)} className="btn btn-danger btn-sm">
            Yes, Delete Student
          </button>
        </div>
      </Modal>
    </div>
  );
};
