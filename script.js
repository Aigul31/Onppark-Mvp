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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Create markers layer group
  markersLayer = L.layerGroup().addTo(map);
  
  // Request geolocation permission
  requestLocationPermission();
  
  // Add sample markers
  addSampleMarkers();
}

function requestLocationPermission() {
  // Create permission popup
  const popup = document.createElement('div');
  popup.className = 'permission-popup';
  popup.innerHTML = `
    <div class="permission-content">
      <h3>Разрешить доступ к геолокации?</h3>
      <p>OnPark хочет использовать ваше местоположение для показа ближайших мест и людей рядом с вами.</p>
      <div class="permission-buttons">
        <button class="permission-btn allow" onclick="allowLocation()">Разрешить</button>
        <button class="permission-btn deny" onclick="denyLocation()">Отклонить</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

function allowLocation() {
  document.querySelector('.permission-popup').remove();
  
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Center map on user location
        map.setView([userLocation.lat, userLocation.lng], 15);
        
        // Add user marker
        const userIcon = L.divIcon({
          html: '<div style="background: #5CBAA8; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>',
          iconSize: [36, 36],
          className: 'user-location-marker'
        });
        
        userMarker = L.marker([userLocation.lat, userLocation.lng], {icon: userIcon})
          .addTo(map)
          .bindPopup('Вы здесь!');
          
        // Watch position for updates
        navigator.geolocation.watchPosition(updateUserLocation);
      },
      function(error) {
        console.log("Geolocation error: ", error);
        showLocationError();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    showLocationError();
  }
}

function denyLocation() {
  document.querySelector('.permission-popup').remove();
  // Keep map centered on Almaty
}

function updateUserLocation(position) {
  if (userMarker && userLocation) {
    userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    userMarker.setLatLng([userLocation.lat, userLocation.lng]);
  }
}

function centerOnUser() {
  if (userLocation) {
    map.setView([userLocation.lat, userLocation.lng], 16);
    if (userMarker) {
      userMarker.openPopup();
    }
  } else {
    alert('Геолокация недоступна. Разрешите доступ к местоположению.');
  }
}

function showLocationError() {
  alert('Не удалось получить ваше местоположение. Проверьте настройки браузера.');
}

function addSampleMarkers() {
  const markers = {
    coffee: [
      {lat: 43.2240, lng: 76.8530, name: 'Coffee Bean'},
      {lat: 43.2200, lng: 76.8490, name: 'Starbucks'},
      {lat: 43.2180, lng: 76.8520, name: 'Coffee Shop'},
      {lat: 43.2260, lng: 76.8480, name: 'Cafe Central'}
    ],
    walk: [
      {lat: 43.2300, lng: 76.8600, name: 'Парк Горького'},
      {lat: 43.2150, lng: 76.8400, name: 'Ботанический сад'},
      {lat: 43.2280, lng: 76.8350, name: 'Парк 28 панфиловцев'}
    ],
    travel: [
      {lat: 43.2120, lng: 76.8450, name: 'Аэропорт Алматы'},
      {lat: 43.2250, lng: 76.8550, name: 'Железнодорожный вокзал'},
      {lat: 43.2190, lng: 76.8510, name: 'Автовокзал'}
    ]
  };
  
  // Show coffee markers by default
  showMarkers('coffee');
  
  // Add filter event listeners
  const filterIcons = document.querySelectorAll('.filter-icon');
  filterIcons.forEach(filter => {
    filter.addEventListener('click', function() {
      filterIcons.forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      showMarkers(this.dataset.filter);
    });
  });
  
  function showMarkers(type) {
    markersLayer.clearLayers();
    
    if (markers[type]) {
      markers[type].forEach(marker => {
        const icon = getMarkerIcon(type);
        L.marker([marker.lat, marker.lng], {icon: icon})
          .bindPopup(marker.name)
          .addTo(markersLayer);
      });
    }
  }
  
  function getMarkerIcon(type) {
    const icons = {
      coffee: '☕',
      walk: '🚶‍♀️',
      travel: '✈️'
    };
    
    return L.divIcon({
      html: `<div style="background: white; color: #333; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid #5CBAA8; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${icons[type]}</div>`,
      iconSize: [35, 35],
      className: 'custom-marker'
    });
  }
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