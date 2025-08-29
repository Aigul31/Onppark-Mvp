// OnPark App JavaScript

let selectedGender = '';
let selectedInterests = [];
let currentAge = 25;
let map;
let userMarker;
let userLocation = null;
let markersLayer;

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
  setTimeout(() => {
    initializeMap();
  }, 100);
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

// Map and Geolocation Functions
function initializeMap() {
  if (map) {
    map.remove();
  }
  
  // Initialize map centered on Almaty, Kazakhstan
  map = L.map('map').setView([43.2220, 76.8512], 13);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetMap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Create markers layer group
  markersLayer = L.layerGroup().addTo(map);
  
  // Add active user markers
  addActiveUsers();
  
  // Setup filter buttons
  setupUserStatusFilters();
}

let currentUserStatus = 'coffee'; // Default user status

function setupUserStatusFilters() {
  const filterIcons = document.querySelectorAll('.filter-icon');
  filterIcons.forEach(filter => {
    filter.addEventListener('click', function() {
      filterIcons.forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      currentUserStatus = this.dataset.filter;
      
      // Show feedback that status was selected
      showStatusMessage(this.dataset.filter);
    });
  });
}

function showStatusMessage(status) {
  const messages = {
    coffee: 'Вы ищете компанию для кофе ☕',
    walk: 'Вы ищете компанию для прогулки 🚶‍♀️',
    travel: 'Вы ищете компанию для путешествий ✈️'
  };
  
  // Create temporary message
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #5CBAA8;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 16px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  message.textContent = messages[status];
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 2000);
}

function centerOnUser() {
  // Center on Almaty
  map.setView([43.2220, 76.8512], 15);
}

function addActiveUsers() {
  const activeUsers = [
    {
      lat: 43.2240, lng: 76.8530, 
      name: 'Айгуль', age: 24, status: 'coffee',
      bio: 'Люблю хороший кофе и интересные беседы',
      avatar: '👩‍💼'
    },
    {
      lat: 43.2200, lng: 76.8490, 
      name: 'Данияр', age: 28, status: 'walk',
      bio: 'Активный образ жизни, прогулки по городу',
      avatar: '👨‍💻'
    },
    {
      lat: 43.2180, lng: 76.8520, 
      name: 'Асем', age: 26, status: 'coffee',
      bio: 'Фотограф, ищу единомышленников',
      avatar: '👩‍🎨'
    },
    {
      lat: 43.2260, lng: 76.8480, 
      name: 'Нурлан', age: 30, status: 'travel',
      bio: 'Путешественник, планирую поездку в горы',
      avatar: '👨‍🔬'
    },
    {
      lat: 43.2300, lng: 76.8600, 
      name: 'Дина', age: 22, status: 'walk',
      bio: 'Студентка, люблю пешие прогулки',
      avatar: '👩‍🎓'
    },
    {
      lat: 43.2150, lng: 76.8400, 
      name: 'Ержан', age: 32, status: 'coffee',
      bio: 'Предприниматель, обожаю кофейни',
      avatar: '👨‍💼'
    }
  ];
  
  activeUsers.forEach(user => {
    const icon = getUserIcon(user.status);
    const marker = L.marker([user.lat, user.lng], {icon: icon})
      .addTo(markersLayer);
      
    marker.on('click', function() {
      showUserProfile(user);
    });
  });
}

function getUserIcon(status) {
  const icons = {
    coffee: '☕',
    walk: '🚶‍♀️',
    travel: '✈️'
  };
  
  return L.divIcon({
    html: `<div style="background: white; color: #333; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid #5CBAA8; box-shadow: 0 3px 10px rgba(0,0,0,0.3); cursor: pointer;">${icons[status]}</div>`,
    iconSize: [40, 40],
    className: 'user-marker'
  });
}

function showUserProfile(user) {
  const profilePopup = document.createElement('div');
  profilePopup.className = 'user-profile-popup';
  profilePopup.innerHTML = `
    <div class="profile-popup-content">
      <div class="profile-header">
        <span class="profile-avatar">${user.avatar}</span>
        <div class="profile-info">
          <h3>${user.name}, ${user.age}</h3>
          <p class="profile-status">${getStatusText(user.status)}</p>
        </div>
        <button class="close-profile" onclick="closeUserProfile()">×</button>
      </div>
      <div class="profile-bio">
        <p>${user.bio}</p>
      </div>
      <div class="profile-actions">
        <button class="action-btn profile-btn" onclick="viewFullProfile('${user.name}')">
          👤 Профиль
        </button>
        <button class="action-btn join-btn" onclick="joinCompany('${user.name}')">
          🤝 Хочу составить компанию
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(profilePopup);
}

function getStatusText(status) {
  const texts = {
    coffee: 'Ищет компанию для кофе ☕',
    walk: 'Ищет компанию для прогулки 🚶‍♀️',
    travel: 'Ищет компанию для путешествий ✈️'
  };
  return texts[status];
}

function closeUserProfile() {
  const popup = document.querySelector('.user-profile-popup');
  if (popup) {
    document.body.removeChild(popup);
  }
}

function viewFullProfile(userName) {
  alert(`Просмотр полного профиля: ${userName}`);
  closeUserProfile();
}

function joinCompany(userName) {
  alert(`Отправлен запрос на присоединение к ${userName}!`);
  closeUserProfile();
}

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