# OnPark MVP

## Overview

OnPark is a social location-based application that allows users to share their current status and location with others. The app enables users to create profiles, post location-based statuses (like "having coffee", "walking", "traveling"), and view other users' activities on an interactive map. The application is now fully migrated to Vercel + Supabase architecture with comprehensive Telegram Mini App integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Web Interface**: Vanilla JavaScript, HTML5, CSS3 with mobile-first responsive design
- **Telegram Mini App**: Complete PWA with native Telegram WebApp API integration
- **Map Integration**: Leaflet.js for interactive mapping functionality
- **UI Components**: Custom CSS with mobile container simulation for consistent experience
- **Screen Management**: Single Page Application (SPA) with JavaScript-based screen transitions
- **Multi-language Support**: Built-in internationalization with Russian and English language switching
- **Real-time Updates**: Active status loading with 24-hour expiration and location filtering

### Backend Architecture
- **Deployment Platform**: Vercel serverless functions for production deployment
- **API Structure**: RESTful API endpoints using Vercel's `/api` directory structure
- **Development Server**: Node.js HTTP server for local development (server.js)
- **Authentication**: Dual authentication system:
  - Telegram initData verification for Mini App users
  - Supabase Auth for web interface users
- **Chat System**: Real-time messaging with room-based architecture and Telegram bot notifications
- **Performance**: P50 response time <150ms for GET /api/statuses with active status filtering

### Data Storage Solutions
- **Primary Database**: Supabase (PostgreSQL) with comprehensive schema:
  - `profiles`: User profiles with both regular and Telegram user support (user_key, telegram_id)
  - `statuses`: Location-based statuses with 24-hour expiration and user_key indexing
  - `chat_rooms`: Private messaging rooms between users  
  - `chat_messages`: Message storage with sender tracking and timestamps
  - `sessions`: Session storage for authentication
- **File Storage**: Supabase Storage for avatar images and user-uploaded content
- **Row Level Security (RLS)**: Comprehensive policies for data isolation and privacy
- **Performance Optimization**: Active status filtering, geographical bounding box queries, and response time monitoring

### Authentication and Authorization
- **Authentication Provider**: Supabase Auth with email/password and social login options
- **Access Control**: Row Level Security policies for data isolation
- **Client Types**: 
  - Anonymous access for public map viewing
  - Authenticated access for profile creation and status posting
  - Service role access for admin operations
- **Security Model**: Separate admin client with elevated privileges for server-side operations

## External Dependencies

### Core Services
- **Supabase**: Backend-as-a-Service providing PostgreSQL database, authentication, storage, and real-time capabilities
- **Vercel**: Hosting platform for static site deployment and serverless API functions
- **Leaflet.js**: Open-source interactive mapping library for location visualization

### Development Dependencies
- **Node.js Packages**:
  - `@supabase/supabase-js`: Official Supabase client library
  - `@google-cloud/storage`: Google Cloud Storage integration (legacy)
  - `busboy`: Multipart form parsing for file uploads
  - `openid-client`: OpenID Connect client implementation
  - `memoizee`: Function memoization for performance optimization

### Third-Party Integrations
- **Telegram WebApp API**: For in-app Telegram bot integration and user authentication
- **Geolocation API**: Browser-based location services for user positioning
- **Map Tiles**: OpenStreetMap tiles via Leaflet.js default providers

### Configuration Management
- **Environment Variables**: Supabase credentials and API keys managed through Vercel environment variables
- **Client Configuration**: Centralized config.js file for frontend environment management
- **Build Process**: Custom build script for environment variable injection into static assets

### Development Tools
- **Package Manager**: npm with package-lock.json for dependency management
- **Code Security**: Semgrep rules for static analysis and security scanning
- **Asset Management**: Custom file upload handling with Supabase Storage integration