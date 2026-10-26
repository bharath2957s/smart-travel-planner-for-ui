/**
 * Smart AI Travel Planner 3.0
 * Unified Document & Identity Extraction Types
 */

export type DocumentCategory = 'identity' | 'travel' | 'financial' | 'general';

export type IdentityDocumentType =
  | 'aadhaar'
  | 'driving_licence'
  | 'passport'
  | 'visa'
  | 'national_id'
  | 'voter_id'
  | 'pan_card';

export type TravelDocumentType =
  | 'flight_ticket'
  | 'flight_confirmation'
  | 'boarding_pass'
  | 'hotel_booking'
  | 'hotel_voucher'
  | 'train_ticket'
  | 'bus_ticket'
  | 'travel_receipt'
  | 'rental_agreement'
  | 'itinerary'
  | 'other';

export type UnifiedDocumentType = IdentityDocumentType | TravelDocumentType;

/**
 * Aadhaar card specific extracted fields
 */
export interface AadhaarFields {
  name?: string | null;
  aadhaarNumberMasked?: string | null; // e.g. "XXXX XXXX 1234"
  aadhaarNumberRaw?: string | null;
  dateOfBirth?: string | null;
  yearOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  careOf?: string | null; // Father's / Husband's / Guardian's name (C/O)
  vid?: string | null; // Virtual ID
  hasFront?: boolean;
  hasBack?: boolean;
  qrCodeDetected?: boolean;
}

/**
 * Indian Driving Licence specific extracted fields
 */
export interface DrivingLicenceFields {
  name?: string | null;
  licenceNumberMasked?: string | null; // e.g. "DL-••••••••1234"
  licenceNumberRaw?: string | null;
  issuingAuthority?: string | null; // e.g. "RTO Shivamogga, Karnataka"
  dateOfBirth?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  vehicleCategories?: string[] | null; // e.g. ["MCWG", "LMV"]
  address?: string | null;
  bloodGroup?: string | null;
  hasFront?: boolean;
  hasBack?: boolean;
}

/**
 * Passport specific extracted fields
 */
export interface PassportFields {
  name?: string | null;
  givenNames?: string | null;
  surname?: string | null;
  passportNumberMasked?: string | null; // e.g. "Z•••••78"
  passportNumberRaw?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  placeOfIssue?: string | null;
  dateOfIssue?: string | null;
  expiryDate?: string | null;
  gender?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  mrzCode?: string | null;
}

/**
 * Visa specific extracted fields
 */
export interface VisaFields {
  holderName?: string | null;
  visaNumberMasked?: string | null;
  visaNumberRaw?: string | null;
  visaType?: string | null; // e.g. "Tourist (T)", "Business (B-1/B-2)", "Schengen Short Stay"
  issuingCountry?: string | null;
  issuingAuthority?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  numberOfEntries?: string | null; // e.g. "Single", "Multiple", "Double"
  durationOfStay?: string | null;
  passportNumberMasked?: string | null;
  passportNumberRaw?: string | null;
}

/**
 * Travel Booking specific extracted fields
 */
export interface TravelBookingFields {
  passengerNames?: string[];
  bookingReference?: string | null; // PNR or Reservation Code
  origin?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  arrivalDate?: string | null;
  flightOrRoomNumber?: string | null; // e.g. "AI-602", "Room 402"
  seatNumber?: string | null;
  terminalOrGate?: string | null;
  baggageAllowance?: string | null;
  pricePaid?: string | null;
  cancellationPolicy?: string | null;
  carrierOrOperator?: string | null;
}

/**
 * Combined flexible fields structure
 */
export interface ExtractedFields extends AadhaarFields, DrivingLicenceFields, PassportFields, VisaFields, TravelBookingFields {
  [key: string]: any;
}

export interface ExtractedDocumentRecord {
  id: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt: string;
  parsedAt?: string;
  confidenceScore: number;
  documentCategory: DocumentCategory;
  documentType: UnifiedDocumentType | string;
  documentTypeLabel: string;
  isPair?: boolean;
  pairSide?: 'front' | 'back' | 'both' | 'single';
  fields: ExtractedFields;
  rawSummary?: string;
  rawText?: string;
  status: 'verified' | 'needs_review' | 'failed';
  isMaskedByDefault?: boolean;
}
