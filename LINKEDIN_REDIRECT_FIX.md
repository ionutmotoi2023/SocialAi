# 🔧 LinkedIn Redirect URI Fix - Error 404

## ❌ **Problema Identificată:**

URL-ul generat este **GREȘIT:**

```
https://socialai.mindloop.ro/login/api/integrations/linkedin/callback
                               ^^^^^^
                               Extra "/login/" aici!
```

**Ar trebui să fie:**

```
https://socialai.mindloop.ro/api/integrations/linkedin/callback
```

---

## 🎯 **Cauza:**

### **NEXTAUTH_URL este setat GREȘIT în Railway!**

Probabil ai:
```bash
❌ GREȘIT:
NEXTAUTH_URL=https://socialai.mindloop.ro/login

❌ SAU:
NEXTAUTH_URL=https://socialai.mindloop.ro/login/
```

**Ar trebui:**
```bash
✅ CORECT:
NEXTAUTH_URL=https://socialai.mindloop.ro
```

---

## 🔧 **Soluția - 3 Pași:**

### **Pasul 1: Corectează NEXTAUTH_URL în Railway**

1. Mergi pe Railway Dashboard
2. Click pe serviciul **webapp**
3. Tab **Variables**
4. Găsește `NEXTAUTH_URL`
5. Modifică-l la:
   ```bash
   NEXTAUTH_URL=https://socialai.mindloop.ro
   ```
   ⚠️ **FĂRĂ `/login` la final!**
   ⚠️ **FĂRĂ `/` la final!**

6. Click **Save**

---

### **Pasul 2: Actualizează LinkedIn Developer App**

1. Mergi pe: https://www.linkedin.com/developers/apps
2. Selectează aplicația ta
3. Tab **Auth**
4. La **Redirect URLs**, verifică că ai:
   ```
   https://socialai.mindloop.ro/api/integrations/linkedin/callback
   ```
   
   ⚠️ **NU:**
   ```
   https://socialai.mindloop.ro/login/api/integrations/linkedin/callback
   ```

5. Dacă e greșit, șterge-l și adaugă corect
6. Click **Update**

---

### **Pasul 3: Așteaptă Redeploy**

Railway va face **auto-redeploy** după ce modifici `NEXTAUTH_URL` (2-3 minute)

---

## ✅ **Checklist:**

- [ ] NEXTAUTH_URL în Railway = `https://socialai.mindloop.ro` (fără /login)
- [ ] Redirect URL în LinkedIn = `https://socialai.mindloop.ro/api/integrations/linkedin/callback`
- [ ] Railway redeploy finalizat (2-3 min)
- [ ] Test "Connect LinkedIn" funcționează

---

**Creat:** 2026-01-02
