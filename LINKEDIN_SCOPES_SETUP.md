# 🔧 LinkedIn Developer App - Organization Scopes Setup

## 📋 Problema Actuală
LinkedIn OAuth nu returnează organizațiile (company pages) pentru că aplicația nu are scope-urile necesare configurate.

## ✅ Soluția: Configurare LinkedIn Developer Portal

### **Pasul 1: Accesează LinkedIn Developer Portal**
1. Du-te la: https://www.linkedin.com/developers/apps
2. Selectează aplicația ta (Social AI / Mindloop)
3. Click pe **"Products"** tab

---

### **Pasul 2: Verifică Produsele Active**

**Produsele NECESARE:**
- ✅ **Sign In with LinkedIn using OpenID Connect** (pentru `openid` și `profile`)
- ✅ **Share on LinkedIn** (pentru `w_member_social`)
- ✅ **Marketing Developer Platform** (pentru `r_organization_admin` și `w_organization_social`)

**SAU**

- ✅ **Community Management API** (alternativă pentru company pages)

---

### **Pasul 3: Activează Produsele Lipsă**

#### **Dacă nu ai "Marketing Developer Platform":**

1. **Click pe "Products" tab**
2. **Găsește "Marketing Developer Platform"**
3. **Click "Request access"** sau **"Add product"**
4. **Completează formularul:**
   - **Product Use Case**: "Social media management tool for posting content to personal profiles and company pages"
   - **Describe your integration**: "Our application helps users schedule and publish social media posts to their LinkedIn personal profiles and managed company pages"
   - **Company/Organization**: Mindloop SRL
   - **Expected monthly API calls**: ~1000-5000

5. **Trimite cererea**
6. **Așteaptă aprobare** (de obicei 24-48 ore)

---

### **Pasul 4: Verifică Scope-urile în "Auth" Tab**

După ce produsele sunt active:

1. Click pe **"Auth"** tab
2. Secțiunea **"OAuth 2.0 scopes"** ar trebui să arate:

```
✅ openid
✅ profile  
✅ w_member_social
✅ r_organization_admin
✅ w_organization_social
```

---

### **Pasul 5: Verifică Redirect URLs**

În **"Auth"** tab → **"OAuth 2.0 settings"**:

**Redirect URLs** trebuie să includă:
```
https://socialai.mindloop.ro/api/integrations/linkedin/callback
```

**IMPORTANT**: URL-ul trebuie să fie **exact** - fără trailing slash!

---

## 🧪 Testare După Configurare

### **Pasul 1: Disconnect Toate Conexiunile LinkedIn**
1. Du-te la: https://socialai.mindloop.ro/dashboard/settings/integrations
2. Disconnect toate conexiunile LinkedIn

### **Pasul 2: Reconectează LinkedIn**
1. Click **"Connect LinkedIn"**
2. **IMPORTANT**: LinkedIn ar trebui să ceară **permisiuni noi**:
   ```
   Social AI would like to:
   ✅ Verify your identity
   ✅ Access your profile information
   ✅ Post content on your behalf
   ✅ Manage your organization's content ← NOU!
   ```

3. **Selectează o pagină de companie** (dacă apare dropdown)
4. Click **"Allow"**

### **Pasul 3: Verifică Console-ul**
Deschide **Console-ul browser** (F12):

**Ar trebui să vezi:**
```javascript
🔍 LinkedIn Callback - Organizations found: {
  count: 3,
  orgs: [
    { id: '12345', name: 'SiteQ' },
    { id: '67890', name: 'MINDLOOP' },
    { id: '11111', name: 'VALETINO.RO' }
  ]
}
```

### **Pasul 4: Verifică Settings**
Du-te la Settings → Integrations:

**Ar trebui să vezi 4 conexiuni:**
- ✅ IONUT DOREL MOTOI (Personal)
- ✅ SiteQ (Company)
- ✅ MINDLOOP (Company)
- ✅ VALETINO.RO (Company)

---

## 🚨 Troubleshooting

### ❌ **"Organizations count: 0" în logs**

**Cauze posibile:**

1. **Marketing Developer Platform nu e activ**
   - Soluție: Activează produsul în LinkedIn Developer Portal

2. **Scope-urile nu sunt aprobate**
   - Soluție: Așteaptă aprobarea cererii de acces

3. **Utilizatorul nu are rol de admin pe nicio pagină**
   - Soluție: Verifică în LinkedIn → Company Pages → Settings → Admin Access

4. **Token-ul vechi fără scope-uri noi**
   - Soluție: Disconnect → Reconnect LinkedIn

---

### ❌ **"Insufficient permissions" error la POST**

**Cauze:**

1. **`w_organization_social` scope lipsește**
   - Verifică că ai activat produsul corect

2. **Utilizatorul nu are rol "ADMIN" pe pagină**
   - LinkedIn cere `ADMIN` role, nu doar `MEMBER`
   - Verifică în: LinkedIn Company Page → Settings → Admin Access

---

## 📝 Endpoint-uri LinkedIn Folosite

```javascript
// 1. Organizations API (needs r_organization_admin)
GET https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee
Headers: {
  Authorization: Bearer <token>,
  LinkedIn-Version: 202401
}

// 2. User Profile (needs openid + profile)
GET https://api.linkedin.com/v2/userinfo

// 3. Post to Personal Profile (needs w_member_social)
POST https://api.linkedin.com/v2/ugcPosts
Body: { author: "urn:li:person:abc123", ... }

// 4. Post to Company Page (needs w_organization_social)
POST https://api.linkedin.com/v2/ugcPosts
Body: { author: "urn:li:organization:67890", ... }
```

---

## ✅ Checklist Final

- [ ] LinkedIn Developer App are "Marketing Developer Platform" activ
- [ ] Scope-urile `r_organization_admin` și `w_organization_social` sunt vizibile în "Auth" tab
- [ ] Redirect URL este configurat corect
- [ ] Disconnect + Reconnect LinkedIn în aplicație
- [ ] LinkedIn cere permisiuni noi la reconectare
- [ ] Console-ul arată "Organizations count: 3"
- [ ] Settings arată 4 conexiuni (1 Personal + 3 Company)
- [ ] Dropdown-ul din Post Edit arată toate paginile

---

## 📞 Contact LinkedIn Support

Dacă nu primești acces la **Marketing Developer Platform**:

1. Du-te la: https://www.linkedin.com/help/linkedin/ask/ts-rdpia
2. **Subject**: "Request access to Marketing Developer Platform"
3. **Message**:
   ```
   Hello,
   
   I am developing a social media management tool (Social AI - Mindloop SRL) 
   that helps users schedule and publish content to their LinkedIn personal 
   profiles and managed company pages.
   
   I need access to the Marketing Developer Platform to use the following scopes:
   - r_organization_admin (to read user's managed organizations)
   - w_organization_social (to post content on behalf of organizations)
   
   Application details:
   - App Name: Social AI
   - Client ID: [YOUR_CLIENT_ID]
   - Redirect URL: https://socialai.mindloop.ro/api/integrations/linkedin/callback
   
   Use case: Our users manage multiple company pages on LinkedIn and need to 
   select which page to post content to from within our application.
   
   Thank you!
   ```

---

## 🎯 Status Actual

✅ **Backend Code**: Ready (scope-uri adăugate în OAuth)
✅ **Database**: Ready (suportă multiple profiles)
✅ **UI**: Ready (dropdown pentru destinație)
⏳ **LinkedIn App**: Needs configuration (Marketing Developer Platform)

---

**Next Step**: Configurează LinkedIn Developer App și testează!
