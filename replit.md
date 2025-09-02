# OnPark

## Overview

OnPark is a social location-based mobile web application that allows users to share their current status and location with others. The app enables users to create profiles, post location-based statuses (like "having coffee", "walking", "traveling"), and view other users' activities on an interactive map. The application is designed as a mobile-first Progressive Web App (PWA) with Telegram Mini App integration capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla JavaScript, HTML5, CSS3 with mobile-first responsive design
- **UI Framework**: Custom CSS with mobile container simulation for consistent mobile experience
- **Map Integration**: Leaflet.js for interactive mapping functionality
- **Screen Management**: Single Page Application (SPA) with JavaScript-based screen transitions
- **Multi-language Support**: Built-in internationalization with Russian and English language switching
- **Telegram Integration**: Native Telegram WebApp API integration for seamless in-app experience

### Backend Architecture
- **Deployment Platform**: Vercel serverless functions for production deployment
- **API Structure**: RESTful API endpoints using Vercel's `/api` directory structure
- **Development Server**: Node.js HTTP server for local development (server.js)
- **Authentication**: Supabase Auth integration with both anonymous and authenticated access patterns
- **File Upload**: Multipart form handling using Busboy library for avatar and media uploads

### Data Storage Solutions
- **Primary Database**: Supabase (PostgreSQL) with the following core tables:
  - `profiles`: User profile information including display_name, age, interests, avatar
  - `statuses`: Location-based user statuses with coordinates, icons, and messages  
  - `messages`: Direct messaging between users with thread-based organization
- **File Storage**: Supabase Storage for avatar images and user-uploaded content
- **Row Level Security (RLS)**: Implemented for data access control and user privacy
- **Caching Strategy**: In-memory caching for frequently accessed user statuses and profiles

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