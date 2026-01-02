# 🔗 LinkedIn Integration Fix - Quick Checklist

## 🚨 Problema Curentă

În screenshot-ul tău văd:
- ❌ Butonul rămâne pe "Connecting..."
- ❌ Eroare 404 în console
- ❌ "not available" error

## ✅ Soluția: Verifică și Configurează NEXTAUTH_URL

### Pasul 1: Verifică NEXTAUTH_URL în Railway

**CRITICAL:** `NEXTAUTH_URL` trebuie să fie domeniul tău actual!

1. Mergi pe Railway Dashboard
2. Click pe serviciul **webapp**
3. Tab **Variables**
4. Verifică dacă există `NEXTAUTH_URL`

**Ar trebui să fie:**
```bash
NEXTAUTH_URL=https://socialai.mindloop.ro
```

**NU:**
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://socialai-production-da70.up.railway.app
```

⚠️ **Dacă lipsește sau este greșit, adaugă/modifică-l!**

---

### Pasul 2: Configurează LinkedIn Developer App

1. Mergi pe: **https://www.linkedin.com/developers/apps**
2. Click pe aplicația ta
3. Tab **Auth**
4. La **Redirect URLs** adaugă:

```
https://socialai.mindloop.ro/api/integrations/linkedin/callback
```

⚠️ **IMPORTANT:** URL-ul trebuie să fie EXACT, cu HTTPS!

5. Click **Update**

---

### Pasul 3: Verifică Toate Variabilele LinkedIn în Railway

Asigură-te că ai toate cele 3 variabile setate:

```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=https://socialai.mindloop.ro
```

**Verifică:**
- ✅ Fără spații înainte/după valori
- ✅ Client ID și Secret sunt corecte (copiază din LinkedIn Developer)
- ✅ NEXTAUTH_URL este domeniul corect

---

### Pasul 4: Redeploy Railway

După ce ai actualizat variabilele:
1. Railway va face auto-redeploy (2-3 minute)
2. Sau forțează manual: click pe serviciu → **Deploy** → **Redeploy**

---

### Pasul 5: Testează Conexiunea

1. Mergi pe: **https://socialai.mindloop.ro/dashboard/settings/integrations**
2. Click pe **"Connect LinkedIn"**
3. Va deschide popup cu LinkedIn OAuth
4. Autentifică-te și acceptă permisiunile
5. Popup-ul se va închide automat
6. Ar trebui să vezi: **"LinkedIn Connected!"** ✅

---

## 🔍 Debugging: Cum să verifici ce este problema

### Verificare 1: Console Errors

Deschide Console (F12) și verifică:

**❌ Dacă vezi:**
```
Failed to load resource: 404
```

**Cauză:** NEXTAUTH_URL incorect sau lipsă

**✅ Fix:** Setează `NEXTAUTH_URL=https://socialai.mindloop.ro` în Railway

---

### Verificare 2: Network Tab

Deschide Console → Network → Click "Connect LinkedIn"

**Ar trebui să vezi:**
1. Request la `/api/integrations/linkedin/auth`
2. Redirect la `https://www.linkedin.com/oauth/v2/authorization?...`
3. După autentificare: redirect la `/api/integrations/linkedin/callback`

**❌ Dacă primești 404 la callback:**
- Verifică că redirect URI din LinkedIn Developer matches EXACT cu:
  `https://socialai.mindloop.ro/api/integrations/linkedin/callback`

---

### Verificare 3: Railway Logs

Pentru a vedea erori detaliate:

```bash
railway logs --service webapp
```

Sau în Railway Dashboard:
1. Click pe serviciul webapp
2. Tab **Logs**
3. Caută erori după timestamp când ai încercat să te conectezi

**Caută după:**
- "LinkedIn auth error"
- "LinkedIn callback error"
- "Token exchange failed"

---

## 🎯 Checklist Rapid

- [ ] **NEXTAUTH_URL** setat în Railway
  ```bash
  NEXTAUTH_URL=https://socialai.mindloop.ro
  ```

- [ ] **LINKEDIN_CLIENT_ID** setat în Railway
  ```bash
  LINKEDIN_CLIENT_ID=your_actual_client_id
  ```

- [ ] **LINKEDIN_CLIENT_SECRET** setat în Railway
  ```bash
  LINKEDIN_CLIENT_SECRET=your_actual_client_secret
  ```

- [ ] **LinkedIn Developer App** - Redirect URL configurat:
  ```
  https://socialai.mindloop.ro/api/integrations/linkedin/callback
  ```

- [ ] **Redeploy** finalizat (așteaptă 2-3 minute)

- [ ] **Test conexiune** - butonul funcționează și se conectează

---

## 🛠️ Probleme Comune și Soluții

### Problema: "Redirect URI mismatch"

**Cauză:** URL-ul din LinkedIn Developer nu matches cu cel din cod

**Fix:**
1. Verifică în LinkedIn Developer ce URL ai
2. Compară cu `${NEXTAUTH_URL}/api/integrations/linkedin/callback`
3. Trebuie să fie EXACT același

---

### Problema: "Invalid client credentials"

**Cauză:** LINKEDIN_CLIENT_ID sau LINKEDIN_CLIENT_SECRET greșite

**Fix:**
1. Mergi pe LinkedIn Developer
2. Tab **Auth**
3. Copiază din nou Client ID și Client Secret
4. Actualizează în Railway Variables
5. Redeploy

---

### Problema: Popup se închide imediat

**Cauză:** NEXTAUTH_URL incorect sau authentication failed

**Fix:**
1. Deschide Console înainte să dai click pe "Connect"
2. Verifică erorile în Console
3. Verifică Network tab pentru request-uri failed

---

### Problema: "Session not found"

**Cauză:** Nu ești autentificat în aplicație

**Fix:**
1. Logout din aplicație
2. Login din nou
3. Încearcă să conectezi LinkedIn

---

## 📊 Flow Complet (pentru debugging)

```
User: Click "Connect LinkedIn"
    ↓
Frontend: window.open('/api/integrations/linkedin/auth')
    ↓
Backend: GET /api/integrations/linkedin/auth
    - Verifică session
    - Construiește LinkedIn OAuth URL cu:
      - client_id: LINKEDIN_CLIENT_ID
      - redirect_uri: ${NEXTAUTH_URL}/api/integrations/linkedin/callback
      - scope: r_liteprofile r_emailaddress w_member_social
    ↓
LinkedIn: Afișează pagina de autorizare
    - User acceptă permisiunile
    ↓
LinkedIn: Redirect la callback URL cu code
    ↓
Backend: GET /api/integrations/linkedin/callback?code=xxx
    - Exchange code pentru access_token
    - Fetch LinkedIn profile
    - Salvează în database (LinkedInIntegration table)
    - Returnează HTML success page
    ↓
Frontend: Detectează popup closed
    - Refresh integration status
    - Afișează "Connected" ✅
```

---

## 🔐 Verifică Scope-urile LinkedIn

Aplicația cere următoarele permisiuni:
- `r_liteprofile` - Citește profil
- `r_emailaddress` - Citește email
- `w_member_social` - Postează pe LinkedIn

⚠️ **IMPORTANT:** Unele scope-uri necesită review de la LinkedIn pentru aplicații în producție!

**Pentru testare (Development):**
- Poți folosi orice cont LinkedIn
- Nu este nevoie de review

**Pentru producție:**
- Trebuie să trimiți aplicația la review LinkedIn
- Explici de ce ai nevoie de fiecare scope
- Aștepți aprobare (câteva zile)

---

## 📝 Script de Test

Pentru a testa rapid configurația, rulează în Console (F12):

```javascript
// Test 1: Verifică NEXTAUTH_URL
console.log('Current URL:', window.location.origin)
console.log('Should match NEXTAUTH_URL in Railway')

// Test 2: Verifică endpoint auth
fetch('/api/integrations/linkedin/auth', { 
  redirect: 'manual' 
}).then(r => {
  console.log('Auth endpoint status:', r.status)
  console.log('Should redirect (302/307)')
})

// Test 3: Verifică dacă ai integrare salvată
fetch('/api/integrations/linkedin')
  .then(r => r.json())
  .then(data => {
    console.log('Integration status:', data)
    if (data.integration) {
      console.log('✅ LinkedIn already connected!')
    } else {
      console.log('❌ Not connected yet')
    }
  })
```

---

## 🎉 După ce funcționează

După ce vezi "LinkedIn Connected!" ✅:

1. **Testează conexiunea:**
   - Click pe "Test Connection"
   - Ar trebui să vezi: "Connected as [Your Name]"

2. **Creează o postare test:**
   - Mergi la Create Post
   - Generează conținut
   - Click "Schedule Post" și selectează LinkedIn
   - Verifică că apare pe LinkedIn!

3. **Verifică expiration:**
   - Token-ul LinkedIn expiră după 60 zile
   - Aplicația va afișa data de expirare
   - Reconectează înainte să expire

---

## 📚 Resurse Utile

- **LinkedIn OAuth Docs:** https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **LinkedIn API Docs:** https://docs.microsoft.com/en-us/linkedin/marketing/getting-started
- **NextAuth Docs:** https://next-auth.js.org/

---

**Creat:** 2026-01-02  
**Status:** Active troubleshooting pentru LinkedIn integration
