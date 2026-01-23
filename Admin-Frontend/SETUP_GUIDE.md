# Muscle Garage Admin Panel - Setup Guide

## 🎯 Project Overview

The Admin Panel for Muscle Garage has been set up with a modern, clean design featuring:
- **Design Theme**: White background, Black text, Orange accents (#FFA500)
- **Typography**: Poppins font with consistent sizing across headings and body text
- **Modern UI**: Responsive design with smooth animations and transitions

## 📁 Project Structure

```
Admin-Frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx         # Admin login page
│   │   ├── LoginPage.css
│   │   ├── Dashboard.jsx         # Dashboard (empty placeholder)
│   │   ├── Dashboard.css
│   │   ├── UserManagement.jsx    # User Management (empty placeholder)
│   │   └── UserManagement.css
│   ├── layouts/
│   │   ├── AdminLayout.jsx       # Main admin layout wrapper
│   │   └── AdminLayout.css
│   ├── components/
│   │   ├── TopBar.jsx            # Header with logo and logout
│   │   ├── TopBar.css
│   │   ├── Sidebar.jsx           # Left navigation sidebar
│   │   ├── Sidebar.css
│   │   ├── Footer.jsx            # Footer with copyright
│   │   ├── Footer.css
│   │   └── ProtectedRoute.jsx    # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication state management
│   ├── App.jsx                   # Main app with routing
│   ├── App.css
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Global styles and theme variables
│   └── .env                      # Environment configuration
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

### 1. Install Dependencies (Already Done)
```bash
cd Admin-Frontend
npm install react-router-dom axios
```

### 2. Start the Development Server
```bash
npm run dev
```
The app will run on `http://localhost:5173`

### 3. Backend Setup
Make sure the backend server is running:
```bash
cd Backend
npm install
npm start
```
Backend runs on `http://localhost:5000`

## 🔐 Admin Login

**Credentials** (from Backend/.env):
- **Email**: musclegarage0@gmail.com
- **Password**: MuscleGarageAdmin123

Login page features:
- Clean, modern form design
- Email and password validation
- Error messages for failed login attempts
- Automatic redirect to dashboard on successful login

## 📱 Admin Panel Features

### Top Bar
- **Muscle Garage Logo** (left side) with "Admin" badge
- **User Menu** with logout option (right side)
- **Sidebar Toggle** button for mobile responsiveness

### Left Sidebar Navigation
- **Dashboard** - Main dashboard view (empty placeholder)
- **User Management** - User management interface (empty placeholder)
- Active link highlighting with orange underline

### Layout Structure
- Sticky top bar for easy access to logout
- Collapsible sidebar (auto-collapses on mobile)
- Main content area with light gray background
- Footer with copyright message: "© 2026 Muscle Garage. All rights reserved."

## 🎨 Design System

### Colors
- **Primary (Orange)**: #FFA500
- **Secondary (Black)**: #000000
- **Background**: #FFFFFF
- **Text**: #000000
- **Border**: #E0E0E0
- **Light Gray**: #f9f9f9

### Typography
- **Font Family**: Poppins (weights: 300, 400, 500, 600, 700)
- **Heading Sizes**: 
  - H1: 2.5rem
  - H2: 2rem
  - H3: 1.5rem
  - H4: 1.25rem
  - H5: 1.1rem
  - H6: 1rem
- **Body Text**: 1rem, font-weight 400

### Shadows & Effects
- Default shadow: `0 2px 8px rgba(0, 0, 0, 0.1)`
- Smooth transitions: 0.3s ease
- Hover effects with subtle animations

## 🔑 Key Components

### AuthContext
Manages admin authentication state:
- `isAuthenticated` - Boolean flag for login status
- `adminEmail` - Stored admin email
- `login(email)` - Initialize admin session
- `logout()` - Clear session and localStorage
- `loading` - Initial auth check state

### ProtectedRoute
Wraps admin routes:
- Redirects to login if not authenticated
- Shows loading state while checking auth
- Prevents unauthorized access

### Router Structure
```
/ → Redirect to /login
/login → LoginPage
/admin/dashboard → Dashboard (Protected)
/admin/user-management → UserManagement (Protected)
```

## 📝 Environment Variables

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:5000
```

**Backend (.env)** - Already configured:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
PORT=5000
EMAIL_ADMIN=musclegarage0@gmail.com
ADMIN_PASS=MuscleGarageAdmin123
EMAIL_PASS=...
```

## 🔄 Authentication Flow

1. User accesses the app → Redirected to login page
2. User enters email (musclegarage0@gmail.com) and password (MuscleGarageAdmin123)
3. Frontend sends credentials to `POST /api/auth/admin-login`
4. Backend validates credentials against env variables
5. On success: JWT token returned, session stored in localStorage
6. User redirected to admin dashboard
7. Token persists across browser refreshes
8. Click logout to clear session and return to login

## 🎯 Next Steps

To add features later, update these empty placeholder pages:
- [Dashboard.jsx](src/pages/Dashboard.jsx) - Add dashboard widgets, stats, charts
- [UserManagement.jsx](src/pages/UserManagement.jsx) - Add user table, filters, actions

Each page already has:
- Consistent styling with global theme
- Proper integration with AdminLayout
- Full access to authentication context

## 💡 Development Tips

1. **Add new routes**: Update App.jsx router configuration
2. **Add new sidebar links**: Update Sidebar.jsx navigation
3. **Access auth state**: Use `const { isAuthenticated, adminEmail } = useAuth()`
4. **Use theme colors**: Reference CSS custom properties like `var(--primary-color)`
5. **Responsive design**: Sidebar auto-collapses on mobile, adjust padding in `.admin-content`

## ✅ Ready to Go!

The admin panel is now fully set up and ready to use. Log in with the credentials provided and start customizing the dashboard and user management pages according to your needs!
