# FullyBooked_PLDI Project Structure

This document provides a comprehensive view of the project's folder structure and files to help maintain organization and track all files within the project.

## Root Directory
- README.md - Main project documentation
- Requirements.md - Project requirements documentation
- Setup.md - Setup instructions
- ProjectStructure.md - This document, outlining the project structure

## Backend
Backend server built with Node.js

### Root Backend Files
- package.json - Node.js dependencies and scripts
- package-lock.json - Locked versions of dependencies
- server.js - Main server entry point
- .env - Environment variables (not committed to git)

### Backend Source (`/backend/src`)
Contains the main application logic organized in a Model-View-Controller (MVC) pattern.

#### Controllers (`/backend/src/controllers`)
Handle business logic and request processing:
- book.controller.js - Book-related operations
- order.controller.js - Order processing
- review.controller.js - Review management
- user.controller.js - User authentication and management

#### Middleware (`/backend/src/middleware`)
Request processing middleware:
- verifyAdminToken.js - Authentication for admin routes

#### Models (`/backend/src/models`)
Database schemas and models:
- book.model.js - Book data model
- order.model.js - Order data model
- review.model.js - Review data model
- user.model.js - User data model

#### Routes (`/backend/src/routes`)
API endpoint definitions:
- book.route.js - Book-related routes
- order.route.js - Order-related routes
- review.route.js - Review-related routes
- user.route.js - User-related routes

### Uploads (`/backend/uploads`)
Directory for storing uploaded files (e.g., book images)

### Utils (`/backend/utils`)
Utility functions and configurations:
- cloudinaryConfig.js - Cloudinary configuration
- cloudinaryUploader.js - Helper for uploading to Cloudinary
- multer.config.js - File upload configuration

## Frontend
Mobile application built with React Native/Expo

### Root Frontend Files
- App.js - Main application component
- app.json - Expo configuration
- index.js - Application entry point
- package.json - Node.js dependencies and scripts
- package-lock.json - Locked versions of dependencies

### Assets (`/frontend/assets`)
Static assets:
- adaptive-icon.png - Adaptive app icon
- favicon.png - Favicon
- icon.png - App icon
- splash-icon.png - Splash screen

#### Logo Files (`/frontend/assets/logo`)
- android-chrome-512x512.jpg - Android Chrome icon
- fav-icon.png - Favicon
- favicon-32x32.png - 32x32 favicon
- FullyBooked-colored.png - Colored logo
- FullyBooked-white.png - White logo

### Source (`/frontend/src`)
Main application source code

#### Assets (`/frontend/src/assets`)
Application assets used within the source code

##### Common (`/frontend/src/assets/common`)
- baseurl.js - Base URL configuration
- is-empty.js - Utility for empty checks

#### Components (`/frontend/src/components`)
Reusable UI components:
- Button.js - Button component
- Header.js - Header component
- SplashScreen.js - Splash screen component

#### Constants (`/frontend/src/constants`)
Application constants:
- theme.js - Theme definitions and styling constants

#### Context (`/frontend/src/context`)
React Context API related files:

##### Actions (`/frontend/src/context/actions`)
- auth.action.js - Authentication actions

##### Reducers (`/frontend/src/context/reducers`)
- auth.reducer.js - Authentication state reducer

##### Store (`/frontend/src/context/store`)
- Auth.js - Authentication store
- AuthGlobal.js - Global authentication context

#### Hooks (`/frontend/src/hooks`)
Custom React hooks:
- useForm.js - Form handling hook

#### Navigation (`/frontend/src/navigation`)
Navigation configuration:
- AdminNavigator.js - Admin user navigation
- AppNavigator.js - Main app navigation
- AuthNavigator.js - Authentication navigation
- CustomerNavigator.js - Customer user navigation

#### Redux (`/frontend/src/redux`)
Redux state management:

##### Actions (`/frontend/src/redux/actions`)
Redux action creators

##### Reducers (`/frontend/src/redux/reducers`)
Redux reducers

#### Screens (`/frontend/src/screens`)
Application screens:
- AccountScreen.js - User account screen
- BooksScreen.js - Book listing screen
- CartScreen.js - Shopping cart screen
- HomeScreen.js - Home screen
- LoginScreen.js - User login screen
- NotificationScreen.js - Notifications screen
- ProductsPage.js - Products display screen
- RegisterScreen.js - User registration screen

##### Admin (`/frontend/src/screens/Admin`)
Admin-specific screens:
- AdminHomeScreen.js - Admin home screen
- ProductManagement.js - Product management screen
- OrderManagement.js - Order management screen
- UserManagement.js - User management screen

#### Services (`/frontend/src/services`)
External service integrations:
- api.js - API client configuration
- firebaseConfig.js - Firebase configuration
- googleAuthService.js - Google authentication service

#### Styles (`/frontend/src/styles`)
Global styles and theme configurations

#### Utils (`/frontend/src/utils`)
Utility functions and helpers