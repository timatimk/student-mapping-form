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

function getSavedSubmissions() {
  const raw = localStorage.getItem('studentMappingSubmissions');
  return raw ? JSON.parse(raw) : [];
}

function setFilterOptions(submissions) {
  const titles = new Set();
  titles.add('all');
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

function buildTable(submissions) {
  submissionsTable.innerHTML = '';
  submissions.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.className} - ${item.teacherName}</td>
      <td>${item.teacherName}</td>
      <td>${item.studentName}</td>
      <td>${item.date}</td>
      <td>${getCommunicationLabel(item.communicationLevel)}</td>
      <td>${getWellbeingLabel(item.wellbeingLevel)}</td>
      <td>${item.alerts || '-'}</td>
    `;
    submissionsTable.appendChild(row);
  });
}

function getCommunicationLabel(level) {
  switch (level) {
    case '1': return 'רמה 1 - מנותק קשר';
    case '2': return 'רמה 2 - קשר רופף';
    case '3': return 'רמה 3 - נמצא בקשר';
    default: return '-';
  }
}

function getWellbeingLabel(value) {
  switch (value) {
    case 'green': return 'ירוק';
    case 'yellow': return 'צהוב';
    case 'red': return 'אדום';
    default: return '-';
  }
}

function filterSubmissions(submissions) {
  return submissions.filter(item => {
    const classFilter = filterClass.value;
    const commFilter = filterCommunication.value;
    const wellFilter = filterWellbeing.value;

    if (classFilter !== 'all' && `${item.className} - ${item.teacherName}` !== classFilter) {
      return false;
    }
    if (commFilter !== 'all' && item.communicationLevel !== commFilter) {
      return false;
    }
    if (wellFilter !== 'all' && item.wellbeingLevel !== wellFilter) {
      return false;
    }
    return true;
  });
}

function updateStats(submissions) {
  totalCount.textContent = submissions.length;
  commCount1.textContent = submissions.filter(item => item.communicationLevel === '1').length;
  commCount2.textContent = submissions.filter(item => item.communicationLevel === '2').length;
  commCount3.textContent = submissions.filter(item => item.communicationLevel === '3').length;
  wellGreen.textContent = submissions.filter(item => item.wellbeingLevel === 'green').length;
  wellYellow.textContent = submissions.filter(item => item.wellbeingLevel === 'yellow').length;
  wellRed.textContent = submissions.filter(item => item.wellbeingLevel === 'red').length;
}

function refreshDashboard() {
  const submissions = getSavedSubmissions();
  setFilterOptions(submissions);
  const filtered = filterSubmissions(submissions);
  buildTable(filtered);
  updateStats(submissions);
}

function exportCSV(submissions) {
  const header = [
    'כיתה - מחנכת',
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
    `${item.className} - ${item.teacherName}`,
    item.teacherName,
    item.studentName,
    item.date,
    getCommunicationLabel(item.communicationLevel),
    getWellbeingLabel(item.wellbeingLevel),
    item.strengths,
    item.alerts,
    item.familyStatus,
    item.notes
  ]);

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `student-mapping-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

exportBtn.addEventListener('click', () => {
  const submissions = getSavedSubmissions();
  exportCSV(filterSubmissions(submissions));
});

filterClass.addEventListener('change', refreshDashboard);
filterCommunication.addEventListener('change', refreshDashboard);
filterWellbeing.addEventListener('change', refreshDashboard);

document.addEventListener('DOMContentLoaded', refreshDashboard);
