// OnPark App JavaScript

let selectedGender = '';
let selectedInterests = [];
let currentAge = 25;

// Screen Navigation Functions (must be declared before use)
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showRegistration() {
  showScreen('registrationScreen');
}

function showLogin() {
  showScreen('registrationScreen');
}

function showPhoto() {
  showScreen('photoScreen');
}

function showInterests() {
  showScreen('interestsScreen');
}

function showMap() {
  showScreen('mapScreen');
}

function showProfile() {
  showScreen('profileScreen');
}

function selectPhoto() {
  document.getElementById('photoInput').click();
}

// Gender Selection
document.addEventListener('DOMContentLoaded', function() {
  const genderOptions = document.querySelectorAll('.gender-option');
  
  genderOptions.forEach(option => {
    option.addEventListener('click', function() {
      genderOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      selectedGender = this.dataset.gender;
    });
  });

  // Age Slider
  const ageSlider = document.getElementById('ageSlider');
  const ageValue = document.getElementById('ageValue');
  
  if (ageSlider) {
    ageSlider.addEventListener('input', function() {
      currentAge = this.value;
      ageValue.textContent = this.value;
    });
  }

  // Password Toggle
  const showPasswordBtn = document.querySelector('.show-password');
  const passwordInput = document.getElementById('password');
  
  if (showPasswordBtn) {
    showPasswordBtn.addEventListener('click', function() {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.textContent = 'Hide';
      } else {
        passwordInput.type = 'password';
        this.textContent = 'Show';
      }
    });
  }

  // Registration Form
  const registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const telegram = document.getElementById('telegram').value;
      const password = document.getElementById('password').value;
      
      if (!selectedGender) {
        alert('Пожалуйста, выберите пол');
        return;
      }
      
      // Save profile data
      const profileData = {
        name,
        telegram,
        age: currentAge,
        gender: selectedGender
      };
      
      localStorage.setItem('onparkProfile', JSON.stringify(profileData));
      
      // Show success message
      showSuccessMessage();
      
      setTimeout(() => {
        showPhoto();
      }, 2000);
    });
  }

  // Interest Bubbles
  const interestBubbles = document.querySelectorAll('.interest-bubble');
  
  interestBubbles.forEach(bubble => {
    bubble.addEventListener('click', function() {
      this.classList.toggle('selected');
      
      const interest = this.dataset.interest;
      if (selectedInterests.includes(interest)) {
        selectedInterests = selectedInterests.filter(i => i !== interest);
      } else {
        selectedInterests.push(interest);
      }
    });
  });

  // Photo Upload
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  
  if (photoInput) {
    photoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile photo">`;
          
          setTimeout(() => {
            showPhotoSuccess();
          }, 1000);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Map filter functionality
  const filterIcons = document.querySelectorAll('.filter-icon');
  
  filterIcons.forEach(filter => {
    filter.addEventListener('click', function() {
      filterIcons.forEach(f => f.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Load saved profile data
  loadProfileData();
});

function showSuccessMessage() {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<div class="success-message">Успешно!<br>Мы вам отправляем ссылку, ожидайте.</div>';
}

function showPhotoSuccess() {
  const photoActions = document.querySelector('.photo-actions');
  photoActions.innerHTML = `
    <div style="text-align: center; color: #007AFF; font-weight: 600; margin-bottom: 16px;">
      Фото успешно загружено
    </div>
    <button class="photo-btn" onclick="showInterests()">Изменить фото</button>
    <button class="primary-btn" onclick="showInterests()">Дальше</button>
  `;
}

function loadProfileData() {
  const savedData = localStorage.getItem('onparkProfile');
  if (savedData) {
    const profile = JSON.parse(savedData);
    
    // Update profile screen
    const profileName = document.getElementById('profileName');
    const profileTelegram = document.getElementById('profileTelegram');
    const profileAge = document.getElementById('profileAge');
    const profileInterests = document.getElementById('profileInterests');
    
    if (profileName) profileName.textContent = profile.name || 'Ая';
    if (profileTelegram) profileTelegram.textContent = profile.telegram || 'Yaya2025';
    if (profileAge) profileAge.textContent = profile.age || '32';
    
    if (selectedInterests.length > 0) {
      if (profileInterests) profileInterests.textContent = selectedInterests.join(' ');
    }
  }
}

// Auto-save interests when changed
setInterval(() => {
  const savedData = localStorage.getItem('onparkProfile');
  if (savedData && selectedInterests.length > 0) {
    const profile = JSON.parse(savedData);
    profile.interests = selectedInterests;
    localStorage.setItem('onparkProfile', JSON.stringify(profile));
    loadProfileData();
  }
}, 1000);