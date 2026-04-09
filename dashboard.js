const filterClass = document.getElementById('filterClass');
const filterCommunication = document.getElementById('filterCommunication');
const filterWellbeing = document.getElementById('filterWellbeing');
const exportBtn = document.getElementById('exportBtn');
const submissionsTable = document.getElementById('submissionsTable');
const classGrid = document.getElementById('classGrid');
const distributionGrid = document.getElementById('distributionGrid');
const comparisonGrid = document.getElementById('comparisonGrid');
const tableSearch = document.getElementById('tableSearch');
const sortableHeaders = Array.from(document.querySelectorAll('th.sortable'));

let classList = [];
let currentSort = { key: 'date', direction: 'desc' };

function getSavedSubmissions() {
  try {
    const raw = localStorage.getItem('studentMappingSubmissions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return [];
  }
}

function sanitizeValue(value) {
  return (value || '').toString().toLowerCase();
}

function getCommunicationLabel(level) {
  const labels = {
    '1': 'רמה 1 - מנותק קשר',
    '2': 'רמה 2 - קשר רופף',
    '3': 'רמה 3 - נמצא בקשר'
  };
  return labels[level] || '-';
}

function getWellbeingLabel(value) {
  const labels = {
    'green': 'ירוק',
    'yellow': 'צהוב',
    'red': 'אדום'
  };
  return labels[value] || '-';
}

function getFamilyLabel(value) {
  const labels = {
    'stable': 'מעטפת יציבה',
    'cracked': 'מעטפת סדוקה',
    'crisis': 'מעטפת במשבר'
  };
  return labels[value] || '-';
}

function getAlertLabel(value) {
  const labels = {
    'normal': 'שגרתי',
    'counselor': 'דרוש מעקב יועצת',
    'urgent': 'קריאה לעזרה/מיידי'
  };
  return labels[value] || '-';
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('he-IL');
  } catch (e) {
    return dateString;
  }
}

function setFilterOptions(submissions) {
  const titles = new Set(['all']);
  classList.forEach(cls => titles.add(cls.label));
  submissions.forEach(item => {
    titles.add(`${item.className} - ${item.teacherName}`);
  });

  filterClass.innerHTML = '<option value="all">הכל</option>';
  Array.from(titles)
    .filter(title => title !== 'all')
    .sort((a, b) => a.localeCompare(b, 'he'))
    .forEach(title => {
      const option = document.createElement('option');
      option.value = title;
      option.textContent = title;
      filterClass.appendChild(option);
    });
}

async function loadClassList() {
  try {
    const response = await fetch('data/students.json');
    if (!response.ok) throw new Error('Failed to load student data');
    const data = await response.json();
    const classes = Array.isArray(data.classes) ? data.classes : data;
    classList = classes.map(item => ({
      label: item.label || `${item.className} - ${item.teacherName}`,
      className: item.className,
      teacherName: item.teacherName
    })).sort((a, b) => a.label.localeCompare(b.label, 'he'));
  } catch (error) {
    console.error('Unable to load class list:', error);
    classList = [];
  }
}

function groupByClass(submissions) {
  const groups = {};

  submissions.forEach(item => {
    const label = `${item.className} - ${item.teacherName}`;
    if (!groups[label]) {
      groups[label] = {
        label,
        count: 0,
        communication: { '1': 0, '2': 0, '3': 0 },
        wellbeing: { green: 0, yellow: 0, red: 0 },
        family: { stable: 0, cracked: 0, crisis: 0 },
        alerts: { normal: 0, counselor: 0, urgent: 0 }
      };
    }

    const group = groups[label];
    group.count += 1;
    if (item.communicationLevel) group.communication[item.communicationLevel] += 1;
    if (item.wellbeingLevel) group.wellbeing[item.wellbeingLevel] += 1;
    if (item.familyStatus) group.family[item.familyStatus] += 1;
    if (item.alerts) group.alerts[item.alerts] += 1;
  });

  return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label, 'he'));
}

// הודעה ברורה אם אין נתונים
function renderClassTiles(submissions) {
  classGrid.innerHTML = '';
  const classCounts = groupByClass(submissions).reduce((acc, group) => {
    acc[group.label] = group.count;
    return acc;
  }, {});

  if (!classList.length) {
    classGrid.innerHTML = '<p style="color:#555;">אין רשימת כיתות זמינה כרגע.</p>';
    return;
  }

  let hasData = false;
  classList.forEach(cls => {
    const count = classCounts[cls.label] || 0;
    if (count > 0) hasData = true;
    const tile = document.createElement('a');
    tile.className = 'class-card';
    tile.href = `class-dashboard.html?class=${encodeURIComponent(cls.label)}`;
    tile.innerHTML = `
      <div>
        <h3>${cls.label}</h3>
        <p>${count} הערכות</p>
      </div>
      <p>לחץ לפרטים לכיתה זו</p>
    `;
    classGrid.appendChild(tile);
  });
  if (!hasData) {
    classGrid.innerHTML += '<p style="color:#888; margin-top:16px;">אין עדיין נתונים להצגה. מלאו טופס כדי לראות גרפים וסטטיסטיקות.</p>';
  }
}

function buildBarChart(title, buckets, total) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.innerHTML = `<h3>${title}</h3>`;

  buckets.forEach(bucket => {
    const percent = total ? Math.round((bucket.count / total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <span class="chart-label">${bucket.label}</span>
      <span class="chart-bar" aria-hidden="true"><span class="chart-fill" style="width:${percent}%"></span></span>
      <span class="chart-value">${bucket.count} (${percent}%)</span>
    `;
    card.appendChild(row);
  });

  return card;
}

function renderDistributionCharts(submissions) {
  distributionGrid.innerHTML = '';
  if (!submissions.length) {
    distributionGrid.innerHTML = '<p style="color:#888;">אין עדיין נתונים להצגה. מלאו טופס כדי לראות גרפים.</p>';
    return;
  }

  const total = submissions.length;

  const communication = [
    { label: 'ירוק', count: submissions.filter(item => item.communicationLevel === '3').length },
    { label: 'צהוב', count: submissions.filter(item => item.communicationLevel === '2').length },
    { label: 'אדום', count: submissions.filter(item => item.communicationLevel === '1').length }
  ];

  const wellbeing = [
    { label: 'ירוק', count: submissions.filter(item => item.wellbeingLevel === 'green').length },
    { label: 'צהוב', count: submissions.filter(item => item.wellbeingLevel === 'yellow').length },
    { label: 'אדום', count: submissions.filter(item => item.wellbeingLevel === 'red').length }
  ];

  const family = [
    { label: 'מעטפת יציבה', count: submissions.filter(item => item.familyStatus === 'stable').length },
    { label: 'מעטפת סדוקה', count: submissions.filter(item => item.familyStatus === 'cracked').length },
    { label: 'מעטפת במשבר', count: submissions.filter(item => item.familyStatus === 'crisis').length }
  ];

  const alerts = [
    { label: 'שגרתי', count: submissions.filter(item => item.alerts === 'normal').length },
    { label: 'דרוש מעקב יועצת', count: submissions.filter(item => item.alerts === 'counselor').length },
    { label: 'קריאה לעזרה/מיידי', count: submissions.filter(item => item.alerts === 'urgent').length }
  ];

  distributionGrid.appendChild(buildBarChart('ציר התקשורת', communication, total));
  distributionGrid.appendChild(buildBarChart('ציר הרווחה', wellbeing, total));
  distributionGrid.appendChild(buildBarChart('מעטפת משפחתית', family, total));
  distributionGrid.appendChild(buildBarChart('נורות אדומות', alerts, total));
}

function buildComparisonCard(title, categories, classData) {
  const card = document.createElement('div');
  card.className = 'comparison-card';
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  card.appendChild(titleElement);

  const grid = document.createElement('div');
  grid.className = 'comparison-table';

  const headerRow = document.createElement('div');
  headerRow.className = 'comparison-header';
  headerRow.innerHTML = `<span>כיתה</span>${categories.map(item => `<span>${item.label}</span>`).join('')}`;
  grid.appendChild(headerRow);

  classData.forEach(group => {
    const row = document.createElement('div');
    row.className = 'comparison-row';
    const values = categories.map(item => `<span>${group[item.key] || 0}</span>`).join('');
    row.innerHTML = `<span>${group.label}</span>${values}`;
    grid.appendChild(row);
  });

  card.appendChild(grid);
  return card;
}

function renderComparisonCharts(submissions) {
  comparisonGrid.innerHTML = '';
  const groups = groupByClass(submissions);

  if (!groups.length) {
    comparisonGrid.innerHTML = '<p style="color:#555;">אין כיתות להצגה.</p>';
    return;
  }

  comparisonGrid.appendChild(buildComparisonCard('השוואת תקשורת לפי כיתה', [
    { label: 'ירוק', key: 'communication.3' },
    { label: 'צהוב', key: 'communication.2' },
    { label: 'אדום', key: 'communication.1' }
  ], groups.map(g => ({
    label: g.label,
    'communication.3': g.communication['3'],
    'communication.2': g.communication['2'],
    'communication.1': g.communication['1']
  }))));

  comparisonGrid.appendChild(buildComparisonCard('השוואת רווחה לפי כיתה', [
    { label: 'ירוק', key: 'wellbeing.green' },
    { label: 'צהוב', key: 'wellbeing.yellow' },
    { label: 'אדום', key: 'wellbeing.red' }
  ], groups.map(g => ({
    label: g.label,
    'wellbeing.green': g.wellbeing.green,
    'wellbeing.yellow': g.wellbeing.yellow,
    'wellbeing.red': g.wellbeing.red
  }))));

  comparisonGrid.appendChild(buildComparisonCard('השוואת מעטפת משפחתית לפי כיתה', [
    { label: 'יציבה', key: 'family.stable' },
    { label: 'סדוקה', key: 'family.cracked' },
    { label: 'משבר', key: 'family.crisis' }
  ], groups.map(g => ({
    label: g.label,
    'family.stable': g.family.stable,
    'family.cracked': g.family.cracked,
    'family.crisis': g.family.crisis
  }))));

  comparisonGrid.appendChild(buildComparisonCard('השוואת נורות אדומות לפי כיתה', [
    { label: 'שגרתי', key: 'alerts.normal' },
    { label: 'יועצת', key: 'alerts.counselor' },
    { label: 'מיידי', key: 'alerts.urgent' }
  ], groups.map(g => ({
    label: g.label,
    'alerts.normal': g.alerts.normal,
    'alerts.counselor': g.alerts.counselor,
    'alerts.urgent': g.alerts.urgent
  }))));
}

function applyFilters(submissions) {
  const classFiltered = submissions.filter(item => {
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

  const search = sanitizeValue(tableSearch.value);
  if (!search) return classFiltered;

  return classFiltered.filter(item => {
    const fields = [
      item.className,
      item.teacherName,
      item.studentName,
      item.date,
      getCommunicationLabel(item.communicationLevel),
      getWellbeingLabel(item.wellbeingLevel),
      getFamilyLabel(item.familyStatus),
      getAlertLabel(item.alerts),
      item.strengths,
      item.notes
    ].map(sanitizeValue);
    return fields.some(field => field.includes(search));
  });
}

function sortSubmissions(submissions) {
  return submissions.slice().sort((a, b) => {
    const key = currentSort.key;
    let aValue = a[key] || '';
    let bValue = b[key] || '';

    if (key === 'date') {
      aValue = new Date(`${aValue}T00:00:00`).getTime();
      bValue = new Date(`${bValue}T00:00:00`).getTime();
    } else if (key === 'communicationLevel') {
      aValue = parseInt(aValue, 10) || 0;
      bValue = parseInt(bValue, 10) || 0;
    } else {
      aValue = sanitizeValue(aValue);
      bValue = sanitizeValue(bValue);
    }

    if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function buildTable(submissions) {
  submissionsTable.innerHTML = '';
  const filtered = applyFilters(submissions);
  const sorted = sortSubmissions(filtered);

  if (!sorted.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="8" style="text-align:center; color:#999; padding:20px;">אין נתונים לתצוגה</td>';
    submissionsTable.appendChild(emptyRow);
    return;
  }

  sorted.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.className} - ${item.teacherName}</td>
      <td>${item.studentName}</td>
      <td>${formatDate(item.date)}</td>
      <td>${getCommunicationLabel(item.communicationLevel)}</td>
      <td>${getWellbeingLabel(item.wellbeingLevel)}</td>
      <td>${getFamilyLabel(item.familyStatus)}</td>
      <td>${getAlertLabel(item.alerts)}</td>
      <td>${item.strengths ? item.strengths.substring(0, 30) + '...' : '-'}</td>
    `;
    submissionsTable.appendChild(row);
  });
}

function updateSortHeaders() {
  sortableHeaders.forEach(header => {
    header.classList.remove('sorted-asc', 'sorted-desc');
    if (header.dataset.key === currentSort.key) {
      header.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

function refreshDashboard() {
  const submissions = getSavedSubmissions();
  setFilterOptions(submissions);
  renderClassTiles(submissions);
  renderDistributionCharts(submissions);
  renderComparisonCharts(submissions);
  buildTable(submissions);
}

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

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

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

if (tableSearch) tableSearch.addEventListener('input', refreshDashboard);
if (typeof filterClass !== 'undefined' && filterClass) filterClass.addEventListener('change', refreshDashboard);
if (typeof filterCommunication !== 'undefined' && filterCommunication) filterCommunication.addEventListener('change', refreshDashboard);
if (typeof filterWellbeing !== 'undefined' && filterWellbeing) filterWellbeing.addEventListener('change', refreshDashboard);
if (typeof exportBtn !== 'undefined' && exportBtn) exportBtn.addEventListener('click', () => {
  const submissions = getSavedSubmissions();
  exportCSV(applyFilters(submissions));
});

sortableHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const key = header.dataset.key;
    if (!key) return;
    if (currentSort.key === key) {
      currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.key = key;
      currentSort.direction = 'asc';
    }
    updateSortHeaders();
    refreshDashboard();
  });
});

function getSearchFiltered(submissions) {
  return applyFilters(submissions);
}

document.addEventListener('DOMContentLoaded', async () => {
  updateSortHeaders();
  await loadClassList();
  refreshDashboard();
});

// איפוס כל הנתונים בלחיצה על כפתור
const resetDataBtn = document.getElementById('resetDataBtn');
if (resetDataBtn) {
  resetDataBtn.addEventListener('click', () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים שנשמרו? פעולה זו אינה הפיכה!')) {
      localStorage.removeItem('studentMappingSubmissions');
      location.reload();
    }
  });
}