/* Dashboard Elements */
const filterClass = document.getElementById('filterClass');
const filterCommunication = document.getElementById('filterCommunication');
const filterWellbeing = document.getElementById('filterWellbeing');
const exportBtn = document.getElementById('exportBtn');
const submissionsTable = document.getElementById('submissionsTable');
const totalCount = document.getElementById('totalCount');
const commCount1 = document.getElementById('commCount1');
const commCount2 = document.getElementById('commCount2');
const commCount3 = document.getElementById('commCount3');
const wellGreen = document.getElementById('wellGreen');
const wellYellow = document.getElementById('wellYellow');
const wellRed = document.getElementById('wellRed');

/* Get Saved Submissions from LocalStorage */
function getSavedSubmissions() {
  try {
    const raw = localStorage.getItem('studentMappingSubmissions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return [];
  }
}

/* Populate Filter Dropdown with Unique Classes */
function setFilterOptions(submissions) {
  const titles = new Set(['all']);
  
  submissions.forEach(item => {
    titles.add(`${item.className} - ${item.teacherName}`);
  });
  
  filterClass.innerHTML = '<option value="all">הכל</option>';
  
  Array.from(titles)
    .filter(title => title !== 'all')
    .sort()
    .forEach(title => {
      const option = document.createElement('option');
      option.value = title;
      option.textContent = title;
      filterClass.appendChild(option);
    });
}

/* Build Table with Submissions */
function buildTable(submissions) {
  submissionsTable.innerHTML = '';
  
  if (submissions.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="7" style="text-align: center; color: #999; padding: 20px;">אין נתונים לתצוגה</td>';
    submissionsTable.appendChild(emptyRow);
    return;
  }
  
  submissions.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.className} - ${item.teacherName}</td>
      <td>${item.teacherName}</td>
      <td>${item.studentName}</td>
      <td>${formatDate(item.date)}</td>
      <td>${getCommunicationLabel(item.communicationLevel)}</td>
      <td>${getWellbeingLabel(item.wellbeingLevel)}</td>
      <td>${item.alerts ? item.alerts.substring(0, 50) + '...' : '-'}</td>
    `;
    submissionsTable.appendChild(row);
  });
}

/* Format Date to Hebrew Locale */
function formatDate(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('he-IL');
  } catch (e) {
    return dateString;
  }
}

/* Get Communication Level Label */
function getCommunicationLabel(level) {
  const labels = {
    '1': 'רמה 1 - מנותק קשר',
    '2': 'רמה 2 - קשר רופף',
    '3': 'רמה 3 - נמצא בקשר'
  };
  return labels[level] || '-';
}

/* Get Wellbeing Level Label */
function getWellbeingLabel(value) {
  const labels = {
    'green': 'ירוק',
    'yellow': 'צהוב',
    'red': 'אדום'
  };
  return labels[value] || '-';
}

/* Filter Submissions Based on Selected Criteria */
function filterSubmissions(submissions) {
  return submissions.filter(item => {
    const classFilter = filterClass.value;
    const commFilter = filterCommunication.value;
    const wellFilter = filterWellbeing.value;

    /* Filter by class */
    if (classFilter !== 'all' && `${item.className} - ${item.teacherName}` !== classFilter) {
      return false;
    }
    
    /* Filter by communication level */
    if (commFilter !== 'all' && item.communicationLevel !== commFilter) {
      return false;
    }
    
    /* Filter by wellbeing level */
    if (wellFilter !== 'all' && item.wellbeingLevel !== wellFilter) {
      return false;
    }
    
    return true;
  });
}

/* Update Statistics Cards */
function updateStats(submissions) {
  totalCount.textContent = submissions.length;
  commCount1.textContent = submissions.filter(item => item.communicationLevel === '1').length;
  commCount2.textContent = submissions.filter(item => item.communicationLevel === '2').length;
  commCount3.textContent = submissions.filter(item => item.communicationLevel === '3').length;
  wellGreen.textContent = submissions.filter(item => item.wellbeingLevel === 'green').length;
  wellYellow.textContent = submissions.filter(item => item.wellbeingLevel === 'yellow').length;
  wellRed.textContent = submissions.filter(item => item.wellbeingLevel === 'red').length;
}

/* Refresh Dashboard with Current Data */
function refreshDashboard() {
  const submissions = getSavedSubmissions();
  setFilterOptions(submissions);
  const filtered = filterSubmissions(submissions);
  buildTable(filtered);
  updateStats(submissions);
}

/* Export Submissions to CSV */
function exportCSV(submissions) {
  if (submissions.length === 0) {
    alert('אין נתונים לייצוא');
    return;
  }

  const header = [
    'כיתה',
    'מחנכת',
    'תלמיד/ה',
    'תאריך',
    'תקשורת',
    'רווחה',
    'כוחות',
    'נורות אדומות',
    'מצב משפחתי',
    'הערות נוספות'
  ];

  const rows = submissions.map(item => [
    item.className,
    item.teacherName,
    item.studentName,
    item.date,
    getCommunicationLabel(item.communicationLevel),
    getWellbeingLabel(item.wellbeingLevel),
    item.strengths || '',
    item.alerts || '',
    item.familyStatus || '',
    item.notes || ''
  ]);

  /* Build CSV content */
  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');

  /* Create and download file */
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `student-mapping-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('שגיאה בייצוא הנתונים');
  }
}

/* Event Listeners */
exportBtn.addEventListener('click', () => {
  const submissions = getSavedSubmissions();
  exportCSV(filterSubmissions(submissions));
});

filterClass.addEventListener('change', refreshDashboard);
filterCommunication.addEventListener('change', refreshDashboard);
filterWellbeing.addEventListener('change', refreshDashboard);

/* Initialize Dashboard on Page Load */
document.addEventListener('DOMContentLoaded', refreshDashboard);
