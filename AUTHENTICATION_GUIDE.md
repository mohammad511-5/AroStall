# Authentication System Guide

## Overview

This Roblox Shop includes a complete authentication system with:

- **User Registration & Login**: Secure email/password authentication
- **Session Management**: Persistent login sessions
- **Transaction History**: Complete purchase tracking
- **User Dashboard**: Profile management and order history
- **Security Features**: Encrypted passwords, secure API calls, protected routes

## Features

### 🔐 Authentication
- **Sign Up**: Create new accounts with email, password, and name
- **Login**: Secure login with session persistence
- **Logout**: Clean session termination
- **Session Recovery**: Automatic login on page refresh

### 📊 User Dashboard
- View profile information (name, email, join date)
- Complete transaction history with:
  - Transaction ID and timestamp
  - Items purchased and quantities
  - Total amounts in BDT
  - Transaction status

### 🛒 Secure Checkout
- Login required for purchases
- Automatic transaction recording
- Real-time status updates
- Success/error notifications

## How It Works

### Backend (Supabase Edge Functions)

**Server Endpoints** (`/supabase/functions/server/index.tsx`):

1. **POST `/make-server-f343f1a0/signup`**
   - Creates new user with Supabase Auth
   - Stores user profile in KV store
   - Initializes empty transaction history
   - Auto-confirms email (no email server required)

2. **GET `/make-server-f343f1a0/profile`** (Protected)
   - Requires authentication token
   - Returns user profile data

3. **POST `/make-server-f343f1a0/transaction`** (Protected)
   - Requires authentication token
   - Creates new transaction record
   - Stores in user's transaction history

4. **GET `/make-server-f343f1a0/transactions`** (Protected)
   - Requires authentication token
   - Returns user's complete transaction history

### Frontend Components

**Auth Context** (`/src/contexts/AuthContext.tsx`):
- Manages authentication state
- Handles login/signup/logout
- Maintains session persistence
- Provides user data to components

**Auth Modal** (`/src/app/components/AuthModal.tsx`):
- Login/signup form with validation
- Error handling and display
- Security badge for user confidence

**User Dashboard** (`/src/app/components/UserDashboard.tsx`):
- Profile information display
- Transaction history viewer
- Logout functionality

**Cart with Checkout** (`/src/app/components/Cart.tsx`):
- Secure checkout process
- Transaction creation
- Success/error feedback

## Security Features

### 🔒 Password Security
- Minimum 6 characters required
- Encrypted using Supabase Auth (bcrypt)
- Never stored in plain text
- Secure transmission over HTTPS

### 🛡️ API Security
- All user endpoints require authentication
- Bearer token validation
- Service role key kept server-side only
- CORS protection on edge functions

### 📝 Data Privacy
- User data isolated by user ID
- Transaction history is private
- No cross-user data access
- KV store key prefixing for isolation

## Usage Flow

### New User Journey
1. Click "Login" in header
2. Switch to "Sign Up" tab
3. Enter name, email, and password (min 6 chars)
4. Submit to create account
5. Automatically logged in
6. Can now make purchases

### Returning User Journey
1. Click "Login" in header
2. Enter email and password
3. Submit to login
4. Session persists across page refreshes

### Making a Purchase
1. Must be logged in
2. Add items to cart
3. Open cart and click "Checkout"
4. Transaction is recorded
5. View in dashboard transaction history

### Viewing History
1. Click user name in header
2. Dashboard opens showing:
   - Profile information
   - Complete transaction history
   - Each transaction with full details

## Data Structure

### User Profile (KV Store)
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2026-06-04T12:00:00.000Z"
}
```

### Transaction Record
```json
{
  "id": "txn_1234567890_abc123",
  "userId": "user-uuid",
  "items": [
    {
      "id": "product-id",
      "name": "Product Name",
      "price": 1000,
      "quantity": 2
    }
  ],
  "total": 2000,
  "status": "completed",
  "createdAt": "2026-06-04T12:00:00.000Z"
}
```

## Environment Configuration

Required environment variables (set by Make/Figma platform):
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

## Important Notes

⚠️ **This is a prototype/demo system**:
- Make is designed for prototyping, not production
- Not intended for collecting real PII or sensitive data
- Email confirmation is auto-approved (no email server)
- For production use, implement proper email verification
- Add additional security measures for real deployments

## Troubleshooting

### "Supabase not configured" error
- Ensure Supabase is connected via Make settings
- Check that environment variables are set
- Verify edge functions are deployed

### Login fails after signup
- Check browser console for error messages
- Verify email format is valid
- Ensure password is at least 6 characters

### Transactions not saving
- Confirm you're logged in
- Check network tab for API errors
- Verify Supabase connection is active

### Session not persisting
- Check browser localStorage
- Ensure cookies are enabled
- Clear cache and try again

## Next Steps for Production

To make this production-ready:

1. **Email Verification**: Set up email confirmation flow
2. **Password Reset**: Implement forgot password functionality
3. **Enhanced Security**: Add 2FA, rate limiting, CAPTCHA
4. **Payment Integration**: Connect real payment processor
5. **Data Migration**: Move from KV store to proper database tables
6. **Monitoring**: Add error tracking and analytics
7. **Legal**: Add terms of service, privacy policy
8. **Testing**: Comprehensive unit and integration tests
