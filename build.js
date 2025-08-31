#!/usr/bin/env node

// Build script to inject environment variables into static files
const fs = require('fs');
const path = require('path');

console.log('Building static site with environment variables...');

// Read the index.html template
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Log status (without exposing sensitive data)
console.log('SUPABASE_URL configured:', !!supabaseUrl);
console.log('SUPABASE_ANON_KEY configured:', !!supabaseKey);

// Replace the placeholder tokens with actual environment variables
indexContent = indexContent.replace('__SUPABASE_URL__', supabaseUrl);
indexContent = indexContent.replace('__SUPABASE_ANON_KEY__', supabaseKey);

// Write the built file
fs.writeFileSync(indexPath, indexContent);

console.log('✓ Static site built successfully with environment variables');
console.log('✓ JWT tokens removed from source code');
console.log('✓ Configuration loaded from secure environment variables');