'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, Database, Mail, Globe } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="mb-4">
            <Shield className="h-3 w-3 mr-1" />
            Privacy Policy
          </Badge>
          <h1 className="text-4xl font-bold">Politica de Confidențialitate</h1>
          <h2 className="text-3xl font-semibold text-muted-foreground">Privacy Policy</h2>
          <p className="text-muted-foreground">
            Ultima actualizare / Last updated: <strong>01 Ianuarie 2026 / January 1st, 2026</strong>
          </p>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Informații Companie / Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Denumire:</strong> AI MINDLOOP SRL</p>
            <p><strong>CUI:</strong> 41458014</p>
            <p><strong>Nr. Înregistrare:</strong> J20/1900/27791/2019</p>
            <p><strong>Adresă:</strong> Str. Tudor Vladimirescu, Nr. 28A, Constanța, România</p>
            <p><strong>Email:</strong> <a href="mailto:office@mindloop.ro" className="text-primary hover:underline">office@mindloop.ro</a></p>
            <p><strong>Website:</strong> <a href="https://mindloop.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mindloop.ro</a></p>
          </CardContent>
        </Card>

        {/* Romanian Version */}
        <div className="space-y-6">
          <div className="border-l-4 border-primary pl-4">
            <h2 className="text-2xl font-bold mb-4">🇷🇴 VERSIUNEA ROMÂNĂ</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Introducere</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Bine ați venit la platforma noastră SaaS pentru automatizarea conținutului pe social media prin inteligență artificială. 
                Respectăm confidențialitatea datelor dumneavoastră și ne angajăm să le protejăm conform Regulamentului General privind 
                Protecția Datelor (GDPR - Regulamentul UE 2016/679) și legislației românești aplicabile.
              </p>
              <p>
                Această politică de confidențialitate explică ce date colectăm, cum le folosim, cum le protejăm și care sunt drepturile dumneavoastră.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                2. Date Personale Colectate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">2.1. Date de Înregistrare</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nume complet</li>
                  <li>Adresă de email</li>
                  <li>Parolă (stocată criptată)</li>
                  <li>Denumirea companiei (tenant)</li>
                  <li>Rolul în organizație</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.2. Date de Integrare LinkedIn</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>LinkedIn Access Token (pentru publicare automată)</li>
                  <li>LinkedIn User ID</li>
                  <li>Nume profil LinkedIn</li>
                  <li>Poză profil LinkedIn</li>
                  <li><strong>NU stocăm:</strong> Parola LinkedIn, conexiunile, mesajele private</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.3. Conținut Generat și Posts</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Conținutul posts-urilor create</li>
                  <li>Imaginile și media încărcate</li>
                  <li>Prompt-urile trimise către AI</li>
                  <li>Metadata (dată/oră, status, confidence score)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.4. Date de Utilizare</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Adresă IP</li>
                  <li>Browser și sistem de operare</li>
                  <li>Activitate în platformă (logs)</li>
                  <li>Statistici de utilizare</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Scopul Prelucrării Datelor</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✅ <strong>Furnizarea serviciilor:</strong> Crearea contului, autentificare, generare conținut AI</li>
                <li>✅ <strong>Integrare LinkedIn:</strong> Publicarea automată de posts pe contul dumneavoastră</li>
                <li>✅ <strong>Îmbunătățire AI:</strong> Antrenarea modelelor pentru conținut mai relevant</li>
                <li>✅ <strong>Suport clienți:</strong> Răspunsuri la întrebări și rezolvare probleme</li>
                <li>✅ <strong>Securitate:</strong> Prevenirea fraudelor și accesului neautorizat</li>
                <li>✅ <strong>Analytics:</strong> Statistici aggregate pentru îmbunătățirea platformei</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                4. Cum Protejăm Datele
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>🔒 <strong>Criptare:</strong> Toate datele sunt criptate în tranzit (HTTPS/TLS) și în repaus</li>
                <li>🔒 <strong>Autentificare:</strong> Parole hash-uite cu bcrypt, sesiuni JWT securizate</li>
                <li>🔒 <strong>Izolare multi-tenant:</strong> Datele fiecărei companii sunt complet izolate</li>
                <li>🔒 <strong>Acces restricționat:</strong> Doar angajații autorizați au acces la date</li>
                <li>🔒 <strong>Backup-uri:</strong> Backup-uri regulate și securizate</li>
                <li>🔒 <strong>Monitorizare:</strong> Detectare automată a activităților suspecte</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Partajarea Datelor cu Terți</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Partajăm date DOAR cu:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>OpenAI:</strong> Pentru generarea de conținut AI (prompt-uri text, NU date personale)</li>
                  <li><strong>LinkedIn:</strong> Pentru publicarea posts-urilor (folosind token-ul DUMNEAVOASTRĂ)</li>
                  <li><strong>Railway/Hosting:</strong> Pentru infrastructura platformei (datele sunt criptate)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-red-600">NU partajăm:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>❌ Date personale cu terți pentru marketing</li>
                  <li>❌ Liste de email-uri</li>
                  <li>❌ Informații despre compania dumneavoastră</li>
                  <li>❌ Conținutul posts-urilor cu alte companii</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                6. Drepturile Dumneavoastră (GDPR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>👁️ <strong>Dreptul de acces:</strong> Puteți solicita o copie a tuturor datelor personale</li>
                <li>✏️ <strong>Dreptul de rectificare:</strong> Puteți corecta datele incorecte</li>
                <li>🗑️ <strong>Dreptul la ștergere:</strong> Puteți solicita ștergerea contului și datelor</li>
                <li>📦 <strong>Dreptul la portabilitate:</strong> Puteți exporta datele în format JSON</li>
                <li>⛔ <strong>Dreptul de opoziție:</strong> Puteți refuza prelucrarea pentru marketing</li>
                <li>🚫 <strong>Dreptul la restricționare:</strong> Puteți limita prelucrarea datelor</li>
              </ul>

              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="font-semibold">Pentru exercitarea drepturilor:</p>
                <p className="text-sm mt-2">
                  Trimiteți un email la: <a href="mailto:office@mindloop.ro" className="text-primary hover:underline">office@mindloop.ro</a>
                </p>
                <p className="text-sm">Răspundem în maxim <strong>30 de zile</strong>.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies și Tehnologii Similare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Folosim cookies pentru:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>🍪 <strong>Esențiale:</strong> Autentificare, sesiuni (necesare pentru funcționare)</li>
                  <li>📊 <strong>Analytics:</strong> Statistici de utilizare (anonimizate)</li>
                  <li>⚙️ <strong>Preferințe:</strong> Setări utilizator (limbă, tema)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  NU folosim cookies pentru tracking sau publicitate terță parte.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Retenția Datelor</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>📅 <strong>Cont activ:</strong> Păstrăm datele cât timp contul este activ</li>
                <li>📅 <strong>După ștergere:</strong> Datele sunt șterse complet în 30 de zile</li>
                <li>📅 <strong>Backup-uri:</strong> Păstrate maxim 90 de zile</li>
                <li>📅 <strong>Logs securitate:</strong> Păstrate 12 luni pentru audit</li>
                <li>📅 <strong>Date fiscale:</strong> Păstrate conform legislației (5-7 ani)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Transferuri Internaționale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                Datele sunt stocate pe servere în <strong>Uniunea Europeană</strong> (Railway - regiunea europe-west4).
              </p>
              <p>
                Pentru servicii AI (OpenAI), datele pot fi transferate în <strong>SUA</strong>, unde OpenAI respectă 
                clauzele contractuale standard (SCC) și măsuri de protecție echivalente GDPR.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                10. Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Pentru întrebări despre confidențialitate:</strong></p>
              <p>📧 Email: <a href="mailto:office@mindloop.ro" className="text-primary hover:underline">office@mindloop.ro</a></p>
              <p>📍 Adresă: Str. Tudor Vladimirescu, Nr. 28A, Constanța, România</p>
              <p>🌐 Website: <a href="https://mindloop.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mindloop.ro</a></p>
            </CardContent>
          </Card>
        </div>

        {/* English Version */}
        <div className="space-y-6 pt-12 border-t-4">
          <div className="border-l-4 border-primary pl-4">
            <h2 className="text-2xl font-bold mb-4">🇬🇧 ENGLISH VERSION</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Welcome to our SaaS platform for AI-powered social media content automation. We respect your data privacy 
                and are committed to protecting it in accordance with the General Data Protection Regulation (GDPR - EU 
                Regulation 2016/679) and applicable Romanian legislation.
              </p>
              <p>
                This privacy policy explains what data we collect, how we use it, how we protect it, and what your rights are.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                2. Personal Data Collected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">2.1. Registration Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Password (stored encrypted)</li>
                  <li>Company name (tenant)</li>
                  <li>Role in organization</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.2. LinkedIn Integration Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>LinkedIn Access Token (for automatic publishing)</li>
                  <li>LinkedIn User ID</li>
                  <li>LinkedIn profile name</li>
                  <li>LinkedIn profile picture</li>
                  <li><strong>We DO NOT store:</strong> LinkedIn password, connections, private messages</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.3. Generated Content and Posts</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Content of created posts</li>
                  <li>Uploaded images and media</li>
                  <li>Prompts sent to AI</li>
                  <li>Metadata (date/time, status, confidence score)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.4. Usage Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>IP address</li>
                  <li>Browser and operating system</li>
                  <li>Platform activity (logs)</li>
                  <li>Usage statistics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Purpose of Data Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✅ <strong>Service provision:</strong> Account creation, authentication, AI content generation</li>
                <li>✅ <strong>LinkedIn integration:</strong> Automatic publishing of posts to your account</li>
                <li>✅ <strong>AI improvement:</strong> Training models for more relevant content</li>
                <li>✅ <strong>Customer support:</strong> Answering questions and problem resolution</li>
                <li>✅ <strong>Security:</strong> Fraud prevention and unauthorized access</li>
                <li>✅ <strong>Analytics:</strong> Aggregate statistics for platform improvement</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                4. How We Protect Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>🔒 <strong>Encryption:</strong> All data encrypted in transit (HTTPS/TLS) and at rest</li>
                <li>🔒 <strong>Authentication:</strong> Bcrypt-hashed passwords, secure JWT sessions</li>
                <li>🔒 <strong>Multi-tenant isolation:</strong> Each company's data is completely isolated</li>
                <li>🔒 <strong>Restricted access:</strong> Only authorized employees have access to data</li>
                <li>🔒 <strong>Backups:</strong> Regular and secure backups</li>
                <li>🔒 <strong>Monitoring:</strong> Automatic detection of suspicious activities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Third-Party Data Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">We share data ONLY with:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>OpenAI:</strong> For AI content generation (text prompts, NO personal data)</li>
                  <li><strong>LinkedIn:</strong> For post publishing (using YOUR token)</li>
                  <li><strong>Railway/Hosting:</strong> For platform infrastructure (data is encrypted)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-red-600">We DO NOT share:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>❌ Personal data with third parties for marketing</li>
                  <li>❌ Email lists</li>
                  <li>❌ Information about your company</li>
                  <li>❌ Post content with other companies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                6. Your Rights (GDPR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>👁️ <strong>Right to access:</strong> You can request a copy of all personal data</li>
                <li>✏️ <strong>Right to rectification:</strong> You can correct inaccurate data</li>
                <li>🗑️ <strong>Right to erasure:</strong> You can request account and data deletion</li>
                <li>📦 <strong>Right to portability:</strong> You can export data in JSON format</li>
                <li>⛔ <strong>Right to object:</strong> You can refuse processing for marketing</li>
                <li>🚫 <strong>Right to restriction:</strong> You can limit data processing</li>
              </ul>

              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="font-semibold">To exercise your rights:</p>
                <p className="text-sm mt-2">
                  Send an email to: <a href="mailto:office@mindloop.ro" className="text-primary hover:underline">office@mindloop.ro</a>
                </p>
                <p className="text-sm">We respond within <strong>30 days</strong>.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies and Similar Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>We use cookies for:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>🍪 <strong>Essential:</strong> Authentication, sessions (required for functionality)</li>
                  <li>📊 <strong>Analytics:</strong> Usage statistics (anonymized)</li>
                  <li>⚙️ <strong>Preferences:</strong> User settings (language, theme)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  We DO NOT use cookies for tracking or third-party advertising.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>📅 <strong>Active account:</strong> We keep data as long as account is active</li>
                <li>📅 <strong>After deletion:</strong> Data is completely deleted within 30 days</li>
                <li>📅 <strong>Backups:</strong> Kept for maximum 90 days</li>
                <li>📅 <strong>Security logs:</strong> Kept 12 months for audit</li>
                <li>📅 <strong>Fiscal data:</strong> Kept according to legislation (5-7 years)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. International Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                Data is stored on servers in the <strong>European Union</strong> (Railway - europe-west4 region).
              </p>
              <p>
                For AI services (OpenAI), data may be transferred to the <strong>USA</strong>, where OpenAI complies with 
                Standard Contractual Clauses (SCC) and GDPR-equivalent protection measures.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                10. Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>For privacy questions:</strong></p>
              <p>📧 Email: <a href="mailto:office@mindloop.ro" className="text-primary hover:underline">office@mindloop.ro</a></p>
              <p>📍 Address: Str. Tudor Vladimirescu, Nr. 28A, Constanța, Romania</p>
              <p>🌐 Website: <a href="https://mindloop.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mindloop.ro</a></p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Card className="bg-primary/5">
          <CardContent className="pt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Această politică de confidențialitate poate fi actualizată. Veți fi notificat despre schimbări majore.
            </p>
            <p className="text-sm text-muted-foreground">
              This privacy policy may be updated. You will be notified of major changes.
            </p>
            <p className="font-semibold text-sm mt-4">
              © 2026 AI MINDLOOP SRL. Toate drepturile rezervate. / All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
