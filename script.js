/* Form Elements */
const classSelect = document.getElementById('classSelect');
const teacherName = document.getElementById('teacherName');
const studentSelect = document.getElementById('studentSelect');
const dateInput = document.getElementById('dateInput');
const communicationLevel = document.getElementById('communicationLevel');
const wellbeingLevel = document.getElementById('wellbeingLevel');
const familyLevel = document.getElementById('familyLevel');
const alertsLevel = document.getElementById('alertsLevel');
const generalNote = document.getElementById('generalNote');
const submitBtn = document.getElementById('submitBtn');
const message = document.getElementById('message');

let classesData = [];

/* Utility Functions */
function showMessage(text, type = 'success') {
  message.textContent = text;
  message.className = `message show ${type}`;
  
  setTimeout(() => {
    message.classList.remove('show');
  }, 4000);
}

function hideMessage() {
  message.classList.remove('show');
}

/* Validation Function */
function validateForm() {
  const errors = [];

  if (!classSelect.value) {
    errors.push('יש לבחור כיתה / מחנכת');
  }

  if (!studentSelect.value || studentSelect.value.trim() === '') {
    errors.push('יש לבחור תלמיד/ה');
  }

  if (!dateInput.value) {
    errors.push('יש להזין תאריך');
  }

  if (!communicationLevel.value) {
    errors.push('יש לבחור רמת תקשורת');
  }

  if (!wellbeingLevel.value) {
    errors.push('יש לבחור רמת רווחה נפשית');
  }

  if (!familyLevel.value) {
    errors.push('יש לבחור מצב משפחתי');
  }

  if (!alertsLevel.value) {
    errors.push('יש לבחור סטטוס נורות אדומות');
  }

  if (errors.length > 0) {
    showMessage(errors.join(' • '), 'error');
    return false;
  }

  return true;
}

/* Load Students from JSON */
function loadStudents() {
  fetch('data/students.json')
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return response.json();
    })
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
    .catch(error => {
      console.error('Error loading students:', error);
      showMessage('שגיאה בטעינת הנתונים. אנא רענן את הדף.', 'error');
    });
}

/* Fill Teacher and Students Dropdowns */
function fillTeacherAndStudents() {
  const selectedIndex = parseInt(classSelect.value);
  const selectedClass = classesData[selectedIndex];
  
  if (!selectedClass) return;
  
  teacherName.value = selectedClass.teacherName;
  studentSelect.innerHTML = '<option value="">בחר תלמיד/ה</option>';

  selectedClass.students.forEach(student => {
    const option = document.createElement('option');
    option.value = student;
    option.textContent = student;
    studentSelect.appendChild(option);
  });
  
  hideMessage();
}

/* Get Saved Submissions */
function getSavedSubmissions() {
  try {
    const raw = localStorage.getItem('studentMappingSubmissions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return [];
  }
}

/* Save Submission to LocalStorage */
function saveSubmission(submission) {
  try {
    const submissions = getSavedSubmissions();
    submissions.push(submission);
    localStorage.setItem('studentMappingSubmissions', JSON.stringify(submissions));
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    showMessage('שגיאה בשמירת הנתונים', 'error');
    return false;
  }
}

/* Clear Form */
function clearForm() {
  communicationLevel.value = '';
  wellbeingLevel.value = '';
  familyLevel.value = '';
  alertsLevel.value = '';
  generalNote.value = '';
  
  // Clear selected states from option cards
  document.querySelectorAll('.option-card.selected').forEach(card => {
    card.classList.remove('selected');
  });
  
  if (classesData.length > 0) {
    classSelect.selectedIndex = 0;
    fillTeacherAndStudents();
  }
  
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
}

/* Handle Form Submission */
submitBtn.addEventListener('click', (event) => {
  event.preventDefault();
  
  /* Validate form */
  if (!validateForm()) {
    return;
  }

  /* Disable button and show loading state */
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'שמירה...';

  try {
    const selectedIndex = parseInt(classSelect.value);
    const selectedClass = classesData[selectedIndex];
    
    const submission = {
      id: Date.now(),
      className: selectedClass.className,
      teacherName: selectedClass.teacherName,
      studentName: studentSelect.value,
      date: dateInput.value,
      communicationLevel: communicationLevel.value,
      wellbeingLevel: wellbeingLevel.value,
      familyStatus: familyLevel.value,
      alerts: alertsLevel.value,
      notes: generalNote.value.trim(),
      savedAt: new Date().toISOString()
    };

    const success = saveSubmission(submission);
    
    if (success) {
      showMessage('המידע נשמר בהצלחה! ✓', 'success');
      clearForm();
      
      /* Re-enable button after a brief delay */
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }, 1500);
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  } catch (error) {
    console.error('Error during submission:', error);
    showMessage('שגיאה בעדכון ההערכה', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

/* Handle Class Selection Change */
classSelect.addEventListener('change', fillTeacherAndStudents);

/* Handle Option Card Clicks */
document.addEventListener('click', (event) => {
  const card = event.target.closest('.option-card');
  if (!card) return;
  
  const section = card.dataset.section;
  const value = card.dataset.value;
  const hiddenInput = document.getElementById(`${section}Level`);
  
  if (!hiddenInput) return;
  
  // Remove selected class from siblings in the same section
  const siblings = card.parentElement.querySelectorAll(`[data-section="${section}"]`);
  siblings.forEach(sibling => sibling.classList.remove('selected'));
  
  // Add selected class to clicked card
  card.classList.add('selected');
  
  // Update hidden input
  hiddenInput.value = value;
  
  hideMessage();
});

/* Handle Keyboard Navigation for Option Cards */
document.addEventListener('keydown', (event) => {
  const card = event.target.closest('.option-card');
  if (!card) return;
  
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    card.click();
  }
});

/* Initialize on Page Load */
document.addEventListener('DOMContentLoaded', () => {
  /* Set today's date */
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  
  /* Load students data */
  loadStudents();
});
