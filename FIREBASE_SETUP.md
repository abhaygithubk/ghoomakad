# Firebase OTP Setup — 5 Minutes!

## Step 1: Firebase Project Banao (FREE)
1. Jaao: https://console.firebase.google.com
2. "Add Project" → Name: "ghoomakad" → Continue
3. Google Analytics: OFF karo → Create Project

## Step 2: Phone Auth Enable Karo
1. Left menu → "Authentication" → "Get Started"
2. "Sign-in method" tab → "Phone" → Enable → Save

## Step 3: Web App Add Karo
1. Project Overview → Web icon (</>)
2. App nickname: "ghoomakad-web" → Register App
3. Firebase config COPY karo — kuch aisa dikhega:
   ```
   apiKey: "AIzaSy..."
   authDomain: "ghoomakad.firebaseapp.com"
   projectId: "ghoomakad-..."
   ...
   appId: "1:123:web:abc"
   ```

## Step 4: Authorized Domains
1. Authentication → Settings → Authorized Domains
2. "localhost" already hoga ✓
3. Apna domain add karo agar deploy karo baad mein

## Step 5: Config Paste Karo
login.html mein yahan paste karo apni config:
```javascript
const firebaseConfig = {
  apiKey: "APNI_KEY_YAHAN",
  authDomain: "APNA_PROJECT.firebaseapp.com",
  projectId: "APNA_PROJECT_ID",
  appId: "APNA_APP_ID"
};
```

## Testing (Local File se)
- Local file:// se phone auth nahi chalega
- Solution: VS Code → Live Server extension install karo
- Ya: Python: `python -m http.server 8080` → http://localhost:8080

## Free Limits
- 10,000 SMS OTP / month — FREE!
- Uske baad: $0.01/SMS
