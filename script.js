const classSelect = document.getElementById('classSelect');
const teacherName = document.getElementById('teacherName');
const studentSelect = document.getElementById('studentSelect');
const dateInput = document.getElementById('dateInput');
const communicationLevel = document.getElementById('communicationLevel');
const wellbeingLevel = document.getElementById('wellbeingLevel');
const strengthNote = document.getElementById('strengthNote');
const alertNote = document.getElementById('alertNote');
const familyNote = document.getElementById('familyNote');
const generalNote = document.getElementById('generalNote');
const submitBtn = document.getElementById('submitBtn');
const message = document.getElementById('message');

let classesData = [];

function loadStudents() {
  fetch('data/students.json')
    .then(response => response.json())
    .then(data => {
      classesData = data.classes;
      classesData.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${item.className} - ${item.teacherName}`;
        classSelect.appendChild(option);
      });
      if (classesData.length > 0) {
        classSelect.selectedIndex = 0;
        fillTeacherAndStudents();
      }
    })
    .catch(() => {
      message.textContent = 'לא נמצא קובץ נתונים. יש לוודא ש- data/students.json קיים.';
      message.style.color = 'red';
    });
}

function fillTeacherAndStudents() {
  const selectedClass = classesData[classSelect.value];
  if (!selectedClass) return;
  teacherName.value = selectedClass.teacherName;
  studentSelect.innerHTML = '';

  selectedClass.students.forEach(student => {
    const option = document.createElement('option');
    option.value = student;
    option.textContent = student;
    studentSelect.appendChild(option);
  });
}

function getSavedSubmissions() {
  const raw = localStorage.getItem('studentMappingSubmissions');
  return raw ? JSON.parse(raw) : [];
}

function saveSubmission(submission) {
  const submissions = getSavedSubmissions();
  submissions.push(submission);
  localStorage.setItem('studentMappingSubmissions', JSON.stringify(submissions));
}

function clearForm() {
  communicationLevel.value = '1';
  wellbeingLevel.value = 'green';
  strengthNote.value = '';
  alertNote.value = '';
  familyNote.value = '';
  generalNote.value = '';
  if (classesData.length > 0) {
    classSelect.selectedIndex = 0;
    fillTeacherAndStudents();
  }
  dateInput.value = new Date().toISOString().split('T')[0];
}

submitBtn.addEventListener('click', () => {
  const selectedClass = classesData[classSelect.value];
  const submission = {
    className: selectedClass.className,
    teacherName: selectedClass.teacherName,
    studentName: studentSelect.value,
    date: dateInput.value || new Date().toISOString().split('T')[0],
    communicationLevel: communicationLevel.value,
    wellbeingLevel: wellbeingLevel.value,
    strengths: strengthNote.value.trim(),
    alerts: alertNote.value.trim(),
    familyStatus: familyNote.value.trim(),
    notes: generalNote.value.trim(),
    savedAt: new Date().toISOString()
  };

  saveSubmission(submission);
  message.textContent = 'המידע נשמר בהצלחה!';
  message.style.color = '#1868b7';
  clearForm();
});

classSelect.addEventListener('change', fillTeacherAndStudents);

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  loadStudents();
});
