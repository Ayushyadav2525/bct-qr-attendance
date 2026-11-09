export const exportAttendanceToCSV = (records, filename = 'attendance_report.csv') => {
  if (!records || records.length === 0) {
    alert('No attendance records available to export.');
    return;
  }

  const headers = [
    'Record ID',
    'Student Roll No',
    'Student Name',
    'Class',
    'Subject',
    'Date',
    'Time',
    'Status',
    'Verification Method',
    'Mock Blockchain Tx Hash',
    'Block Number'
  ];

  const rows = records.map((r) => [
    `"${r.id || ''}"`,
    `"${r.rollNo || ''}"`,
    `"${r.studentName || ''}"`,
    `"${r.className || ''}"`,
    `"${r.subjectName || ''}"`,
    `"${r.date || ''}"`,
    `"${r.time || ''}"`,
    `"${r.status || ''}"`,
    `"${r.method || ''}"`,
    `"${r.txHash || ''}"`,
    `"${r.blockNumber || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
