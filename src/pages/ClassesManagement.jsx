import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search
} from 'lucide-react';

export const ClassesManagement = () => {
  const { classes, subjects, teachers, saveClass, deleteClass, saveSubject, deleteSubject } = useAttendance();

  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'subjects'
  const [search, setSearch] = useState('');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', department: 'Computer Science', semester: '4th', studentCount: 40 });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', teacherId: '' });

  // Filtered
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.department.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  // Class submit
  const handleClassSubmit = (e) => {
    e.preventDefault();
    saveClass({
      ...classForm,
      studentCount: Number(classForm.studentCount),
      id: editingClass ? editingClass.id : undefined,
    });
    setIsClassModalOpen(false);
  };

  // Subject submit
  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    const tch = teachers.find((t) => t.id === subjectForm.teacherId);
    saveSubject({
      ...subjectForm,
      teacherName: tch ? tch.name : 'Dr. Robert Vance',
      id: editingSubject ? editingSubject.id : undefined,
    });
    setIsSubjectModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Classes & Academic Subjects
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Structure semesters, create course subjects, and assign designated faculty instructors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'classes' ? (
            <button
              onClick={() => {
                setEditingClass(null);
                setClassForm({ name: '', department: 'Computer Science', semester: '4th', studentCount: 40 });
                setIsClassModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span>Add Class / Section</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectForm({ name: '', code: '', classId: classes[0]?.id || '', teacherId: teachers[0]?.id || '' });
                setIsSubjectModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span>Add Course Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('classes')}
            className={`btn btn-sm ${activeTab === 'classes' ? 'btn-primary' : 'btn-outline'}`}
          >
            <BookOpen size={16} />
            <span>Class Batches ({classes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`btn btn-sm ${activeTab === 'subjects' ? 'btn-primary' : 'btn-outline'}`}
          >
            <GraduationCap size={16} />
            <span>Subjects ({subjects.length})</span>
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control search-input"
          />
        </div>
      </div>

      {/* Tab Content: Classes */}
      {activeTab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredClasses.map((cls) => (
            <Card key={cls.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {cls.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {cls.department} • Semester: {cls.semester}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => {
                      setEditingClass(cls);
                      setClassForm(cls);
                      setIsClassModalOpen(true);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0.3rem' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteClass(cls.id)}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0.3rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Enrolled Students:</span>
                <Badge variant="info">
                  <Users size={12} />
                  {cls.studentCount || 40} Students
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Content: Subjects */}
      {activeTab === 'subjects' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Course Name</th>
                <th>Assigned Instructor</th>
                <th>Target Batch</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {sub.code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{sub.name}</td>
                  <td>{sub.teacherName || 'Assigned Faculty'}</td>
                  <td>
                    <Badge variant="neutral">
                      {classes.find((c) => c.id === sub.classId)?.name || 'CS - 4th Sem (Sec A)'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setSubjectForm(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.35rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteSubject(sub.id)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.35rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Class Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? 'Edit Class / Section' : 'Create Class Batch'}
      >
        <form onSubmit={handleClassSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                className="form-control"
                placeholder="e.g. CS - 4th Sem (Sec C)"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={classForm.department}
                  onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input
                  type="text"
                  value={classForm.semester}
                  onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Student Capacity</label>
              <input
                type="number"
                value={classForm.studentCount}
                onChange={(e) => setClassForm({ ...classForm, studentCount: e.target.value })}
                className="form-control"
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsClassModalOpen(false)} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Course Subject'}
      >
        <form onSubmit={handleSubjectSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Subject Code</label>
              <input
                type="text"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                className="form-control"
                placeholder="CS405"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course Title</label>
              <input
                type="text"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                className="form-control"
                placeholder="Compiler Design"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Class</label>
              <select
                value={subjectForm.classId}
                onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
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
              <label className="form-label">Assigned Faculty</label>
              <select
                value={subjectForm.teacherId}
                onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                className="form-control form-select"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
