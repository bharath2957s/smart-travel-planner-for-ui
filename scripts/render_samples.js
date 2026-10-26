import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const samplesDir = './public/samples';

const aadhaar_front_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="540" viewBox="0 0 850 540">
  <defs>
    <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9933"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient>
  </defs>

  <rect width="850" height="540" rx="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <rect x="0" y="0" width="850" height="14" fill="url(#flagGrad)"/>

  <text x="425" y="45" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#0F172A" text-anchor="middle">GOVERNMENT OF INDIA / BHARAT SARKAR</text>
  <text x="425" y="70" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="#DC2626" text-anchor="middle">UNIQUE IDENTIFICATION AUTHORITY OF INDIA</text>
  <line x1="40" y1="85" x2="810" y2="85" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Photo Box -->
  <rect x="50" y="110" width="160" height="200" rx="8" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2"/>
  <circle cx="130" cy="180" r="45" fill="#CBD5E1"/>
  <path d="M70,290 Q130,220 190,290 Z" fill="#94A3B8"/>
  <text x="130" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">GOVT PHOTO ID</text>

  <!-- Details -->
  <text x="240" y="135" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="#64748B">Name / Naam:</text>
  <text x="240" y="165" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="bold" fill="#0F172A">Aarav Sharma</text>

  <text x="240" y="210" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="#64748B">Date of Birth / DOB:</text>
  <text x="240" y="238" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" font-weight="bold" fill="#0F172A">14/08/1992</text>

  <text x="240" y="280" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="#64748B">Gender / Ling:</text>
  <text x="240" y="306" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" font-weight="bold" fill="#0F172A">Male / Purush</text>

  <!-- QR Code Mock -->
  <rect x="650" y="115" width="150" height="150" fill="#0F172A" rx="8"/>
  <rect x="665" y="130" width="40" height="40" fill="#FFFFFF"/>
  <rect x="675" y="140" width="20" height="20" fill="#0F172A"/>
  <rect x="745" y="130" width="40" height="40" fill="#FFFFFF"/>
  <rect x="755" y="140" width="20" height="20" fill="#0F172A"/>
  <rect x="665" y="210" width="40" height="40" fill="#FFFFFF"/>
  <rect x="675" y="220" width="20" height="20" fill="#0F172A"/>
  <text x="725" y="295" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Official QR Code</text>

  <!-- Aadhaar Number Footer -->
  <rect x="40" y="370" width="770" height="80" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1.5"/>
  <text x="425" y="422" font-family="Courier New, monospace" font-size="36" font-weight="bold" fill="#B91C1C" text-anchor="middle" letter-spacing="4">5482 9104 3829</text>

  <text x="425" y="480" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#DC2626" text-anchor="middle">Mera Aadhaar, Meri Pehchan (Unique Identification)</text>
  <text x="425" y="505" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">VID: 9182 7291 0482 7104 · Help line: 1947 · help@uidai.gov.in</text>
</svg>`;

const aadhaar_back_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="540" viewBox="0 0 850 540">
  <defs>
    <linearGradient id="flagGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9933"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient>
  </defs>

  <rect width="850" height="540" rx="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <rect x="0" y="0" width="850" height="14" fill="url(#flagGrad2)"/>

  <text x="425" y="45" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#0F172A" text-anchor="middle">UNIQUE IDENTIFICATION AUTHORITY OF INDIA / BHARAT SARKAR</text>
  <line x1="40" y1="65" x2="810" y2="65" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Address Box Left Column -->
  <text x="50" y="105" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#64748B">Address / Pata:</text>
  <text x="50" y="140" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#0F172A">C/O Ramesh Sharma</text>
  <text x="50" y="175" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" fill="#1E293B">#402 Palm Grove Apartments, Kuvempu Road,</text>
  <text x="50" y="205" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" fill="#1E293B">Near District Court Circle, Gandhi Nagar,</text>
  <text x="50" y="235" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E293B">Shivamogga, Karnataka - 577201</text>
  <text x="50" y="270" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="#64748B">Mobile Linked: 9876543210</text>

  <!-- Large QR Code on Right -->
  <rect x="580" y="90" width="220" height="220" fill="#0F172A" rx="10"/>
  <rect x="600" y="110" width="60" height="60" fill="#FFFFFF"/>
  <rect x="615" y="125" width="30" height="30" fill="#0F172A"/>
  <rect x="720" y="110" width="60" height="60" fill="#FFFFFF"/>
  <rect x="735" y="125" width="30" height="30" fill="#0F172A"/>
  <rect x="600" y="230" width="60" height="60" fill="#FFFFFF"/>
  <rect x="615" y="245" width="30" height="30" fill="#0F172A"/>
  <text x="690" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Official Signed QR Code</text>

  <!-- Aadhaar Number Footer -->
  <rect x="40" y="370" width="770" height="80" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1.5"/>
  <text x="425" y="422" font-family="Courier New, monospace" font-size="36" font-weight="bold" fill="#B91C1C" text-anchor="middle" letter-spacing="4">5482 9104 3829</text>

  <text x="425" y="480" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">1947 | help@uidai.gov.in | www.uidai.gov.in</text>
  <text x="425" y="505" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#94A3B8" text-anchor="middle">Aadhaar is proof of identity, not of citizenship. (Back Side)</text>
</svg>`;

const dl_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="540" viewBox="0 0 850 540">
  <rect width="850" height="540" rx="20" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>

  <!-- Top Blue Banner -->
  <rect x="0" y="0" width="850" height="75" rx="20" fill="#1E3A8A"/>
  <rect x="0" y="55" width="850" height="20" fill="#1E3A8A"/>
  <text x="425" y="32" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">UNION OF INDIA / TRANSPORT DEPARTMENT</text>
  <text x="425" y="58" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="#93C5FD" text-anchor="middle">KARNATAKA STATE · DRIVING LICENCE</text>

  <!-- Licence No Banner -->
  <rect x="40" y="90" width="770" height="42" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.5"/>
  <text x="60" y="117" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#1E40AF">DL NO: KA-14-2018-0049281</text>
  <text x="500" y="117" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857">STATUS: ACTIVE / VALID</text>

  <!-- Photo Box -->
  <rect x="40" y="150" width="150" height="190" rx="8" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
  <circle cx="115" cy="220" r="40" fill="#94A3B8"/>
  <path d="M60,320 Q115,260 170,320 Z" fill="#64748B"/>
  <text x="115" y="360" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Rohan V. Deshmukh</text>

  <!-- Central Field Grid -->
  <text x="210" y="170" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">NAME:</text>
  <text x="210" y="192" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#0F172A">Rohan Vikram Deshmukh</text>

  <text x="210" y="225" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">S/O (FATHER):</text>
  <text x="210" y="245" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">Vikram Deshmukh</text>

  <text x="210" y="280" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">DATE OF BIRTH:</text>
  <text x="210" y="300" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">22-05-1990</text>

  <text x="380" y="280" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">BLOOD GROUP:</text>
  <text x="380" y="300" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#DC2626">O+ve</text>

  <text x="210" y="335" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">ADDRESS:</text>
  <text x="210" y="355" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" fill="#1E293B">#88 Basaveshwara Nagar, Sagar Road,</text>
  <text x="210" y="375" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#1E293B">Shivamogga, Karnataka - 577204</text>

  <!-- Right Column: Validity and Categories -->
  <rect x="540" y="150" width="270" height="235" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  <text x="560" y="180" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">ISSUING AUTHORITY:</text>
  <text x="560" y="200" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="#0F172A">RTO Shivamogga (KA-14)</text>

  <text x="560" y="235" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">DATE OF ISSUE:</text>
  <text x="560" y="255" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="#0F172A">12-06-2018</text>

  <text x="560" y="290" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">VALID TILL (NT):</text>
  <text x="560" y="310" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#047857">11-06-2038</text>

  <text x="560" y="345" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#64748B">VEHICLE CLASS (COV):</text>
  <text x="560" y="370" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E3A8A">MCWG, LMV</text>

  <!-- Chip and Footer -->
  <rect x="40" y="415" width="770" height="90" rx="12" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
  <text x="60" y="450" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">SMART CARD OPTICAL CHIP EMBEDDED</text>
  <text x="60" y="475" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Motor Vehicles Act, 1988 · Verified by Ministry of Road Transport and Highways (MoRTH)</text>
</svg>`;

const passport_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="600" viewBox="0 0 850 600">
  <rect width="850" height="600" rx="16" fill="#FFFDF8" stroke="#CBD5E1" stroke-width="2"/>

  <!-- Top Blue Passport Header -->
  <rect x="0" y="0" width="850" height="75" rx="16" fill="#0F2440"/>
  <rect x="0" y="55" width="850" height="20" fill="#0F2440"/>
  <text x="425" y="32" font-family="DejaVu Sans, Times New Roman, serif" font-size="17" font-weight="bold" fill="#E2E8F0" text-anchor="middle" letter-spacing="3">REPUBLIC OF INDIA / BHARAT GANARAJYA</text>
  <text x="425" y="58" font-family="DejaVu Sans, Times New Roman, serif" font-size="15" font-weight="bold" fill="#FCD34D" text-anchor="middle" letter-spacing="4">PASSPORT / PASSPORT</text>

  <!-- Photo Box -->
  <rect x="40" y="95" width="180" height="240" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2"/>
  <circle cx="130" cy="180" r="50" fill="#94A3B8"/>
  <path d="M60,305 Q130,225 200,305 Z" fill="#64748B"/>
  <text x="130" y="355" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#475569" text-anchor="middle">R. V. DESHMUKH</text>

  <!-- Data Grid -->
  <text x="245" y="115" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Type</text>
  <text x="245" y="132" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="#0F172A">P</text>

  <text x="330" y="115" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Country Code</text>
  <text x="330" y="132" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="#0F172A">IND</text>

  <text x="470" y="115" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Passport No.</text>
  <text x="470" y="132" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#B91C1C">Z6182940</text>

  <text x="245" y="165" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Surname</text>
  <text x="245" y="185" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#0F172A">DESHMUKH</text>

  <text x="245" y="215" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Given Name(s)</text>
  <text x="245" y="235" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#0F172A">ROHAN VIKRAM</text>

  <text x="245" y="265" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Nationality</text>
  <text x="245" y="285" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">INDIAN</text>

  <text x="370" y="265" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Sex</text>
  <text x="370" y="285" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">M</text>

  <text x="470" y="265" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Date of Birth</text>
  <text x="470" y="285" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">22/05/1990</text>

  <text x="245" y="315" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Place of Birth</text>
  <text x="245" y="335" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">SHIVAMOGGA, KARNATAKA</text>

  <text x="470" y="315" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Place of Issue</text>
  <text x="470" y="335" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">BENGALURU</text>

  <text x="245" y="365" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Date of Issue</text>
  <text x="245" y="385" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">10/01/2022</text>

  <text x="470" y="365" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#64748B">Date of Expiry</text>
  <text x="470" y="385" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#047857">09/01/2032</text>

  <!-- MRZ -->
  <rect x="25" y="470" width="800" height="95" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
  <text x="50" y="510" font-family="Courier New, monospace" font-size="20" font-weight="bold" fill="#0F172A" letter-spacing="3">P&lt;INDDESHMUKH&lt;&lt;ROHAN&lt;VIKRAM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="50" y="545" font-family="Courier New, monospace" font-size="20" font-weight="bold" fill="#0F172A" letter-spacing="3">Z6182940&lt;4IND9005228M3201095&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;08</text>
</svg>`;

const visa_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="540" viewBox="0 0 850 540">
  <rect width="850" height="540" rx="16" fill="#F0FDF4" stroke="#86EFAC" stroke-width="2"/>

  <!-- Top Banner -->
  <rect x="0" y="0" width="850" height="70" rx="16" fill="#065F46"/>
  <rect x="0" y="50" width="850" height="20" fill="#065F46"/>
  <text x="425" y="35" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">SCHENGEN VISA / RÉPUBLIQUE FRANÇAISE</text>
  <text x="425" y="58" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#A7F3D0" text-anchor="middle">VISA DE COURT SÉJOUR / SHORT STAY TOURIST VISA</text>

  <!-- Photo Box -->
  <rect x="40" y="95" width="150" height="200" rx="6" fill="#E2E8F0" stroke="#6EE7B7" stroke-width="2"/>
  <circle cx="115" cy="170" r="45" fill="#94A3B8"/>
  <path d="M55,275 Q115,200 175,275 Z" fill="#64748B"/>
  <text x="115" y="315" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#475569" text-anchor="middle">R. DESHMUKH</text>

  <!-- Visa Details Grid -->
  <text x="215" y="120" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">VALID FOR / VALABLE POUR:</text>
  <text x="215" y="142" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#0F172A">ETATS SCHENGEN</text>

  <text x="480" y="120" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">VISA NUMBER:</text>
  <text x="480" y="142" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="bold" fill="#DC2626">VFRA94810284</text>

  <text x="215" y="180" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">FROM / DU:</text>
  <text x="215" y="202" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#0F172A">15-10-2025</text>

  <text x="350" y="180" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">UNTIL / AU:</text>
  <text x="350" y="202" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#0F172A">14-11-2025</text>

  <text x="480" y="180" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">ENTRIES / ENTRÉES:</text>
  <text x="480" y="202" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#0F172A">MULT (Multiple)</text>

  <text x="630" y="180" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">DURATION OF STAY:</text>
  <text x="630" y="202" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#047857">30 DAYS</text>

  <text x="215" y="245" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">NAME / NOM, PRÉNOM:</text>
  <text x="215" y="270" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#0F172A">DESHMUKH, ROHAN VIKRAM</text>

  <text x="215" y="305" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">PASSPORT NUMBER:</text>
  <text x="215" y="327" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1E3A8A">Z6182940</text>

  <text x="480" y="305" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" fill="#065F46">ISSUED IN / DÉLIVRÉ À:</text>
  <text x="480" y="327" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="bold" fill="#0F172A">MUMBAI (CONSULATE GENERAL)</text>

  <!-- MRZ Strip for Visa -->
  <rect x="25" y="420" width="800" height="95" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
  <text x="50" y="460" font-family="Courier New, monospace" font-size="20" font-weight="bold" fill="#0F172A" letter-spacing="3">V&lt;FRADESHMUKH&lt;&lt;ROHAN&lt;VIKRAM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="50" y="495" font-family="Courier New, monospace" font-size="20" font-weight="bold" fill="#0F172A" letter-spacing="3">VFRA94810284IND9005228M2511140M&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</text>
</svg>`;

const allSamples = [
  { name: 'sample_aadhaar_front', svg: aadhaar_front_svg },
  { name: 'sample_aadhaar_back', svg: aadhaar_back_svg },
  { name: 'sample_driving_licence', svg: dl_svg },
  { name: 'sample_passport', svg: passport_svg },
  { name: 'sample_visa', svg: visa_svg },
];

async function generateAll() {
  for (const item of allSamples) {
    const svgPath = path.join(samplesDir, `${item.name}.svg`);
    const pngPath = path.join(samplesDir, `${item.name}.png`);
    fs.writeFileSync(svgPath, item.svg, 'utf-8');
    await sharp(Buffer.from(item.svg), { density: 150 })
      .png()
      .toFile(pngPath);
    const stat = fs.statSync(pngPath);
    console.log(`Generated ${pngPath} (${stat.size} bytes)`);
  }
}

generateAll().catch(console.error);
