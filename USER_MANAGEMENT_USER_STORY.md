# User Management System - Admin Side

## User Story

As an admin, I want to view, create, and delete user accounts, and manage their subscriptions so I can maintain accurate user data and control the user base effectively.

---

## Acceptance Criteria

### View Users
- ✅ Display a paginated, filterable user list with key fields (User ID/Member ID, Full Name, Username, Email, Phone, Subscription Status, Subscription Details)
- ✅ Search functionality by member ID, username, email, or full name (real-time)
- ✅ Filter by subscription status (Active, Not Subscribed, Expired, Paused)
- ✅ Display subscription status with visual indicators (color-coded badges)
- ✅ Show total user count and filtered results count
- ✅ Responsive table layout for desktop and mobile views

### Create Users
- ✅ "Create User" button in the search bar area
- ✅ Modal form to create new users with fields:
  - Full Name (required)
  - Email (required, with validation)
  - Phone Number (optional, with 10-digit validation)
- ✅ Form validation with error messages
- ✅ Success notification with generated Member ID
- ✅ Auto-refresh user list after creation
- ✅ Loading state during user creation

### Delete Users
- ✅ Delete button on each user row
- ✅ Confirmation modal before deletion with warning message
- ✅ Warning text: "This action cannot be undone and will also delete the user's subscription"
- ✅ Optimistic UI update (immediate removal from list)
- ✅ Loading state during deletion
- ✅ Error messages displayed to user if deletion fails
- ✅ Cascading deletion of related subscription data

### Edit/Manage User Subscriptions
- ✅ Edit button on each user row to open user detail modal
- ✅ Display user details in modal (Member ID, Email, Current Status)
- ✅ **Pause/Unpause Subscription** functionality for active subscriptions:
  - Only available for subscriptions with days remaining > 0
  - Pause requires start and end date selection
  - Date picker with native browser date input
  - Unpause available for paused subscriptions
- ✅ **Set/Renew Subscription** functionality for users without active subscriptions:
  - Plan selector with three options:
    - 1 Month (30 days) - Rs. 1500
    - 3 Months (90 days) - Rs. 4000
    - 12 Months (365 days) - Rs. 17000
  - Set button to activate selected plan
  - Auto-refresh user list after subscription changes
- ✅ Loading state during subscription operations

### Visual Feedback
- ✅ Loading spinner when fetching users
- ✅ Error messages displayed at top of page
- ✅ Success/status messages via alerts
- ✅ Disabled buttons during API operations
- ✅ Loading text in buttons ("Deleting...", "Creating...", "Processing...")
- ✅ Clear visual distinction between action buttons (edit vs delete)
- ✅ Color-coded subscription status badges

### Access Control
- ✅ Admin token required for all API requests
- ✅ Admin middleware validation on backend
- ✅ Proper authorization checks before operations

---

## Design Implementation

### User Interface Components

#### User List Table
- Sortable by creation date (newest first)
- Columns: No., User ID, Full Name, Username, Email, Phone, Subscription Status, Subscription Details, Actions
- Color-coded status badges:
  - **Active** (Green): User has active subscription with days remaining
  - **Not Subscribed** (Gray): No subscription or never subscribed
  - **Expired** (Red): Subscription days have expired
  - **Paused** (Yellow): Subscription is paused
- Subscription Details: Format `{membershipId} ({daysLeft}/{totalDays} days)` or "N/A"

#### Search & Filter Section
- Search input with real-time filtering
- Filter dropdown for subscription status with checkboxes
- Filter count indicator
- "Create User" button
- Results count display

#### Action Buttons (per row)
- Edit Button: Opens user detail modal (pencil icon)
- Delete Button: Opens delete confirmation modal (trash icon)

#### Modals

**Delete Confirmation Modal**
- Title: "Confirm Delete"
- Message: "Are you sure you want to delete the user {name}?"
- Warning: "This action cannot be undone and will also delete the user's subscription."
- Buttons: "No, Cancel" | "Yes, Delete"
- Disabled state during deletion

**Edit User Modal**
- Title: "Edit User: {fullname}"
- User Info Section: Member ID, Email, Current Status
- Conditional Sections:
  1. **For Active/Paused Subscriptions** (days left > 0):
     - Pause Subscription (if active): Date range inputs + pause button
     - Unpause Subscription (if paused): Unpause button
  2. **For No/Expired Subscriptions**:
     - Set/Renew Subscription
     - Plan selector with 3 card options (1M, 3M, 12M)
     - Set button
- Close button at footer

**Create User Modal**
- Title: "Create New User"
- Form fields:
  - Full Name (text, required)
  - Email (email, required)
  - Phone Number (tel, optional)
- Form validation with error display
- Buttons: "Cancel" | "Create User"
- Close button (X) in header
- Disabled state during creation

---

## Frontend Implementation

### Technology Stack
- React (Hooks: useState, useEffect, useRef)
- Fetch API for HTTP requests
- localStorage for token management
- CSS for styling with responsive design

### Key Features

1. **Data Management**
   - User list state with subscription details
   - Fetch and cache users on component mount
   - Real-time search/filter without API calls
   - Auto-refresh after create/delete/edit operations

2. **Subscription Calculation**
   - `calculateDaysLeft()`: Calculates remaining days considering:
     - Total subscription days
     - Elapsed days since subscription start
     - Paused days (excluded from elapsed calculation)
     - Current date
   - Returns max(0, daysLeft) for expired subscriptions

3. **Status Determination**
   - `getSubscriptionStatus()`: Returns status and CSS class based on:
     - No subscription → "Not Subscribed"
     - Days left ≤ 0 → "Expired"
     - Status === 'pause' → "Paused"
     - Otherwise → "Active"

4. **Modal Management**
   - Delete modal: userId, userName, show flag, deleting state
   - Edit modal: user object, show flag, submitting state
   - Create modal: form data, error state, creating state
   - Date input type switching for native browser date picker

5. **API Integration**
   - `GET /api/user/admin/all` - Fetch all users with subscriptions
   - `POST /api/user/admin/create` - Create new user
   - `DELETE /api/user/admin/{userId}` - Delete user
   - `GET /api/subscription/admin/get/{userId}` - Fetch subscription details
   - `POST /api/subscription/admin/pause/{userId}` - Pause subscription
   - `POST /api/subscription/admin/resume/{userId}` - Resume subscription
   - `POST /api/subscription/admin/set/{userId}` - Set/renew subscription

### Component State Structure
```javascript
{
  users: Array,                    // Cached user list
  loading: Boolean,                // Initial data load
  error: String,                   // Global error message
  searchQuery: String,             // Search filter
  filters: {                       // Status filters
    active: Boolean,
    notSubscribed: Boolean,
    expired: Boolean,
    paused: Boolean
  },
  deleteModal: {                   // Delete confirmation
    show: Boolean,
    userId: String,
    userName: String
  },
  deleting: Boolean,               // Delete operation state
  editModal: {                     // Edit/manage subscription
    show: Boolean,
    user: Object
  },
  pauseData: {                     // Pause subscription dates
    startDate: String,
    endDate: String
  },
  subscriptionData: {              // Subscription info
    membershipId: String,
    totalDays: String
  },
  selectedPlan: String,            // Selected plan ID
  submitting: Boolean,             // Edit operation state
  createModal: {                   // Create user
    show: Boolean
  },
  createFormData: {                // Create form
    fullname: String,
    email: String,
    phone: String
  },
  createFormError: String,         // Create form error
  creatingUser: Boolean            // Create operation state
}
```

---

## Backend Implementation

### Technology Stack
- Node.js + Express
- MongoDB with Mongoose ODM
- Middleware: Admin authentication, Authorization

### API Endpoints

#### List Users
```
GET /api/user/admin/all
Auth: Required (Admin)
Response: {
  success: Boolean,
  count: Number,
  users: Array<{
    id: ObjectId,
    memberId: String,
    fullname: String,
    username: String,
    email: String,
    phone: String,
    authProvider: String,
    createdAt: Date,
    subscription: {
      membershipId: String,
      totalDays: Number,
      daysLeft: Number,
      startDate: Date,
      endDate: Date,
      status: String (active|pause),
      hasSubscribedBefore: Boolean
    } | null
  }>
}
```

#### Create User
```
POST /api/user/admin/create
Auth: Required (Admin)
Body: {
  fullname: String (required),
  email: String (required),
  phone: String (optional)
}
Response: {
  success: Boolean,
  message: String,
  user: {
    _id: ObjectId,
    memberId: String,
    fullname: String,
    email: String,
    phone: String,
    ...
  }
}
```

#### Delete User
```
DELETE /api/user/admin/:userId
Auth: Required (Admin)
Response: {
  success: Boolean,
  message: String
}
Logic:
  1. Verify user exists
  2. Delete user's subscription (if exists)
  3. Delete user document
  4. Return success
```

#### Get Single User Details
```
GET /api/subscription/admin/get/:userId
Auth: Required (Admin)
Response: {
  success: Boolean,
  subscription: {
    membershipId: String,
    totalDays: Number,
    daysLeft: Number,
    startDate: Date,
    endDate: Date,
    status: String,
    hasSubscribedBefore: Boolean
  }
}
```

#### Pause Subscription
```
POST /api/subscription/admin/pause/:userId
Auth: Required (Admin)
Body: {
  startDate: Date,
  endDate: Date
}
Response: {
  success: Boolean,
  message: String
}
```

#### Resume Subscription
```
POST /api/subscription/admin/resume/:userId
Auth: Required (Admin)
Response: {
  success: Boolean,
  message: String
}
```

#### Set/Renew Subscription
```
POST /api/subscription/admin/set/:userId
Auth: Required (Admin)
Body: {
  plan: String (1_month|3_months|12_months)
}
Response: {
  success: Boolean,
  message: String
}
```

### Data Models

#### User
```javascript
{
  _id: ObjectId,
  memberId: String (unique, auto-generated),
  fullname: String,
  username: String (unique),
  email: String (unique),
  phone: String,
  password: String (hashed, not returned),
  authProvider: String (native|google|apple),
  profilePicture: String (Cloudinary URL),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

#### Subscription
```javascript
{
  _id: ObjectId,
  user: ObjectId (User reference),
  membershipId: String (plan identifier),
  totalDays: Number,
  daysLeft: Number (calculated),
  startDate: Date,
  endDate: Date,
  status: String (active|pause),
  pauseInfo: {
    pauseStartDate: Date,
    pauseEndDate: Date
  },
  hasSubscribedBefore: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Authorization & Validation
- **Admin Middleware**: Validates admin token and user role
- **User Validation**: 
  - Required fields check
  - Email format validation
  - Duplicate email/username prevention
- **Subscription Validation**:
  - Date validation (end > start)
  - Plan validation against allowed plans
  - Subscription status checks
- **Error Handling**: Structured JSON responses with success flags and descriptive messages
- **Audit Logging**: Deletion operations are tracked (implicitly via created/updated timestamps)

---

## Testing Scenarios

### User List
- [ ] Load users on component mount
- [ ] Display all users in table
- [ ] Search works for member ID, fullname, username, email
- [ ] Filter by single status
- [ ] Filter by multiple statuses
- [ ] Clear filters
- [ ] Results count updates correctly
- [ ] Table is responsive on mobile

### Create User
- [ ] Create button opens modal
- [ ] Validate required fields
- [ ] Validate email format
- [ ] Validate phone format (10 digits)
- [ ] Show form error messages
- [ ] User created successfully
- [ ] Member ID displayed in success message
- [ ] List refreshes after creation

### Delete User
- [ ] Delete button opens confirmation modal
- [ ] Cancel button closes modal without deleting
- [ ] Confirm button deletes user
- [ ] User removed from list immediately
- [ ] Subscription cascaded deleted
- [ ] Error shown if deletion fails
- [ ] Buttons disabled during deletion

### Manage Subscriptions
- [ ] Edit button opens user detail modal
- [ ] Pause section shown for active subscriptions only
- [ ] Pause requires date validation
- [ ] Pause updates subscription status
- [ ] Unpause button shown for paused subscriptions
- [ ] Set subscription shown for non-active subscriptions
- [ ] Plan selector displays 3 plan options
- [ ] Subscription set successfully
- [ ] List refreshes after subscription changes
- [ ] Days left calculation is accurate

### Error Handling
- [ ] Network error shows error message
- [ ] API errors displayed to user
- [ ] Loading states prevent multiple submissions
- [ ] Validation prevents invalid submissions

---

## Known Implementation Details

### Frontend
- Date inputs use type switching (text/date) for better browser compatibility
- Date picker opened via `showPicker()` method when available
- Subscription status calculated on-the-fly considering pause periods
- Member ID generated by backend with auto-incrementing counter
- Authentication via `adminToken` from localStorage
- Delete operation uses local state update for optimistic UI (immediate removal from list)

### Backend
- User creation generates unique `memberId` via Counter model
- Password field excluded from all responses
- Subscription `daysLeft` calculated server-side during fetch
- Subscription pause period deducted from elapsed days
- Deletion cascades subscription record
- All admin endpoints require admin middleware validation

### API Base URL
- Development: `http://localhost:5000/api`
- Environment variable: `EXPO_PUBLIC_API_URL` (for mobile app)
- Configurable in environment files

---

## Future Enhancements
- [ ] Pagination support for large user lists
- [ ] Sorting options (by name, email, status, date)
- [ ] Bulk user operations (delete, subscribe, etc.)
- [ ] User activity/login history
- [ ] Export user list to CSV
- [ ] User role management (admin, trainer, user)
- [ ] Audit log dashboard
- [ ] User notes/comments section
- [ ] Advanced subscription plans with custom days
