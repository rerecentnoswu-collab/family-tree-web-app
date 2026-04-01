# 🚀 QUICK START: Secure Your Genealogy App in 1 Hour

This guide will help you fix the **3 CRITICAL security issues** in under 1 hour.

---

## ⏱️ Step 1: Remove Hardcoded API Keys (5 minutes)

### 1.1 Delete the insecure file
```bash
rm /tmp/sandbox/utils/supabase/info.tsx
```

### 1.2 Create .env.local
```bash
cat > /tmp/sandbox/.env.local << 'EOL'
VITE_SUPABASE_URL=https://mweatxonqtookmnluwnl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZWF0eG9ucXRvb2ttbmx1d25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTQ3NDUsImV4cCI6MjA5MDU3MDc0NX0.l7ZwuklPVDh1GT7BpQHHYNYcDvse_BUlDZzb8dVTwAs
EOL
```

### 1.3 Update .gitignore
```bash
cat >> /tmp/sandbox/.gitignore << 'EOL'

# Security: Never commit these files
.env
.env.local
.env.*.local
utils/supabase/info.tsx
EOL
```

### 1.4 Update client.ts to use environment variables
```typescript
// utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// ✅ Read from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## ⏱️ Step 2: Enable Proper RLS Policies (10 minutes)

### 2.1 Go to Supabase SQL Editor
1. Visit: https://supabase.com/dashboard/project/mweatxonqtookmnluwnl/sql
2. Click "New query"

### 2.2 Run This SQL (Copy & Paste)

```sql
-- Drop insecure policies
DROP POLICY IF EXISTS "Allow public read access" ON persons;
DROP POLICY IF EXISTS "Allow public insert access" ON persons;
DROP POLICY IF EXISTS "Allow public update access" ON persons;
DROP POLICY IF EXISTS "Allow public delete access" ON persons;

-- Add user_id column for ownership
ALTER TABLE persons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create secure policies (users can only see their own data)
CREATE POLICY "Users can read own data"
  ON persons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON persons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON persons FOR DELETE
  USING (auth.uid() = user_id);
```

### 2.3 Enable Auth in Supabase
1. Go to: https://supabase.com/dashboard/project/mweatxonqtookmnluwnl/auth/users
2. Under "Auth Providers" → Enable "Email" provider
3. Set "Site URL" to your app URL (or http://localhost:5173 for dev)

---

## ⏱️ Step 3: Add Authentication UI (45 minutes)

### 3.1 Install dependencies
```bash
cd /tmp/sandbox
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 3.2 Create AuthProvider component

Create: `/tmp/sandbox/src/app/components/AuthProvider.tsx`

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 3.3 Create Login component

Create: `/tmp/sandbox/src/app/components/Login.tsx`

```typescript
import { useState } from 'react';
import { supabase } from '/utils/supabase/client';
import { LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <LogIn className="w-12 h-12 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('error') || message.includes('Error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-blue-600 hover:underline w-full text-center"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
```

### 3.4 Update App.tsx to require auth

```typescript
// src/app/App.tsx - Add at the top
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Login } from './components/Login';

// Wrap your App component
function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Your existing App.tsx content goes here
  return (
    <div className="size-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Add Sign Out button in header */}
      <button onClick={signOut} className="...">
        Sign Out
      </button>
      {/* ... rest of your app */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

### 3.5 Update client.ts functions to include user_id

```typescript
// utils/supabase/client.ts

export async function addPerson(person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('persons')
    .insert([{
      ...person,
      user_id: user.id, // ✅ Add owner
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Similarly update getPersons, updatePerson, deletePerson...
```

---

## ✅ VERIFICATION (5 minutes)

### Test 1: Authentication Works
1. Restart dev server: `npm run dev`
2. Visit app → Should see login page
3. Sign up with your email
4. Check email for confirmation link
5. Sign in → Should see main app

### Test 2: Data Isolation
1. Create a person while signed in
2. Sign out
3. Try to access data → Should be blocked
4. Sign in with different account
5. Should NOT see the other user's data

### Test 3: API Protection
```bash
# Try to access data without auth
curl https://mweatxonqtookmnluwnl.supabase.co/rest/v1/persons \
  -H "apikey: YOUR_ANON_KEY"

# Should return: [] (empty) or error
```

---

## 🎉 DONE! You've Fixed the Critical Security Issues

### What You've Accomplished:
✅ Removed hardcoded credentials
✅ Added user authentication
✅ Applied Row Level Security (RLS)
✅ Each user can only see their own data

### Security Score: 25 → 75/100

---

## 📚 NEXT STEPS (Optional, but Recommended)

For even better security, continue with:

1. **Input Validation** (1 hour)
   - Install Zod: `npm install zod`
   - Add schema validation to forms

2. **Rate Limiting** (1 hour)
   - Implement rate limiting in client-secure.ts

3. **Audit Logging** (2 hours)
   - Run SECURITY-IMPROVEMENTS.sql
   - Enable audit triggers

4. **Backup Strategy** (30 mins)
   - Set up daily automated backups in Supabase

For complete implementation guide, see:
- `SECURITY-BEST-PRACTICES.md`
- `SECURITY-IMPROVEMENTS.sql`
- `SECURITY-AUDIT-REPORT.md`

---

## 🆘 TROUBLESHOOTING

### Issue: "Cannot find module 'supabase/info'"
**Fix**: Make sure you updated client.ts to use environment variables

### Issue: "User not authenticated" errors
**Fix**: Check that Supabase Auth is enabled in your dashboard

### Issue: RLS policies blocking everything
**Fix**: Make sure you added `user_id` column and it's being set on insert

### Issue: Can't sign up
**Fix**: Check Supabase Auth settings → Enable Email provider

---

**Questions?** Review the detailed guides or check Supabase documentation.

**Ready for production?** Complete the remaining items in SECURITY-BEST-PRACTICES.md
