/**
 * Smart AI Travel Planner 3.0
 * Server-Side Gemini API Client
 *
 * Adheres strictly to gemini-api skill:
 * - Uses `@google/genai` with `GoogleGenAI`
 * - Sets 'User-Agent': 'aistudio-build' header
 * - Uses `gemini-3.8-flash` as the core reasoning model
 * - Handles API key from process.env.GEMINI_API_KEY
 * - Safe error handling with fallbacks
 */

import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return aiClient;
}

export async function generateGeminiText(prompt: string, systemInstruction?: string): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 4000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          temperature: 0.7,
        },
      }),
      timeoutPromise,
    ]);

    return response.text || null;
  } catch (err) {
    console.warn('[Gemini Service] API call failed or timed out, falling back to curated intelligence:', (err as any)?.message || err);
    return null;
  }
}

export interface DocumentFilePart {
  base64Data: string;
  mimeType: string;
  fileName: string;
  side?: 'front' | 'back' | 'single';
}

export interface ExtractedOcrResult {
  rawText: string;
  documentCategory: 'identity' | 'travel' | 'financial' | 'general';
  documentType: string;
  documentTypeLabel: string;
  confidenceScore: number;
  fields: Record<string, any>;
  rawSummary: string;
  isPair?: boolean;
  pairSide?: 'front' | 'back' | 'both';
  isMaskedByDefault?: boolean;
}

export async function extractDocumentWithGemini(
  input: string | DocumentFilePart[],
  mimeTypeOrOptions?: string,
  fileNameParam?: string
): Promise<ExtractedOcrResult | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    // Normalize input to an array of DocumentFilePart
    const fileParts: DocumentFilePart[] = [];
    if (typeof input === 'string') {
      fileParts.push({
        base64Data: input,
        mimeType: (mimeTypeOrOptions || 'application/pdf').toLowerCase() === 'image/jpg' ? 'image/jpeg' : (mimeTypeOrOptions || 'application/pdf'),
        fileName: fileNameParam || 'document',
        side: 'single',
      });
    } else if (Array.isArray(input)) {
      for (const p of input) {
        fileParts.push({
          base64Data: p.base64Data,
          mimeType: (p.mimeType || 'application/pdf').toLowerCase() === 'image/jpg' ? 'image/jpeg' : (p.mimeType || 'application/pdf'),
          fileName: p.fileName || 'document',
          side: p.side || 'single',
        });
      }
    }

    if (fileParts.length === 0) return null;

    const isMultiPart = fileParts.length > 1;
    const documentNames = fileParts.map((f) => `${f.fileName}${f.side && f.side !== 'single' ? ` (${f.side})` : ''}`).join(', ');

    const prompt = `You are an expert document OCR and entity extraction engine specialized in both Identity Documents and Travel Documents.
Examine the provided document content (${documentNames}).

Supported Document Types:
1. IDENTITY DOCUMENTS:
   - Aadhaar Card (front side, back side, or combined front+back pair images)
   - Indian Driving Licence (front side, back side, or combined front+back pair images)
   - Passport (biographical data page or passport booklet)
   - Visa / Immigration Document (entry visa, e-visa, residence permit)
   - Other National ID / PAN Card / Voter ID
2. TRAVEL DOCUMENTS:
   - Flight Ticket / Flight Confirmation / Boarding Pass
   - Hotel Booking / Hotel Voucher / Accommodation Receipt
   - Train Ticket / Bus Ticket / Transit Pass
   - Travel Expense Receipt / Car Rental Agreement

CRITICAL EXTRACTION DIRECTIVES:
1. DOCUMENT CLASSIFICATION:
   - "documentCategory": "identity" | "travel" | "financial" | "general"
   - "documentType": "aadhaar" | "driving_licence" | "passport" | "visa" | "flight_ticket" | "flight_confirmation" | "boarding_pass" | "hotel_booking" | "hotel_voucher" | "train_ticket" | "bus_ticket" | "travel_receipt" | "other"
   - "documentTypeLabel": A clear, formatted title, e.g.:
     "Aadhaar Card (Front & Back)", "Aadhaar Card (Front)", "Aadhaar Card (Back)", "Indian Driving Licence", "Passport", "Tourist Visa", "Flight Boarding Pass", "Hotel Booking Confirmation", "IRCTC Train E-Ticket", "Travel Receipt"
   - "isPair": true if multiple images (e.g. front and back) were provided, else false
   - "pairSide": "front" | "back" | "both"

2. MERGING FRONT & BACK:
   - If two images are provided (e.g. Front & Back of an Aadhaar card or Driving Licence), cross-reference both images to build a single comprehensive record.
   - For Aadhaar: Front typically has Name, Date/Year of Birth, Gender, Photo, and 12-digit Aadhaar number. Back typically has Address, C/O (Father's/Husband's name), and QR code. Merge them all.
   - For Driving Licence: Front typically has Name, Licence Number, DOB, Issue Date, Expiry Date, Vehicle Categories (MCWG, LMV). Back often has Address, Badge, or Endorsements.

3. STRICT ACCURACY & ZERO HALLUCINATION:
   - Extract ONLY values that are genuinely readable in the uploaded file(s).
   - If a field is not detected or cannot be verified, set its value to null. NEVER invent, extrapolate, or guess missing information.

4. SENSITIVE NUMBER MASKING (PRIVACY-FIRST):
   - For Aadhaar:
     * "aadhaarNumberMasked": Mask the first 8 digits with 'X' or '•', keeping only the last 4 digits visible (e.g., "XXXX XXXX 1234" or "•••• •••• 1234").
     * "aadhaarNumberRaw": The full detected number without masking (for optional user verification in UI).
   - For Driving Licence:
     * "licenceNumberMasked": Mask middle digits, e.g. "DL-••••••••1234" or "KA-XXXX...1234".
     * "licenceNumberRaw": The full detected licence number.
   - For Passport:
     * "passportNumberMasked": Mask inner digits, e.g. "Z•••••78" or "ZXXXXX78".
     * "passportNumberRaw": The full detected passport number.
   - For Visa:
     * "visaNumberMasked": Mask inner digits, e.g. "V•••••••90".
     * "visaNumberRaw": Full detected visa number.

5. FIELD SCHEMAS FOR SPECIFIC DOCUMENT TYPES:
   A. AADHAAR:
      - name: string | null
      - aadhaarNumberMasked: string | null
      - aadhaarNumberRaw: string | null
      - dateOfBirth: string | null (e.g. "DD/MM/YYYY")
      - yearOfBirth: string | null (e.g. "1990" if full DOB not shown)
      - gender: string | null ("Male", "Female", "Transgender")
      - address: string | null (complete address text)
      - careOf: string | null (Father / Husband / Guardian name, e.g. "C/O Ramesh Kumar")
      - vid: string | null (16-digit Virtual ID if present)
      - hasFront: boolean
      - hasBack: boolean

   B. DRIVING LICENCE:
      - name: string | null
      - licenceNumberMasked: string | null
      - licenceNumberRaw: string | null
      - issuingAuthority: string | null (RTO office / State)
      - dateOfBirth: string | null
      - issueDate: string | null
      - expiryDate: string | null
      - vehicleCategories: string[] | null (e.g. ["MCWG", "LMV", "TRANS"])
      - address: string | null
      - bloodGroup: string | null
      - hasFront: boolean
      - hasBack: boolean

   C. PASSPORT:
      - name: string | null (full name)
      - givenNames: string | null
      - surname: string | null
      - passportNumberMasked: string | null
      - passportNumberRaw: string | null
      - nationality: string | null (e.g. "Indian", "British", "American")
      - dateOfBirth: string | null
      - placeOfBirth: string | null
      - placeOfIssue: string | null
      - dateOfIssue: string | null
      - expiryDate: string | null
      - gender: string | null
      - fatherName: string | null
      - motherName: string | null
      - spouseName: string | null
      - mrzCode: string | null (Machine Readable Zone lines if detected)

   D. VISA:
      - holderName: string | null
      - visaNumberMasked: string | null
      - visaNumberRaw: string | null
      - visaType: string | null (e.g. "Tourist", "Business", "Student")
      - issuingCountry: string | null
      - issuingAuthority: string | null
      - validFrom: string | null
      - validUntil: string | null
      - numberOfEntries: string | null ("Single", "Multiple", "Double")
      - durationOfStay: string | null
      - passportNumberMasked: string | null
      - passportNumberRaw: string | null

   E. TRAVEL BOOKING / TICKETS:
      - passengerNames: string[] (names of all travelers or guests)
      - bookingReference: string | null (PNR, confirmation code, or booking ID)
      - origin: string | null (origin airport/city/station)
      - destination: string | null (destination airport/city/hotel location)
      - departureDate: string | null (departure timestamp or check-in date)
      - arrivalDate: string | null (arrival timestamp or check-out date)
      - flightOrRoomNumber: string | null (flight number, train number, or room type)
      - seatNumber: string | null (seat or room allocation)
      - terminalOrGate: string | null (terminal, gate, or platform)
      - baggageAllowance: string | null
      - pricePaid: string | null (total fare/cost with currency)
      - cancellationPolicy: string | null
      - carrierOrOperator: string | null (e.g. "IndiGo", "Lufthansa", "Marriott", "IRCTC")

6. VERBATIM TRANSCRIPTION & SUMMARY:
   - "rawText": Accurate verbatim transcription of all legible text in the document.
   - "rawSummary": A 2-sentence privacy-conscious summary describing what was detected (do NOT print unmasked full ID numbers here).
   - "confidenceScore": Float between 0.0 and 1.0 (score < 0.2 if blank, unreadable, or noisy).

Return ONLY valid JSON matching this schema:
{
  "documentCategory": "identity",
  "documentType": "aadhaar",
  "documentTypeLabel": "Aadhaar Card (Front & Back)",
  "confidenceScore": 0.96,
  "isPair": false,
  "pairSide": "both",
  "isMaskedByDefault": true,
  "fields": { ... },
  "rawSummary": "...",
  "rawText": "..."
}`;

    // Construct content parts for multimodal call
    const contentParts: any[] = [];
    for (const part of fileParts) {
      const cleanBase64 = part.base64Data.trim().replace(/^data:[^;]+;base64,/, '');
      contentParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: part.mimeType,
        },
      });
    }
    contentParts.push({ text: prompt });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Document OCR extraction timed out after 35 seconds')), 35000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: contentParts,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Low temperature for high OCR precision
        },
      }),
      timeoutPromise,
    ]);

    const text = response.text;
    if (!text || text.trim().length === 0) return null;

    let cleanJson = text.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (err: any) {
    console.warn('[Gemini Service] Document OCR extraction failed:', err?.message || err);
    return null;
  }
}


