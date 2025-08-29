# Overview

This is a simple web application for creating user profiles with personal information and photo uploads. The application allows users to input their display name, age, status, interests, and upload an avatar image. It's built as a basic frontend application that integrates with Supabase for data storage and file management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: Vanilla HTML, CSS, and JavaScript
- **Structure**: Single-page application with a basic form interface
- **Design Pattern**: Simple event-driven architecture using DOM manipulation
- **User Interface**: Minimal styling with a focus on functionality over aesthetics

## Backend Architecture
- **Backend-as-a-Service**: Supabase integration for serverless backend functionality
- **Data Storage**: Supabase database with a `profiles` table structure
- **File Storage**: Supabase Storage with an `Avatars` bucket for image uploads
- **Client-Side Processing**: All business logic handled in the browser

## Data Model
- **Profile Schema**: Contains fields for display_name, age, status, interests, and avatar_url
- **File Naming**: Timestamp-based file naming for uploaded avatars to ensure uniqueness
- **Data Types**: Mixed data types including text, integers, and file URLs

## Authentication & Security
- **Authentication**: Uses Supabase anonymous key (no user authentication implemented)
- **File Access**: Public URL generation for uploaded avatar images
- **Environment Variables**: Supabase credentials stored in environment variables

# External Dependencies

## Supabase Integration
- **Database Service**: Supabase PostgreSQL database for profile data storage
- **Storage Service**: Supabase Storage for avatar image file management
- **Client Library**: @supabase/supabase-js for database and storage operations
- **Configuration**: Requires SUPABASE_URL and SUPABASE_ANON_KEY environment variables

## File Upload Handling
- **Image Processing**: Browser-native file handling with image type restrictions
- **Storage Bucket**: 'Avatars' bucket in Supabase Storage
- **Public Access**: Generated public URLs for stored images

## Browser Dependencies
- **ES6 Modules**: Uses modern JavaScript import/export syntax
- **File API**: Leverages browser File API for image upload functionality
- **Form Handling**: Standard HTML5 form validation and submission