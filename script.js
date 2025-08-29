import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Avatar preview functionality
const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatarPreview');

avatarInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Show loading state
  const submitBtn = document.querySelector('.submit-btn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const btnText = document.querySelector('.btn-text');
  
  loadingSpinner.style.display = 'inline-block';
  btnText.style.display = 'none';
  submitBtn.disabled = true;

  const displayName = document.getElementById('display_name').value;
  const age = parseInt(document.getElementById('age').value);
  const status = document.getElementById('status').value;
  const interests = document.getElementById('interests').value;
  const avatarFile = document.getElementById('avatar').files[0];

  let avatarUrl = '';

  // Загрузка фото в Supabase Storage
  if (avatarFile) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('Avatars') // имя bucket
      .upload(fileName, avatarFile);

    if (error) {
      console.error('Ошибка загрузки изображения:', error.message);
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('Avatars')
      .getPublicUrl(fileName);

    avatarUrl = publicUrlData.publicUrl;
  }

  // Сохранение данных профиля
  const { error: insertError } = await supabase
    .from('profiles')
    .insert([
      {
        display_name: displayName,
        age: age,
        status: status,
        interests: interests,
        avatar_url: avatarUrl,
      },
    ]);

  const resultDiv = document.getElementById('result');
  
  // Hide loading state
  loadingSpinner.style.display = 'none';
  btnText.style.display = 'inline';
  submitBtn.disabled = false;
  
  if (insertError) {
    console.error('Ошибка сохранения профиля:', insertError.message);
    resultDiv.innerHTML = '<div class="error-message">Ошибка при сохранении профиля!</div>';
  } else {
    resultDiv.innerHTML = '<div class="success-message">Профиль успешно создан!</div>';
    document.getElementById('profileForm').reset();
    avatarPreview.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#E1E5E9"/></svg>`;
  }
});
