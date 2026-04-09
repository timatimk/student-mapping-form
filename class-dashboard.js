const classTitle = document.getElementById('classTitle');
const classSubtitle = document.getElementById('classSubtitle');
const classOverview = document.getElementById('classOverview');
const classTotalCount = document.getElementById('classTotalCount');
const classCommRed = document.getElementById('classCommRed');
const classCommYellow = document.getElementById('classCommYellow');
const classCommGreen = document.getElementById('classCommGreen');
const classDistributionGrid = document.getElementById('classDistributionGrid');
const classSearch = document.getElementById('classSearch');
const classTableBody = document.getElementById('classTableBody');
const sortableHeaders = Array.from(document.querySelectorAll('th.sortable'));

let classNameParam = null;
let classSubmissions = [];
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

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
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

function sanitizeValue(value) {
  return (value || '').toString().toLowerCase();
}

function filterClassSubmissions() {
  const search = sanitizeValue(classSearch.value);

  return classSubmissions.filter(item => {
    if (!search) return true;

    const fields = [
      item.studentName,
      item.date,
      item.communicationLevel,
      item.wellbeingLevel,
      item.familyStatus,
      item.alerts,
      item.strengths,
      item.notes
    ].map(sanitizeValue);

    return fields.some(field => field.includes(search));
  });
}

function sortSubmissions(submissions) {
  const { key, direction } = currentSort;

  return submissions.slice().sort((a, b) => {
    let aValue = a[key] || '';
    let bValue = b[key] || '';

    if (key === 'date') {
      aValue = new Date(`${aValue}T00:00:00`).getTime();
      bValue = new Date(`${bValue}T00:00:00`).getTime();
    }

    if (key === 'communicationLevel') {
      aValue = parseInt(aValue, 10) || 0;
      bValue = parseInt(bValue, 10) || 0;
    }

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function buildClassTable(submissions) {
  classTableBody.innerHTML = '';

  if (!submissions.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="8" style="text-align:center; color:#999; padding:20px;">אין נתונים לתצוגה לכיתה זו</td>';
    classTableBody.appendChild(emptyRow);
    return;
  }

  const sorted = sortSubmissions(submissions);

  sorted.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.studentName}</td>
      <td>${formatDate(item.date)}</td>
      <td>${getCommunicationLabel(item.communicationLevel)}</td>
      <td>${getWellbeingLabel(item.wellbeingLevel)}</td>
      <td>${getFamilyLabel(item.familyStatus)}</td>
      <td>${getAlertLabel(item.alerts)}</td>
      <td>${item.strengths || '-'}</td>
      <td>${item.notes || '-'}</td>
    `;
    classTableBody.appendChild(row);
  });
}

function buildDistributionCard(title, groups, total) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.innerHTML = `<h3>${title}</h3>`;

  groups.forEach(group => {
    const count = group.count;
    const percent = total ? Math.round((count / total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <span class="chart-label">${group.label}</span>
      <span class="chart-bar" aria-hidden="true"><span class="chart-fill" style="width:${percent}%"></span></span>
      <span class="chart-value">${count} (${percent}%)</span>
    `;
    card.appendChild(row);
  });

  return card;
}

function renderClassDistribution(submissions) {
  classDistributionGrid.innerHTML = '';
  const total = submissions.length;

  const communication = [
    { label: 'ירוק', value: '3' },
    { label: 'צהוב', value: '2' },
    { label: 'אדום', value: '1' }
  ].map(item => ({ label: item.label, count: submissions.filter(s => s.communicationLevel === item.value).length }));

  const wellbeing = [
    { label: 'ירוק', value: 'green' },
    { label: 'צהוב', value: 'yellow' },
    { label: 'אדום', value: 'red' }
  ].map(item => ({ label: item.label, count: submissions.filter(s => s.wellbeingLevel === item.value).length }));

  const family = [
    { label: 'מעטפת יציבה', value: 'stable' },
    { label: 'מעטפת סדוקה', value: 'cracked' },
    { label: 'מעטפת במשבר', value: 'crisis' }
  ].map(item => ({ label: item.label, count: submissions.filter(s => s.familyStatus === item.value).length }));

  const alerts = [
    { label: 'שגרתי', value: 'normal' },
    { label: 'דרוש מעקב יועצת', value: 'counselor' },
    { label: 'קריאה לעזרה/מיידי', value: 'urgent' }
  ].map(item => ({ label: item.label, count: submissions.filter(s => s.alerts === item.value).length }));

  classDistributionGrid.appendChild(buildDistributionCard('ציר התקשורת', communication, total));
  classDistributionGrid.appendChild(buildDistributionCard('ציר הרווחה', wellbeing, total));
  classDistributionGrid.appendChild(buildDistributionCard('מעטפת משפחתית', family, total));
  classDistributionGrid.appendChild(buildDistributionCard('נורות אדומות', alerts, total));
}

function updateClassStats(submissions) {
  classTotalCount.textContent = submissions.length;
  classCommGreen.textContent = submissions.filter(s => s.communicationLevel === '3').length;
  classCommYellow.textContent = submissions.filter(s => s.communicationLevel === '2').length;
  classCommRed.textContent = submissions.filter(s => s.communicationLevel === '1').length;
}

function initClassDashboard() {
  classNameParam = getQueryParam('class');
  const submissions = getSavedSubmissions();

  if (!classNameParam) {
    classSubtitle.textContent = 'לא נבחרה כיתה. חזור לדשבורד הראשי ובחר כיתה.';
    return;
  }

  classSubmissions = submissions.filter(item => `${item.className} - ${item.teacherName}` === classNameParam);
  classTitle.textContent = classNameParam;
  classSubtitle.textContent = 'סקירה ייעודית ונתונים לפי הערכות שנשמרו לכיתה זו.';
  classOverview.textContent = `הצגת ${classSubmissions.length} הערכות עבור הכיתה שנבחרה.`;

  updateClassStats(classSubmissions);
  renderClassDistribution(classSubmissions);
  buildClassTable(filterClassSubmissions());
}

function updateSortHeaders() {
  sortableHeaders.forEach(header => {
    header.classList.remove('sorted-asc', 'sorted-desc');
    if (header.dataset.key === currentSort.key) {
      header.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

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
    buildClassTable(filterClassSubmissions());
  });
});

classSearch.addEventListener('input', () => {
  buildClassTable(filterClassSubmissions());
});

document.addEventListener('DOMContentLoaded', initClassDashboard);
