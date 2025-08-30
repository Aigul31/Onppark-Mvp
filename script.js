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
    photoInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile photo">`;
        };
        reader.readAsDataURL(file);
        
        // Upload to Supabase Storage
        const uploadedUrl = await uploadPhotoToSupabase(file);
        if (uploadedUrl) {
          console.log('Photo uploaded to Supabase:', uploadedUrl);
          // Store URL for later use
          localStorage.setItem('userAvatarUrl', uploadedUrl);
        }
        
        setTimeout(() => {
          showPhotoSuccess();
        }, 1000);
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
  
  // Load saved language
  const savedLang = localStorage.getItem('language') || 'ru';
  setLanguage(savedLang);
  
  // Initialize Supabase
  initializeSupabase();
  
  // Initialize pending connections
  initializePendingConnections();
});

// Supabase Integration
function initializeSupabase() {
  try {
    // Initialize real Supabase if credentials are available
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      // Use Replit secrets injected in the HTML or from environment
      // These would be injected from the server in a real deployment
      const supabaseUrl = window.REPLIT_ENV_SUPABASE_URL || 'your-project-url';
      const supabaseKey = window.REPLIT_ENV_SUPABASE_ANON_KEY || 'your-anon-key';
      
      // Initialize Supabase client with real credentials
      if (supabaseUrl !== 'your-project-url' && supabaseKey !== 'your-anon-key') {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase initialized with environment credentials');
      } else {
        console.log('Supabase credentials not found, using mock data');
      }
    }
  } catch (error) {
    console.log('Supabase not available, using mock data');
  }
}
  
  // Set current user (for demo, using a mock user)
  currentUser = {
    id: 'current-user-123',
    display_name: 'Вы',
    age: 25,
    status: 'coffee',
    interests: ['coffee', 'networking'],
    avatar_url: '👤'
  };
  
  console.log('OnPark initialized with demo data');
}

// Language Functions
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  
  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    }
  });
  
  // Update all translatable elements
  updateTranslations();
}

function updateTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });
}

function t(key) {
  return translations[currentLanguage] && translations[currentLanguage][key] 
    ? translations[currentLanguage][key] 
    : translations['ru'][key] || key;
}

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
let myMarker = null; // User's own marker on map
let currentLanguage = 'ru'; // Default language
let supabase; // Supabase client
let currentUser = null; // Current user data
let activeConnections = []; // Active connection requests
let allUsersData = []; // Store all users data for access in chat

// Translation dictionary
const translations = {
  ru: {
    'create-connections': 'Создавай связи',
    'make-day-brighter': 'Сделай свой день ярче!',
    'register-btn': 'Регистрация',
    'have-account': 'У вас есть аккаунт:',
    'login-link': 'Войдите',
    'registration-title': 'Регистрация',
    'name-label': 'Отображаемое имя',
    'age-label': 'Возраст',
    'gender-label': 'Пол',
    'male': 'Мужской',
    'female': 'Женский',
    'upload-photo': 'Загрузить фото',
    'continue-btn': 'Продолжить',
    'interests-title': 'Выбери свой интерес',
    'coffee-interest': 'Кофе',
    'walk-interest': 'Прогулки',
    'travel-interest': 'Путешествия',
    'finish-btn': 'Завершить',
    'map-select': 'Выбрать',
    'placement-title': 'Разместить себя на карте',
    'placement-coffee': 'Ищет компанию для кофе ☕',
    'placement-walk': 'Ищет компанию для прогулки 🚶‍♀️',
    'placement-travel': 'Ищет компанию для путешествий ✈️',
    'placement-instruction': 'Нажмите на карту, чтобы указать ваше местоположение и стать видимым для других пользователей.',
    'cancel-btn': 'Отмена',
    'select-place': 'Выбрать место',
    'map-click-instruction': 'Нажмите на карту, чтобы разместить себя',
    'you-here': 'Вы здесь! 👋',
    'placement-success': 'Отлично! Теперь вас видят другие пользователи',
    'profile-btn': '👤 Профиль',
    'join-company': '🤝 Хочу составить компанию',
    'anonymous': 'Аноним',
    'show': 'Показать',
    'forgot-password': 'Забыли пароль?',
    'create-profile': 'Создать профиль',
    'select-from-gallery': 'Выбрать из галереи',
    'interests-title': 'Добавить интересы',
    'add-interests': 'Добавить интересы'
  },
  en: {
    'create-connections': 'Create Connections',
    'make-day-brighter': 'Make your day brighter!',
    'register-btn': 'Register',
    'have-account': 'Have an account:',
    'login-link': 'Sign In',
    'registration-title': 'Registration',
    'name-label': 'Display Name',
    'age-label': 'Age',
    'gender-label': 'Gender',
    'male': 'Male',
    'female': 'Female',
    'upload-photo': 'Upload Photo',
    'continue-btn': 'Continue',
    'interests-title': 'Choose your interest',
    'coffee-interest': 'Coffee',
    'walk-interest': 'Walking',
    'travel-interest': 'Travel',
    'finish-btn': 'Finish',
    'map-select': 'Select',
    'placement-title': 'Place yourself on the map',
    'placement-coffee': 'Looking for coffee company ☕',
    'placement-walk': 'Looking for walking company 🚶‍♀️',
    'placement-travel': 'Looking for travel company ✈️',
    'placement-instruction': 'Click on the map to indicate your location and become visible to other users.',
    'cancel-btn': 'Cancel',
    'select-place': 'Select Place',
    'map-click-instruction': 'Click on the map to place yourself',
    'you-here': 'You are here! 👋',
    'placement-success': 'Great! Now other users can see you',
    'profile-btn': '👤 Profile',
    'join-company': '🤝 Join Company',
    'anonymous': 'Anonymous',
    'show': 'Show',
    'forgot-password': 'Forgot password?',
    'create-profile': 'Create Profile',
    'select-from-gallery': 'Select from Gallery',
    'interests-title': 'Add Interests',
    'add-interests': 'Add Interests'
  }
}

function setupUserStatusFilters() {
  const filterIcons = document.querySelectorAll('.filter-icon');
  filterIcons.forEach(filter => {
    filter.addEventListener('click', function() {
      filterIcons.forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      currentUserStatus = this.dataset.filter;
      
      // Show placement dialog
      showPlacementDialog(this.dataset.filter);
    });
  });
}

function showPlacementDialog(status) {
  const placementPopup = document.createElement('div');
  placementPopup.className = 'placement-popup';
  placementPopup.innerHTML = `
    <div class="placement-content">
      <h3>${t('placement-title')}</h3>
      <p>${t('placement-' + status)}</p>
      <p>${t('placement-instruction')}</p>
      <div class="placement-buttons">
        <button class="placement-btn cancel" onclick="cancelPlacement()">${t('cancel-btn')}</button>
        <button class="placement-btn place" onclick="enableMapPlacement('${status}')">${t('select-place')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(placementPopup);
}

function cancelPlacement() {
  const popup = document.querySelector('.placement-popup');
  if (popup) {
    document.body.removeChild(popup);
  }
}

function enableMapPlacement(status) {
  cancelPlacement();
  
  // Show instruction message
  const instruction = document.createElement('div');
  instruction.className = 'map-instruction';
  instruction.innerHTML = t('map-click-instruction');
  document.body.appendChild(instruction);
  
  // Enable map click
  map.once('click', function(e) {
    placeUserOnMap(e.latlng, status);
    document.body.removeChild(instruction);
  });
}

function placeUserOnMap(latlng, status) {
  // Remove previous marker if exists
  if (myMarker) {
    map.removeLayer(myMarker);
  }
  
  // Create user's marker
  const userIcon = L.divIcon({
    html: `<div style="background: #FF6B6B; color: white; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); animation: pulse 2s infinite;">${getStatusIcon(status)}</div>`,
    iconSize: [45, 45],
    className: 'my-marker'
  });
  
  myMarker = L.marker([latlng.lat, latlng.lng], {icon: userIcon})
    .addTo(map)
    .bindPopup(t('you-here'))
    .openPopup();
    
  // Show success message
  showSuccessPlacement(status);
}

function getStatusIcon(status) {
  const icons = {
    coffee: '☕',
    walk: '🚶‍♀️',
    travel: '✈️'
  };
  return icons[status];
}

function showSuccessPlacement(status) {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  message.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
    <div>${t('placement-success')}</div>
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
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

async function addActiveUsers() {
  try {
    // Try to fetch users from Supabase
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    let activeUsers;
    
    if (error || !profiles || profiles.length === 0) {
      // Fallback to mock data if Supabase is not available
      activeUsers = [
        {
          id: 'user-1',
          lat: 43.2380, lng: 76.8520,
          display_name: 'Айгуль', age: 24, status: 'coffee',
          interests: ['coffee', 'networking'],
          avatar_url: '👩‍💼'
        },
        {
          id: 'user-2',
          lat: 43.2200, lng: 76.8490,
          display_name: 'Stefan', age: 36, status: 'coffee',
          interests: ['hiking', 'co-travel'],
          avatar_url: 'attached_assets/Stefan-min_1756533746271.png'
        },
        {
          id: 'user-3',
          lat: 43.2385, lng: 76.8525,
          display_name: 'Асем', age: 29, status: 'coffee',
          interests: ['coffee', 'photography'],
          avatar_url: 'attached_assets/Асем-min_1756533735058.png'
        },
        {
          id: 'user-4',
          lat: 43.2382, lng: 76.8522,
          display_name: 'Нурлан', age: 30, status: 'travel',
          interests: ['travel', 'adventure'],
          avatar_url: '👨‍🔬'
        },
        {
          id: 'user-5',
          lat: 43.2300, lng: 76.8600,
          display_name: 'Алиса', age: 27, status: 'walk',
          interests: ['walking', 'nature'],
          avatar_url: 'attached_assets/Алиса-min_1756533716406.png'
        },
        {
          id: 'user-6',
          lat: 43.2150, lng: 76.8400,
          display_name: 'Саша', age: 40, status: 'coffee',
          interests: ['business', 'events'],
          avatar_url: 'attached_assets/Саша-min_1756533740790.jpg'
        }
      ];
    } else {
      // Use real Supabase data and add coordinates
      activeUsers = profiles.map((profile, index) => ({
        ...profile,
        lat: 43.2200 + (index * 0.01),
        lng: 76.8500 + (index * 0.01)
      }));
    }
    
    // Store users data globally
    allUsersData = activeUsers;
    
    // Add markers to map
    activeUsers.forEach(user => {
      const icon = getUserIcon(user.status);
      const marker = L.marker([user.lat, user.lng], {icon: icon})
        .addTo(markersLayer);
        
      marker.on('click', function() {
        showUserProfile(user);
      });
    });
    
  } catch (error) {
    console.error('Error loading users:', error);
    // Fallback to mock data
    addMockUsers();
  }
}

function addMockUsers() {
  const activeUsers = [
    {
      id: 'user-1',
      lat: 43.2380, lng: 76.8520,
      display_name: 'Айгуль', age: 24, status: 'coffee',
      interests: ['coffee', 'networking'],
      avatar_url: '👩‍💼'
    },
    {
      id: 'user-2',
      lat: 43.2200, lng: 76.8490,
      display_name: 'Stefan', age: 36, status: 'coffee',
      interests: ['hiking', 'co-travel'],
      avatar_url: 'attached_assets/Stefan-min_1756533746271.png'
    },
    {
      id: 'user-3',
      lat: 43.2385, lng: 76.8525,
      display_name: 'Асем', age: 29, status: 'coffee',
      interests: ['coffee', 'photography'],
      avatar_url: 'attached_assets/Асем-min_1756533735058.png'
    },
    {
      id: 'user-4',
      lat: 43.2382, lng: 76.8522,
      display_name: 'Нурлан', age: 30, status: 'travel',
      interests: ['travel', 'adventure'],
      avatar_url: '👨‍🔬'
    },
    {
      id: 'user-5',
      lat: 43.2300, lng: 76.8600,
      display_name: 'Алиса', age: 27, status: 'walk',
      interests: ['walking', 'nature'],
      avatar_url: 'attached_assets/Алиса-min_1756533716406.png'
    },
    {
      id: 'user-6',
      lat: 43.2150, lng: 76.8400,
      display_name: 'Саша', age: 40, status: 'coffee',
      interests: ['business', 'events'],
      avatar_url: 'attached_assets/Саша-min_1756533740790.jpg'
    }
  ];
  
  // Store users data globally  
  allUsersData = activeUsers;
  
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
    walk: '🚶',
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
  
  const interests = Array.isArray(user.interests) ? user.interests.join(', ') : user.interests || 'Не указано';
  
  // Check if user has a real photo or emoji avatar
  const isPhoto = user.avatar_url && user.avatar_url.includes('attached_assets');
  const avatarContent = isPhoto 
    ? `<img src="${user.avatar_url}" alt="${user.display_name}" class="profile-photo" />` 
    : `<span class="profile-emoji">${user.avatar_url || user.avatar || '👤'}</span>`;
  
  profilePopup.innerHTML = `
    <div class="profile-popup-content">
      <div class="profile-header">
        <div class="profile-avatar">${avatarContent}</div>
        <div class="profile-info">
          <h3>${user.display_name || user.name}, ${user.age}</h3>
          <p class="profile-status">${getStatusText(user.status)}</p>
        </div>
        <button class="close-profile" onclick="closeUserProfile()">×</button>
      </div>
      <div class="profile-bio">
        <p><strong>Интересы:</strong> ${interests}</p>
      </div>
      <div class="profile-actions">
        <button class="action-btn profile-btn" onclick="viewFullProfile('${user.id}')">
          ${t('profile-btn')}
        </button>
        <button class="action-btn join-btn" onclick="joinCompany('${user.id}', '${user.display_name || user.name}')">
          ${t('join-company')}
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

async function viewFullProfile(userId) {
  try {
    // Try to get full profile from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      alert('Профиль недоступен');
      return;
    }
    
    closeUserProfile();
    
    // Show full profile modal
    const fullProfilePopup = document.createElement('div');
    fullProfilePopup.className = 'user-profile-popup';
    
    // Check if profile has a real photo or emoji avatar
    const isPhoto = profile.avatar_url && profile.avatar_url.includes('attached_assets');
    const avatarContent = isPhoto 
      ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" class="profile-photo" />` 
      : `<span class="profile-emoji">${profile.avatar_url || '👤'}</span>`;
    
    fullProfilePopup.innerHTML = `
      <div class="profile-popup-content">
        <div class="profile-header">
          <div class="profile-avatar">${avatarContent}</div>
          <div class="profile-info">
            <h3>${profile.display_name}, ${profile.age}</h3>
            <p class="profile-status">${getStatusText(profile.status)}</p>
          </div>
          <button class="close-profile" onclick="closeUserProfile()">×</button>
        </div>
        <div class="profile-bio">
          <p><strong>Интересы:</strong> ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Не указано'}</p>
          <p><strong>О себе:</strong> Активный пользователь OnPark</p>
        </div>
        <div class="profile-actions">
          <button class="action-btn join-btn" onclick="joinCompany('${profile.id}', '${profile.display_name}')">
            ${t('join-company')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(fullProfilePopup);
    
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Ошибка загрузки профиля');
  }
}

async function joinCompany(userId, userName) {
  try {
    closeUserProfile();
    
    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .eq('from_user', currentUser.id)
      .eq('to_user', userId)
      .single();
    
    if (existingConnection) {
      alert('Запрос уже отправлен!');
      return;
    }
    
    // Create new connection request
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .insert([
        {
          from_user: currentUser.id,
          to_user: userId,
          status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (connectionError) {
      console.error('Connection error:', connectionError);
      // Fallback for demo
      createMockConnection(userId, userName);
      return;
    }
    
    // Add to active connections
    activeConnections.push({
      id: connection.id,
      to_user: userId,
      to_user_name: userName,
      status: 'pending'
    });
    
    // Send initial message
    await sendInitialMessage(userId, userName);
    
    // Show success and enable chat
    showConnectionSuccess(userName);
    
  } catch (error) {
    console.error('Error creating connection:', error);
    createMockConnection(userId, userName);
  }
}

function createMockConnection(userId, userName) {
  // Fallback for when Supabase is not available
  const connectionId = 'mock-conn-' + Date.now();
  
  activeConnections.push({
    id: connectionId,
    to_user: userId,
    to_user_name: userName,
    status: 'pending'
  });
  
  sendMockInitialMessage(userId, userName);
  showConnectionSuccess(userName);
}

async function sendInitialMessage(userId, userName) {
  try {
    const initialMessage = currentLanguage === 'en' 
      ? 'Hi! I want to join your company!' 
      : 'Привет! Я хочу составить компанию!';
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          from_user: currentUser.id,
          to_user: userId,
          message: initialMessage
        }
      ]);
    
    if (error) {
      console.error('Message error:', error);
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function sendMockInitialMessage(userId, userName) {
  // Mock message for demo
  console.log(`Mock message sent to ${userName}: Привет! Я хочу составить компанию!`);
}

function showConnectionSuccess(userName) {
  // Show success message
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  
  const successText = currentLanguage === 'en' 
    ? `Request sent to ${userName}!`
    : `Запрос отправлен ${userName}!`;
  
  message.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🤝</div>
    <div>${successText}</div>
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
  
  // Enable chat icon
  enableChatIcon();
}

function enableChatIcon() {
  // Update chat icon to show active state
  const chatBtn = document.querySelector('#chatBtn');
  if (chatBtn) {
    chatBtn.style.background = '#4CAF50';
    chatBtn.style.color = 'white';
    chatBtn.style.transform = 'scale(1.1)';
    chatBtn.onclick = openChat;
  }
}

// Chat System
let currentChatUser = null;
let chatMessages = [];
let pendingConnections = []; // Store pending connection requests

// Mock pending connections for demo
function initializePendingConnections() {
  pendingConnections = [
    {
      id: 'conn-1',
      from_user: 'user-2',
      from_user_name: 'Stefan',
      from_user_avatar: 'attached_assets/Stefan-min_1756533746271.png',
      message: 'Хочу составить тебе компанию!',
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: 'conn-2', 
      from_user: 'user-5',
      from_user_name: 'Алиса',
      from_user_avatar: 'attached_assets/Алиса-min_1756533716406.png',
      message: 'Хочу составить тебе компанию!',
      timestamp: new Date(Date.now() - 180000) // 3 minutes ago
    }
  ];
}

function openChat() {
  if (activeConnections.length === 0) {
    alert('Нет активных соединений для чата');
    return;
  }
  
  // Use first active connection for demo
  const connection = activeConnections[0];
  currentChatUser = {
    id: connection.to_user,
    name: connection.to_user_name
  };
  
  // Set chat header info
  const chatAvatarEl = document.getElementById('chatAvatar');
  const chatUserNameEl = document.getElementById('chatUserName');
  
  // Find the user data to get avatar
  const userData = allUsersData.find(u => u.id === currentChatUser.id);
  if (userData && userData.avatar_url && userData.avatar_url.includes('attached_assets')) {
    chatAvatarEl.innerHTML = `<img src="${userData.avatar_url}" alt="${currentChatUser.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
  } else {
    chatAvatarEl.textContent = '👤';
  }
  
  chatUserNameEl.textContent = currentChatUser.name;
  
  // Load existing messages
  loadChatMessages();
  
  // Show chat screen
  showScreen('chatScreen');
}

async function loadChatMessages() {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user.eq.${currentUser.id},to_user.eq.${currentChatUser.id}),and(from_user.eq.${currentChatUser.id},to_user.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading messages:', error);
      // Use mock messages for demo
      loadMockMessages();
      return;
    }
    
    chatMessages = messages;
    renderChatMessages();
    
  } catch (error) {
    console.error('Error loading messages:', error);
    loadMockMessages();
  }
}

function loadMockMessages() {
  chatMessages = [
    {
      id: 1,
      from_user: currentUser.id,
      to_user: currentChatUser.id,
      message: 'Привет! Я хочу составить компанию!',
      created_at: new Date(Date.now() - 10000).toISOString()
    },
    {
      id: 2,
      from_user: currentChatUser.id,
      to_user: currentUser.id,
      message: 'Привет! Конечно, давайте встретимся!',
      created_at: new Date(Date.now() - 5000).toISOString()
    }
  ];
  renderChatMessages();
}

function renderChatMessages() {
  const chatContainer = document.getElementById('chatMessages');
  chatContainer.innerHTML = '';
  
  chatMessages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = msg.from_user === currentUser.id ? 'message sent' : 'message received';
    
    const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
      <div class="message-bubble">${msg.message}</div>
      <div class="message-time">${time}</div>
    `;
    
    chatContainer.appendChild(messageDiv);
  });
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const messageText = input.value.trim();
  
  if (!messageText) return;
  
  // Clear input
  input.value = '';
  
  try {
    // Try to save to Supabase
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          from_user: currentUser.id,
          to_user: currentChatUser.id,
          message: messageText
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      // Fallback to mock message
      addMockMessage(messageText);
      return;
    }
    
    // Add to local messages
    chatMessages.push(message);
    renderChatMessages();
    
    // Simulate response after a delay
    setTimeout(() => {
      simulateResponse();
    }, 2000);
    
  } catch (error) {
    console.error('Error sending message:', error);
    addMockMessage(messageText);
  }
}

function addMockMessage(messageText) {
  const mockMessage = {
    id: Date.now(),
    from_user: currentUser.id,
    to_user: currentChatUser.id,
    message: messageText,
    created_at: new Date().toISOString()
  };
  
  chatMessages.push(mockMessage);
  renderChatMessages();
  
  // Simulate response
  setTimeout(() => {
    simulateResponse();
  }, 2000);
}

function simulateResponse() {
  const responses = [
    'Отлично! Где встретимся?',
    'Согласен! Когда удобно?',
    'Хорошая идея! Я готов.',
    'Звучит здорово! Жду встречи.',
    'Давайте обсудим детали!'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  const responseMessage = {
    id: Date.now() + 1,
    from_user: currentChatUser.id,
    to_user: currentUser.id,
    message: randomResponse,
    created_at: new Date().toISOString()
  };
  
  chatMessages.push(responseMessage);
  renderChatMessages();
}

// Notifications System
function showNotifications() {
  showScreen('notificationsScreen');
  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notificationsContent');
  container.innerHTML = '';
  
  if (pendingConnections.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 50px; margin-bottom: 20px;">📭</div>
        <p>Пока нет уведомлений</p>
      </div>
    `;
    return;
  }
  
  pendingConnections.forEach(connection => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-item';
    notificationDiv.innerHTML = `
      <div class="notification-avatar">
        <img src="${connection.from_user_avatar}" alt="${connection.from_user_name}" />
      </div>
      <div class="notification-info">
        <button class="profile-btn-small" onclick="viewUserProfile('${connection.from_user}')">profile</button>
        <div class="notification-message">${connection.message}</div>
        <div class="notification-actions">
          <button class="notification-btn accept-btn" onclick="acceptConnection('${connection.id}')">
            ✓
          </button>
          <button class="notification-btn reject-btn" onclick="rejectConnection('${connection.id}')">
            ✗
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(notificationDiv);
  });
}

function acceptConnection(connectionId) {
  const connection = pendingConnections.find(c => c.id === connectionId);
  if (!connection) return;
  
  // Add to active connections
  activeConnections.push({
    id: connectionId,
    to_user: connection.from_user,
    to_user_name: connection.from_user_name,
    status: 'accepted'
  });
  
  // Remove from pending
  pendingConnections = pendingConnections.filter(c => c.id !== connectionId);
  
  // Show success message
  showConnectionAccepted(connection.from_user_name);
  
  // Re-render notifications
  renderNotifications();
  
  // Enable chat button
  enableChatIcon();
}

function rejectConnection(connectionId) {
  // Remove from pending
  pendingConnections = pendingConnections.filter(c => c.id !== connectionId);
  
  // Re-render notifications
  renderNotifications();
}

function showConnectionAccepted(userName) {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  
  message.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🤝</div>
    <div>Соединение с ${userName} принято!</div>
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
}

function viewUserProfile(userId) {
  // Map user IDs to their specific profile screens
  const profileScreens = {
    'user-2': 'stefanProfileScreen',     // Stefan
    'user-5': 'aliceProfileScreen',      // Алиса
    'user-3': 'asemProfileScreen',       // Асем
    'user-4': 'sashaProfileScreen'       // Саша
  };
  
  const screenId = profileScreens[userId];
  if (screenId) {
    showScreen(screenId);
  } else {
    // Fallback to regular profile popup
    const user = allUsersData.find(u => u.id === userId);
    if (user) {
      showUserProfile(user);
    }
  }
}

function openChatFromNotifications() {
  if (activeConnections.length === 0) {
    alert('Нет активных соединений для чата');
    return;
  }
  
  openChat();
}

// Allow sending message with Enter key
document.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Set up messages button in notifications
  const messagesBtn = document.getElementById('messagesBtn');
  if (messagesBtn) {
    messagesBtn.onclick = openChatFromNotifications;
  }
});

function showSuccessMessage() {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<div class="success-message">Успешно!<br>Мы вам отправляем ссылку, ожидайте.</div>';
}

function showPhotoSuccess() {
  const photoActions = document.querySelector('.photo-actions');
  photoActions.innerHTML = `
    <div style="text-align: center; color: #007AFF; font-weight: 600; margin-bottom: 16px;">
      Фото успешно загружено в Supabase
    </div>
    <button class="photo-btn" onclick="selectPhoto()">Изменить фото</button>
    <button class="primary-btn" onclick="showInterests()">Дальше</button>
  `;
}

// Upload photo to Supabase Storage
async function uploadPhotoToSupabase(file) {
  if (!supabase) {
    console.log('Supabase not available, skipping upload');
    return null;
  }
  
  try {
    const fileName = `avatar_${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    console.log('Photo uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return null;
  }
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