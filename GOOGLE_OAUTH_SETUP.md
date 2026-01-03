# 🔐 Google Drive OAuth Setup Guide

## Obiectiv
Configurarea OAuth 2.0 pentru Google Drive pentru a permite SocialAI să acceseze fișierele tale din Drive.

---

## Pași de Configurare

### ✅ **Step 1: Accesează Google Cloud Console**

1. Deschide: **https://console.cloud.google.com/**
2. Autentifică-te cu contul tău Google (același pe care îl vei folosi pentru Drive Sync)

---

### ✅ **Step 2: Creează sau Selectează un Proiect**

#### Opțiunea A: Creează Proiect Nou (Recomandat)
1. Click pe dropdown-ul de proiect (sus în header)
2. Click "**NEW PROJECT**"
3. **Project name:** `SocialAI Drive Sync`
4. **Organization:** Lasă necompletat (sau selectează dacă ai)
5. Click "**CREATE**"
6. Așteaptă 10-20 secunde pentru creare
7. Selectează proiectul nou din dropdown

#### Opțiunea B: Folosește Proiect Existent
1. Click pe dropdown-ul de proiect
2. Selectează proiectul dorit

---

### ✅ **Step 3: Activează Google Drive API**

1. În meniul lateral, mergi la: **APIs & Services** → **Library**
2. În search bar, caută: `Google Drive API`
3. Click pe **Google Drive API** din rezultate
4. Click pe butonul albastru **ENABLE**
5. Așteaptă 5-10 secunde pentru activare

✅ **Verificare:** Vei vedea "API enabled" și vei fi redirecționat la pagina API-ului

---

### ✅ **Step 4: Configurează OAuth Consent Screen**

⚠️ **IMPORTANT:** Acest pas trebuie făcut ÎNAINTE de a crea credentials!

1. În meniul lateral: **APIs & Services** → **OAuth consent screen**

2. **User Type:**
   - Selectează **External** (Pentru teste și producție)
   - Click **CREATE**

3. **App information:**
   ```
   App name: SocialAI
   User support email: [your-email@example.com]
   ```

4. **App logo:** (Opțional)
   - Skip pentru acum sau upload logo-ul tău

5. **App domain:** (Opțional pentru testing)
   - Application home page: https://socialai-production-da70.up.railway.app
   - Privacy policy: https://socialai-production-da70.up.railway.app/privacy (opțional)
   - Terms of service: https://socialai-production-da70.up.railway.app/terms (opțional)

6. **Developer contact information:**
   ```
   Email addresses: [your-email@example.com]
   ```

7. Click **SAVE AND CONTINUE**

8. **Scopes** (Permisiuni):
   - Click **ADD OR REMOVE SCOPES**
   - Caută și selectează următoarele scopes:
     - ✅ `../auth/drive.readonly` - View files in Google Drive
     - ✅ `../auth/drive.metadata.readonly` - View metadata for files in Google Drive
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**

9. **Test users** (Pentru testing în External mode):
   - Click **ADD USERS**
   - Adaugă email-ul tău: `your-email@example.com`
   - Click **ADD**
   - Click **SAVE AND CONTINUE**

10. **Summary:**
    - Verifică toate informațiile
    - Click **BACK TO DASHBOARD**

✅ **Verificare:** OAuth consent screen este configurat (status: Testing sau In production)

---

### ✅ **Step 5: Creează OAuth 2.0 Credentials**

1. În meniul lateral: **APIs & Services** → **Credentials**

2. Click butonul **CREATE CREDENTIALS** (sus)

3. Selectează **OAuth client ID**

4. **Application type:**
   - Selectează **Web application**

5. **Name:**
   ```
   SocialAI Drive Sync
   ```

6. **Authorized JavaScript origins:** (Opțional)
   ```
   https://socialai-production-da70.up.railway.app
   ```

7. **Authorized redirect URIs:** ⚠️ **FOARTE IMPORTANT!**
   
   Click **ADD URI** și adaugă AMBELE:
   
   **Production:**
   ```
   https://socialai-production-da70.up.railway.app/api/integrations/google-drive/callback
   ```
   
   **Local Testing (opțional):**
   ```
   http://localhost:3000/api/integrations/google-drive/callback
   ```

8. Click **CREATE**

9. **Salvează Credentials:**
   - O fereastră popup va apărea cu:
     - ✅ **Client ID** (ceva de genul: `123456789-abc...xyz.apps.googleusercontent.com`)
     - ✅ **Client Secret** (ceva de genul: `GOCSPX-abc...xyz`)
   
   **📋 COPIAZĂ ACESTE VALORI UNDEVA SIGUR!**
   
   - Click **DOWNLOAD JSON** (opțional, pentru backup)
   - Click **OK**

✅ **Verificare:** Vei vedea noul OAuth 2.0 Client în lista de credentials

---

### ✅ **Step 6: Adaugă Environment Variables în Railway**

Acum că ai Client ID și Client Secret, trebuie să le adaugi în Railway.

#### 6.1 Accesează Railway Dashboard
1. Deschide: **https://railway.app/**
2. Log in cu contul tău
3. Selectează proiectul: **SocialAI**
4. Click pe service-ul tău (probabil `webapp` sau `socialai-production`)

#### 6.2 Adaugă Variabilele
1. Click pe tab-ul **Variables**
2. Click **New Variable**

**Variabila 1:**
```
Variable name: GOOGLE_DRIVE_CLIENT_ID
Value: [paste Client ID from Google Cloud Console]
```

**Variabila 2:**
```
Variable name: GOOGLE_DRIVE_CLIENT_SECRET
Value: [paste Client Secret from Google Cloud Console]
```

3. Click **Add** pentru fiecare
4. **Railway va redeploy automat!**

✅ **Verificare:** Variabilele apar în listă cu valorile (parțial ascunse)

---

### ✅ **Step 7: Așteaptă Deployment**

1. În Railway, mergi la tab-ul **Deployments**
2. Vei vedea un nou deployment în curs (icon spinner)
3. Așteaptă 2-5 minute pentru finalizare
4. Status va deveni: ✅ **Success** (verde)

✅ **Verificare:** Deployment-ul este success fără erori

---

### ✅ **Step 8: Testează Conexiunea**

#### 8.1 Accesează App-ul
1. Deschide: **https://socialai-production-da70.up.railway.app**
2. Log in cu contul tău (admin@mindloop.ro / orice parolă)

#### 8.2 Mergi la Integrations
1. Click pe **Settings** în sidebar
2. Click pe **Integrations**
3. Scroll până vezi secțiunea **Google Drive**

#### 8.3 Conectează Drive
1. Click butonul verde **Connect Google Drive**
2. O fereastră popup OAuth va apărea
3. **Selectează contul Google** (același pe care l-ai folosit pentru setup)
4. Vei vedea ecranul de consimțământ:
   ```
   SocialAI wants to access your Google Drive
   
   Permissions:
   ✓ View files in your Google Drive
   ✓ View metadata for files in your Google Drive
   ```
5. Click **Continue** sau **Allow**
6. Popup-ul se va închide automat
7. Vei vedea în UI: ✅ **Connected** cu email-ul tău

✅ **Verificare:** Status arată "Connected" cu email, folder path, și 0 files synced

---

### ✅ **Step 9: Upload Test Files**

#### 9.1 Creează Folder în Drive
1. Deschide **Google Drive** (drive.google.com)
2. Click **New** → **Folder**
3. Nume: `SocialAI` (sau orice alt nume)
4. Click **Create**

#### 9.2 Upload Test Images
1. Deschide folderul `SocialAI`
2. Upload 2-3 imagini (JPG/PNG)
   - Poți folosi orice imagini: produse, echipă, evenimente
   - Pentru testare, orice funcționează

#### 9.3 Așteaptă Sync
- **CRON sync** rulează la fiecare **15 minute**
- Așteaptă maxim 15 minute după upload
- Check status în: `/dashboard/drive-media`

✅ **Verificare:** După 15 min, fișierele apar în Drive Media dashboard

---

### ✅ **Step 10: Verifică Fluxul Complet**

#### 10.1 Drive Media Dashboard
1. Mergi la: `/dashboard/drive-media`
2. Vei vedea fișierele cu status:
   - **PENDING** → (imediat după sync)
   - **ANALYZING** → (după 10 min)
   - **ANALYZED** → (după ce AI termină)

#### 10.2 Media Groups Dashboard
1. După ~30 min, mergi la: `/dashboard/media-groups`
2. Vei vedea grupurile create automat
3. Check grouping rule și confidence score

#### 10.3 Posts Dashboard
1. După ~40 min, mergi la: `/dashboard/posts`
2. Vei vedea postarea generată automat
3. Status poate fi:
   - **PENDING_APPROVAL** (dacă confidence < 80%)
   - **SCHEDULED** (dacă confidence ≥ 80%)

#### 10.4 Calendar
1. Mergi la: `/dashboard/calendar`
2. Vei vedea postarea programată în calendar
3. Click pe eveniment pentru detalii

✅ **Verificare End-to-End:** ✅ Sync → ✅ Analyze → ✅ Group → ✅ Generate → ✅ Schedule

---

## 🎯 **Troubleshooting**

### ❌ Problem: "OAuth Error: redirect_uri_mismatch"
**Cauză:** Redirect URI nu match-ează exact cu cel din Google Cloud Console

**Soluție:**
1. Mergi la Google Cloud Console → Credentials
2. Click pe OAuth client ID
3. Verifică **Authorized redirect URIs**
4. Trebuie să fie EXACT:
   ```
   https://socialai-production-da70.up.railway.app/api/integrations/google-drive/callback
   ```
5. Fără trailing slash, fără spații extra
6. Save și încearcă din nou

---

### ❌ Problem: "Files not syncing"
**Cauză:** Posibil CRON nu rulează sau refresh token invalid

**Soluție:**
1. Check Railway logs pentru erori CRON
2. Încearcă disconnect + reconnect Drive
3. Verifică că folderul Drive are permisiuni corecte
4. Așteaptă 15 minute complete pentru următorul CRON

---

### ❌ Problem: "AI Analysis failing"
**Cauză:** OPENAI_API_KEY invalid sau lipsă quota

**Soluție:**
1. Verifică în Railway Variables că OPENAI_API_KEY este setat
2. Check OpenAI dashboard pentru quota/usage
3. Review Railway logs pentru erori specifice

---

### ❌ Problem: "OAuth consent screen warning"
**Cauză:** App-ul este în "Testing" mode

**Soluție (pentru producție):**
1. Mergi la OAuth consent screen
2. Click **PUBLISH APP**
3. Submit pentru Google review (opțional)
4. Sau lasă în Testing și adaugă useri în "Test users"

---

## 📋 **Quick Checklist**

- [ ] ✅ Proiect Google Cloud creat
- [ ] ✅ Google Drive API activat
- [ ] ✅ OAuth consent screen configurat
- [ ] ✅ OAuth 2.0 Credentials creat
- [ ] ✅ Client ID și Client Secret salvate
- [ ] ✅ Redirect URI configurat corect
- [ ] ✅ Variables adăugate în Railway
- [ ] ✅ Railway deployment success
- [ ] ✅ Drive conectat în UI
- [ ] ✅ Test files uploaded în Drive
- [ ] ✅ Files apar în Drive Media dashboard
- [ ] ✅ AI analysis completă
- [ ] ✅ Media groups created
- [ ] ✅ Post generated automat

---

## 🎉 **Success Criteria**

Când totul funcționează corect, vei vedea:

1. ✅ Drive connection status: **Connected** ✅
2. ✅ Drive Media page: Fișiere cu status **ANALYZED** ✅
3. ✅ Media Groups page: Grupuri cu confidence ≥ 50% ✅
4. ✅ Posts page: Postări generate automat ✅
5. ✅ Calendar: Postări programate la ore optime ✅

---

## 📚 **Resurse Suplimentare**

- **Google Cloud Console:** https://console.cloud.google.com/
- **Google Drive API Docs:** https://developers.google.com/drive/api
- **OAuth 2.0 Guide:** https://developers.google.com/identity/protocols/oauth2
- **Railway Dashboard:** https://railway.app/
- **App Production:** https://socialai-production-da70.up.railway.app

---

**Timp estimat total:** 15-20 minute pentru setup complet
**Dificultate:** Mediu (urmează pașii cu atenție)

**Întrebări?** Verifică secțiunea Troubleshooting sau check Railway logs! 🚀
