# 🔑 Unde Găsești CLOUDINARY_CLOUD_NAME

## 📍 **Locație: Dashboard Cloudinary**

### **Pasul 1: Login pe Cloudinary**

Mergi pe: **https://console.cloudinary.com/**

---

### **Pasul 2: Găsește Credentialele pe Dashboard**

După ce te loghezi, vei vedea **prima pagină** (Dashboard) cu un panel mare care arată:

```
┌─────────────────────────────────────────────┐
│  Account Details                            │
├─────────────────────────────────────────────┤
│                                             │
│  Cloud name:    dxxxxxxxxxxxxx  [Copy]      │
│                                             │
│  API Key:       123456789012345  [Copy]     │
│                                             │
│  API Secret:    ************************     │
│                 [Reveal] [Copy]             │
│                                             │
└─────────────────────────────────────────────┘
```

---

### **Ce Este Fiecare:**

#### **1. CLOUDINARY_CLOUD_NAME** (Cloud name)
```
Exemplu: dab12cd34
```
- ✅ Este un **identifier unic** pentru contul tău
- ✅ Începe de obicei cu 'd' urmat de litere/cifre
- ✅ Poți să-l **copiezi** direct cu butonul [Copy]
- ✅ Este **PUBLIC** (apare în URL-uri, nu este secret)

#### **2. CLOUDINARY_API_KEY** (API Key)
```
Exemplu: 123456789012345
```
- ✅ Este un **număr lung** (15 cifre)
- ✅ Poți să-l copiezi cu butonul [Copy]
- ⚠️ Este **semi-confidențial** (nu-l pune în frontend)

#### **3. CLOUDINARY_API_SECRET** (API Secret)
```
Exemplu: abcdefghijklmnopqrstuvwxyz123456
```
- ✅ Este un **string lung** cu litere și cifre
- ✅ Este **ascuns** cu *** by default
- ✅ Click pe [Reveal] pentru a-l vedea
- ✅ Click pe [Copy] pentru a-l copia
- 🔒 Este **SECRET** (nu-l pune niciodată în frontend sau Git!)

---

## 📸 **Screenshot-uri (ce să cauți):**

### **Poziția pe Dashboard:**

Imediat după ce te loghezi:
1. Partea de sus, sub meniu
2. Un panel mare cu titlul **"Account Details"** sau **"Product Environment Credentials"**
3. Cele 3 câmpuri sunt unul sub altul

---

## 🎯 **Pași Rapizi:**

### **1. Găsește Cloud Name:**
- Dashboard → **"Cloud name:"** → Click [Copy]
- Va arăta ceva de genul: `dab12cd34`

### **2. Găsește API Key:**
- Dashboard → **"API Key:"** → Click [Copy]
- Va arăta ceva de genul: `123456789012345`

### **3. Găsește API Secret:**
- Dashboard → **"API Secret:"** → Click [Reveal] (dacă e ascuns)
- Click [Copy]
- Va arăta ceva de genul: `abcdefGHIjklMNOpqrSTUvwxYZ123456`

---

## ⚠️ **Dacă NU Vezi Account Details:**

### **Opțiune A: Schimbă Environment**

În colțul dreapta sus ai un dropdown:
```
┌─────────────────┐
│ Production ▼    │
└─────────────────┘
```

Click și selectează **"Production"** (sau "Development")

### **Opțiune B: Mergi la Settings**

1. Click pe **Settings** (⚙️ icon în sidebar sau sus-dreapta)
2. Tab **"Account"**
3. Secțiunea **"Product Environment Credentials"**
4. Vei vedea Cloud Name, API Key, API Secret

---

## 🔍 **Verificare: URL-urile Tale vor Arăta Așa:**

După ce setezi credentialele, URL-urile generate vor avea formatul:

```
https://res.cloudinary.com/[CLOUD_NAME]/image/upload/v123456/social-ai/imagine.jpg
                          ^^^^^^^^^^^^
                          Acesta este Cloud Name-ul tău!
```

**Exemplu complet:**
```
https://res.cloudinary.com/dab12cd34/image/upload/v1704123456/social-ai/photo.jpg
```

---

## ✅ **Toate 3 Credentialele pentru Railway:**

După ce le-ai copiat din Cloudinary Dashboard:

### **Railway Variables:**

```bash
CLOUDINARY_CLOUD_NAME=dab12cd34
CLOUDINARY_API_KEY=123456789012345  
CLOUDINARY_API_SECRET=abcdefGHIjklMNOpqrSTUvwxYZ123456
```

⚠️ **IMPORTANT:**
- **NU** pune ghilimele în jurul valorilor
- **NU** pune spații înainte sau după
- Copiază **exact** așa cum apar în Cloudinary

---

## 🎯 **Quick Checklist:**

- [ ] Logged in la https://console.cloudinary.com/
- [ ] Văd "Account Details" panel pe prima pagină
- [ ] Am copiat **Cloud name** (ex: dab12cd34)
- [ ] Am copiat **API Key** (ex: 123456789012345)
- [ ] Am copiat **API Secret** (am dat Reveal apoi Copy)
- [ ] Le-am pus în Railway Variables (fără ghilimele, fără spații)
- [ ] Railway a făcut redeploy (2-3 minute)

---

## 🆘 **Troubleshooting:**

### **Problema: "Nu văd Account Details"**

**Soluție 1:** Refresh pagina (Ctrl+R sau F5)

**Soluție 2:** Mergi la:
```
Settings (⚙️) → Account → Product Environment Credentials
```

**Soluție 3:** Verifică că ai selectat corect "Production" environment (dropdown sus-dreapta)

---

### **Problema: "API Secret e ascuns cu ***"**

**Soluție:** Click pe butonul **[Reveal]** sau **[Show]** lângă câmp

Apoi click pe **[Copy]** pentru a-l copia

---

### **Problema: "Am mai multe Cloud Names"**

**Soluție:** 
- Cloudinary Free tier = **un singur Cloud Name**
- Dacă ai mai multe, folosește cel **Production**
- Sau creează un nou "Product Environment" specific pentru aplicația ta

---

## 📝 **Exemplu Complet Real:**

```
Dashboard Cloudinary afișează:

Cloud name:    dxyz123abc
API Key:       987654321098765
API Secret:    AbCdEf123456GhIjKl789012MnOpQr

În Railway Variables pui:

CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=987654321098765
CLOUDINARY_API_SECRET=AbCdEf123456GhIjKl789012MnOpQr
```

---

## 🎉 **După Setup:**

Testează upload-ul:
1. Mergi pe: https://socialai.mindloop.ro/dashboard/posts/create
2. Upload o imagine
3. Verifică în Console (F12) că URL-ul începe cu:
   ```
   https://res.cloudinary.com/[TAU_CLOUD_NAME]/...
   ```

Dacă vezi URL-ul complet Cloudinary → **SUCCESS!** ✅

---

**Creat:** 2026-01-02  
**Ultima actualizare:** 2026-01-02
