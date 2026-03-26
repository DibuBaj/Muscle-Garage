# Poppins Font Implementation Guide

## ✅ Completed Changes

### 1. **Admin-Frontend (React Web App)** - FULLY COMPLETE
- ✅ Global Poppins import in `src/index.css`
- ✅ All CSS files declare `font-family: 'Poppins', sans-serif`
- ✅ Web fonts loaded from Google Fonts CDN

### 2. **Backend (Node.js Server)** - COMPLETE  
- ✅ Email template updated in `config/email.js`
- ✅ Changed from Arial to `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### 3. **User-Frontend (React Native/Expo)** - MOSTLY COMPLETE

#### Installed Packages:
```bash
npm install @expo-google-fonts/poppins
```

#### Font Loading Setup ✅
- **File**: `hooks/useFonts.ts`
  - Imports Poppins weights (300, 400, 500, 600, 700, 800)
  - Handles SplashScreen visibility
  - Returns `fontsLoaded` boolean

#### Root Layout Updated ✅
- **File**: `app/_layout.tsx`
  - Now calls `useFonts()` hook
  - Returns `null` until fonts load
  - Waits for SplashScreen to hide

#### Store Screen Updated ✅
- **File**: `app/(tabs)/store.tsx`
  - Added `fontFamily: 'Poppins'` to 50+ text styles
  - All payment, checkout, product, and order text now uses Poppins

#### Custom Text Component Created ✅
- **File**: `components/CustomText.tsx`
  - Wraps React Native `Text` component
  - Automatically applies `fontFamily: 'Poppins'`
  - Use instead of importing from `react-native`

---

## 🔧 How to Complete the Implementation

### Option 1: Use Custom Text Component (Recommended - Fastest)

Replace imports in all screen files:
```typescript
// ❌ Old
import { Text } from 'react-native';

// ✅ New
import { Text } from '@/components/CustomText';
```

This automatically applies Poppins to ALL Text components without manual StyleSheet updates.

### Option 2: Manual StyleSheet Updates

For each screen file, add `fontFamily: 'Poppins'` to text-related styles:

```typescript
// Example
const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins',  // Add this line
  },
  // ... other styles
});
```

---

## 📋 Files That Still Need Updates (Optional with Custom Text)

If **not** using the Custom Text component, add `fontFamily: 'Poppins'` to these screens:

### Tabs Screens:
- [ ] `app/(tabs)/index.tsx` - 30+ text styles
- [ ] `app/(tabs)/membership.tsx` - 20+ text styles
- [ ] `app/(tabs)/booking.tsx` - 15+ text styles
- [ ] `app/(tabs)/_layout.tsx` - header text styles

### Auth Screens:
- [ ] `app/login.tsx` - form text styles
- [ ] `app/signup.tsx` - form text styles
- [ ] `app/auth-choice.tsx` - button text
- [ ] `app/auth-email.tsx` - input text
- [ ] `app/forgot-password.tsx` - form text
- [ ] `app/google-onboarding.tsx` - onboarding text
- [ ] `app/verify-otp.tsx` - OTP text

---

## 🚀 Testing

1. Start the app: `npm start`
2. Verify fonts load (SplashScreen should hide smoothly)
3. All text should display in Poppins font
4. Check both iOS and Android renderings if available

---

## 📝 Key Points

- ✅ **Fonts load on first app startup** via the `useFonts` hook
- ✅ **SplashScreen waits** for fonts to be ready before hiding
- ✅ **Web version** uses Google Fonts CDN (already complete)
- ✅ **Email templates** use Poppins font stack
- ✅ **Custom Text component** eliminates the need for manual updates across 15+ files

Choose the approach that fits your workflow best!
