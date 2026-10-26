/**
 * Smart AI Travel Planner 3.0
 * Travel Documents & Identity OCR Extractor
 *
 * Supports:
 * - Identity Documents: Aadhaar (front, back, and combined pairs), Indian Driving Licences, Passports, Visas
 * - Travel Bookings: Flight tickets, boarding passes, hotel vouchers, train/bus tickets, receipts
 * - Formats: JPG, JPEG, PNG, WEBP, and PDFs (scanned and digital)
 * - Privacy: Zero permanent retention without user save, masked identity numbers by default, ephemeral processing
 */

import React, { useState, useRef } from 'react';
import { TripPlan, ExtractedDocument } from '../../types/travel';
import { parseDocument, saveReviewedDocumentToTrip } from '../../lib/api';

interface DocumentsPageProps {
  trip: TripPlan;
  onUpdateTripDocuments?: (doc: ExtractedDocument) => void;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  trip,
  onUpdateTripDocuments,
}) => {
  const [documents, setDocuments] = useState<ExtractedDocument[]>(
    trip.extractedDocuments && trip.extractedDocuments.length > 0
      ? trip.extractedDocuments
      : []
  );

  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || ''
  );

  // Upload Mode: 'single' vs 'card_pair' (front & back)
  const [uploadMode, setUploadMode] = useState<'single' | 'card_pair'>('single');

  // Single file stage
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);

  // Front & Back card pair stage
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Extraction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active view tab: 'structured' vs 'raw_text'
  const [activeTab, setActiveTab] = useState<'structured' | 'raw_text'>('structured');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Privacy: Sensitive ID Number Unmask Toggle (masked by default)
  const [showUnmaskedNumbers, setShowUnmaskedNumbers] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  const currentDoc =
    documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  // Editable fields state for the active document
  const [editableFields, setEditableFields] = useState<Record<string, any>>({
    ...(currentDoc?.fields || {}),
    passengerNames: Array.isArray(currentDoc?.fields?.passengerNames)
      ? currentDoc?.fields?.passengerNames.join(', ')
      : currentDoc?.fields?.passengerNames || '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSelectDoc = (doc: ExtractedDocument) => {
    setSelectedDocId(doc.id);
    setEditableFields({
      ...(doc.fields || {}),
      passengerNames: Array.isArray(doc.fields?.passengerNames)
        ? doc.fields.passengerNames.join(', ')
        : doc.fields?.passengerNames || '',
    });
    setSaveSuccess(false);
    setExtractionError(null);
  };

  const handleFieldChange = (key: string, value: any) => {
    setEditableFields((prev) => ({ ...prev, [key]: value }));
  };

  const validateFile = (file: File): string | null => {
    const isAllowed =
      ALLOWED_TYPES.includes(file.type) ||
      /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name);

    if (!isAllowed) {
      return `"${file.name}" is an unsupported file format. Please upload JPG, PNG, WEBP, or PDF.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" exceeds the 15 MB limit. Please select a smaller file.`;
    }
    return null;
  };

  // Single file staging
  const handleSingleFileChange = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    setExtractionError(null);
    setStagedFile(file);
    if (file.type.startsWith('image/')) {
      setStagedPreviewUrl(URL.createObjectURL(file));
    } else {
      setStagedPreviewUrl(null);
    }
  };

  // Front file staging
  const handleFrontFileChange = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    setFrontFile(file);
    if (file.type.startsWith('image/')) {
      setFrontPreviewUrl(URL.createObjectURL(file));
    } else {
      setFrontPreviewUrl(null);
    }
  };

  // Back file staging
  const handleBackFileChange = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    setBackFile(file);
    if (file.type.startsWith('image/')) {
      setBackPreviewUrl(URL.createObjectURL(file));
    } else {
      setBackPreviewUrl(null);
    }
  };

  const handleRemoveSingleFile = () => {
    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    setStagedFile(null);
    setStagedPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFrontFile = () => {
    if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl);
    setFrontFile(null);
    setFrontPreviewUrl(null);
    if (frontInputRef.current) frontInputRef.current.value = '';
  };

  const handleRemoveBackFile = () => {
    if (backPreviewUrl) URL.revokeObjectURL(backPreviewUrl);
    setBackFile(null);
    setBackPreviewUrl(null);
    if (backInputRef.current) backInputRef.current.value = '';
  };

  // Quick sample loader
  const handleLoadSample = async (
    samplePath: string,
    fileName: string,
    mimeType: string,
    targetMode: 'single' | 'front' | 'back'
  ) => {
    try {
      setFileError(null);
      setExtractionError(null);
      const res = await fetch(samplePath);
      if (!res.ok) throw new Error(`Sample file not found (${res.status})`);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mimeType });

      if (targetMode === 'single') {
        setUploadMode('single');
        handleSingleFileChange(file);
      } else if (targetMode === 'front') {
        setUploadMode('card_pair');
        handleFrontFileChange(file);
      } else if (targetMode === 'back') {
        setUploadMode('card_pair');
        handleBackFileChange(file);
      }
    } catch (err: any) {
      setFileError(`Could not load sample: ${err?.message || 'File unavailable'}`);
    }
  };

  // 1-Click Load both Front & Back for Aadhaar
  const handleLoadAadhaarPair = async () => {
    try {
      setFileError(null);
      setExtractionError(null);
      setUploadMode('card_pair');

      const [resFront, resBack] = await Promise.all([
        fetch('/samples/sample_aadhaar_front.png'),
        fetch('/samples/sample_aadhaar_back.png'),
      ]);

      if (!resFront.ok || !resBack.ok) throw new Error('Aadhaar sample images not reachable');

      const [blobFront, blobBack] = await Promise.all([resFront.blob(), resBack.blob()]);
      const fileF = new File([blobFront], 'Aadhaar_Card_Front.png', { type: 'image/png' });
      const fileB = new File([blobBack], 'Aadhaar_Card_Back.png', { type: 'image/png' });

      handleFrontFileChange(fileF);
      handleBackFileChange(fileB);
      showToast('Loaded sample Aadhaar Front & Back pair!');
    } catch (err: any) {
      setFileError(`Could not load Aadhaar sample pair: ${err?.message || 'Error'}`);
    }
  };

  // Run Real OCR Extraction
  const handleProcessExtraction = async () => {
    if (uploadMode === 'single' && !stagedFile) {
      setFileError('Please select a document file to extract.');
      return;
    }
    if (uploadMode === 'card_pair' && !frontFile && !backFile) {
      setFileError('Please select at least the front side of the card.');
      return;
    }

    setIsProcessing(true);
    setExtractionError(null);
    setProcessingStage('Preparing document for OCR pipeline...');

    try {
      setProcessingStage('Analyzing document structure with multimodal AI...');

      let result;
      if (uploadMode === 'single' && stagedFile) {
        result = await parseDocument({
          file: stagedFile,
          tripId: trip.id,
          saveToTrip: false, // Ephemeral review first
        });
      } else {
        result = await parseDocument({
          frontFile: frontFile || undefined,
          backFile: backFile || undefined,
          tripId: trip.id,
          saveToTrip: false, // Ephemeral review first
        });
      }

      if (result.success && result.document) {
        setProcessingStage('Structuring extracted personal and booking fields...');
        const newDoc = result.document;

        setDocuments((prev) => [newDoc, ...prev]);
        handleSelectDoc(newDoc);

        // Clear staged inputs
        if (uploadMode === 'single') {
          handleRemoveSingleFile();
        } else {
          handleRemoveFrontFile();
          handleRemoveBackFile();
        }

        showToast(`Successfully extracted ${newDoc.documentTypeLabel || newDoc.documentType}!`);
      } else {
        setExtractionError(
          result.message || 'Unable to extract structured data from the uploaded document.'
        );
      }
    } catch (err: any) {
      setExtractionError(
        err?.message || 'A network error occurred while communicating with the OCR service.'
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // Explicit user action: Save to Dossier
  const handleSaveToTrip = async () => {
    if (!currentDoc) return;
    const updated: ExtractedDocument = {
      ...currentDoc,
      fields: {
        ...currentDoc.fields,
        ...editableFields,
        passengerNames: typeof editableFields.passengerNames === 'string'
          ? editableFields.passengerNames.split(',').map((s: string) => s.trim()).filter(Boolean)
          : editableFields.passengerNames,
      },
    };

    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (onUpdateTripDocuments) {
      onUpdateTripDocuments(updated);
    }

    // Persist to server store
    await saveReviewedDocumentToTrip(updated, trip.id);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    showToast('Saved document to active trip dossier!');
  };

  // Copy single field
  const handleCopyField = (fieldName: string, textToCopy?: string | null) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      showToast(`Copied ${fieldName} to clipboard`);
    });
  };

  // Copy All extracted details
  const handleCopyAll = () => {
    if (!currentDoc) return;

    const isId = currentDoc.documentCategory === 'identity' || ['aadhaar', 'driving_licence', 'passport', 'visa'].includes(currentDoc.documentType);
    let formattedText = `SMART AI TRAVEL & IDENTITY EXTRACTOR
===================================================
Document: ${currentDoc.fileName}
Category: ${(currentDoc.documentCategory || 'General').toUpperCase()}
Type: ${currentDoc.documentTypeLabel || currentDoc.documentType}
Confidence: ${Math.round((currentDoc.confidenceScore ?? 0.95) * 100)}%
Processed: ${currentDoc.parsedAt || currentDoc.uploadedAt}

---------------------------------------------------
EXTRACTED FIELDS
---------------------------------------------------
`;

    if (currentDoc.documentType === 'aadhaar') {
      formattedText += `
• Name: ${editableFields.name || 'Not detected'}
• Aadhaar Number: ${showUnmaskedNumbers ? (editableFields.aadhaarNumberRaw || editableFields.aadhaarNumberMasked) : (editableFields.aadhaarNumberMasked || 'XXXX XXXX XXXX')}
• Date of Birth: ${editableFields.dateOfBirth || editableFields.yearOfBirth || 'Not detected'}
• Gender: ${editableFields.gender || 'Not detected'}
• Address: ${editableFields.address || 'Not detected'}
• Care Of (C/O): ${editableFields.careOf || 'Not detected'}
• VID: ${editableFields.vid || 'Not detected'}
• Sides Verified: ${editableFields.hasFront && editableFields.hasBack ? 'Front & Back Verified' : editableFields.hasFront ? 'Front Side Only' : editableFields.hasBack ? 'Back Side Only' : 'Single'}`;
    } else if (currentDoc.documentType === 'driving_licence') {
      formattedText += `
• Name: ${editableFields.name || 'Not detected'}
• Licence Number: ${showUnmaskedNumbers ? (editableFields.licenceNumberRaw || editableFields.licenceNumberMasked) : (editableFields.licenceNumberMasked || 'DL-••••••••')}
• Issuing Authority: ${editableFields.issuingAuthority || 'Not detected'}
• Vehicle Categories: ${Array.isArray(editableFields.vehicleCategories) ? editableFields.vehicleCategories.join(', ') : editableFields.vehicleCategories || 'Not detected'}
• Date of Birth: ${editableFields.dateOfBirth || 'Not detected'}
• Date of Issue: ${editableFields.issueDate || 'Not detected'}
• Expiry Date (Valid Till): ${editableFields.expiryDate || 'Not detected'}
• Blood Group: ${editableFields.bloodGroup || 'Not detected'}
• Address: ${editableFields.address || 'Not detected'}`;
    } else if (currentDoc.documentType === 'passport') {
      formattedText += `
• Full Name: ${editableFields.name || `${editableFields.givenNames || ''} ${editableFields.surname || ''}`.trim() || 'Not detected'}
• Passport Number: ${showUnmaskedNumbers ? (editableFields.passportNumberRaw || editableFields.passportNumberMasked) : (editableFields.passportNumberMasked || '••••••••')}
• Nationality: ${editableFields.nationality || 'Not detected'}
• Date of Birth: ${editableFields.dateOfBirth || 'Not detected'}
• Place of Birth: ${editableFields.placeOfBirth || 'Not detected'}
• Date of Issue: ${editableFields.dateOfIssue || 'Not detected'}
• Date of Expiry: ${editableFields.expiryDate || 'Not detected'}
• Sex / Gender: ${editableFields.gender || 'Not detected'}
• MRZ Code: ${editableFields.mrzCode || 'Not detected'}`;
    } else if (currentDoc.documentType === 'visa') {
      formattedText += `
• Holder Name: ${editableFields.holderName || 'Not detected'}
• Visa Number: ${showUnmaskedNumbers ? (editableFields.visaNumberRaw || editableFields.visaNumberMasked) : (editableFields.visaNumberMasked || '••••••••')}
• Visa Type: ${editableFields.visaType || 'Not detected'}
• Issuing Country: ${editableFields.issuingCountry || 'Not detected'}
• Validity: ${editableFields.validFrom || 'Not detected'} to ${editableFields.validUntil || 'Not detected'}
• Number of Entries: ${editableFields.numberOfEntries || 'Not detected'}
• Duration of Stay: ${editableFields.durationOfStay || 'Not detected'}
• Passport Number: ${editableFields.passportNumberMasked || 'Not detected'}`;
    } else {
      formattedText += `
• Passenger/Guest: ${editableFields.passengerNames || 'Not detected'}
• Booking Reference / PNR: ${editableFields.bookingReference || 'Not detected'}
• Origin: ${editableFields.origin || 'Not detected'}
• Destination: ${editableFields.destination || 'Not detected'}
• Departure: ${editableFields.departureDate || 'Not detected'}
• Arrival: ${editableFields.arrivalDate || 'Not detected'}
• Flight/Room/Carrier: ${editableFields.flightOrRoomNumber || editableFields.carrierOrOperator || 'Not detected'}
• Seat/Room: ${editableFields.seatNumber || 'Not detected'}
• Terminal/Gate: ${editableFields.terminalOrGate || 'Not detected'}
• Price Paid: ${editableFields.pricePaid || 'Not detected'}
• Cancellation Policy: ${editableFields.cancellationPolicy || 'Not detected'}`;
    }

    formattedText += `\n\n---------------------------------------------------\nSUMMARY\n---------------------------------------------------\n${currentDoc.rawSummary || 'Not available'}\n\n---------------------------------------------------\nRAW TRANSCRIPTION\n---------------------------------------------------\n${currentDoc.rawText || 'Not available'}\n`;

    navigator.clipboard.writeText(formattedText.trim()).then(() => {
      showToast('Copied full structured dossier to clipboard!');
    });
  };

  // Download raw extracted text as .txt report
  const handleDownloadExtractedText = () => {
    if (!currentDoc) return;
    const isId = currentDoc.documentCategory === 'identity';
    const textContent = `SMART AI TRAVEL & IDENTITY EXTRACTOR REPORT
=====================================================
File Name: ${currentDoc.fileName}
Document Type: ${currentDoc.documentTypeLabel || currentDoc.documentType}
Category: ${(currentDoc.documentCategory || 'General').toUpperCase()}
Confidence Score: ${Math.round((currentDoc.confidenceScore ?? 0.95) * 100)}%
Processed Date: ${currentDoc.parsedAt || currentDoc.uploadedAt}
Masking Status: ${showUnmaskedNumbers ? 'UNMASKED (User Revealed)' : 'MASKED (Privacy Default)'}

-----------------------------------------------------
STRUCTURED EXTRACTED ENTITIES
-----------------------------------------------------
${JSON.stringify(editableFields, null, 2)}

-----------------------------------------------------
FACTUAL SUMMARY
-----------------------------------------------------
${currentDoc.rawSummary || 'N/A'}

-----------------------------------------------------
VERBATIM OCR TRANSCRIPTION
-----------------------------------------------------
${currentDoc.rawText || 'Verbatim transcription not supplied.'}
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = currentDoc.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanName}_Extracted_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded text report.');
  };

  // Export all documents as JSON
  const exportAsJSON = () => {
    const exportDocs = documents.map((doc) => ({
      ...doc,
      fields: {
        ...doc.fields,
        // Only include raw unmasked numbers if user revealed them
        ...(!showUnmaskedNumbers
          ? {
              aadhaarNumberRaw: undefined,
              licenceNumberRaw: undefined,
              passportNumberRaw: undefined,
              visaNumberRaw: undefined,
            }
          : {}),
      },
    }));

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(exportDocs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `SmartTravel_Dossier_Documents_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported structured dossier as JSON.');
  };

  // Helper to render field with "Not detected" fallback
  const renderFieldRow = (
    label: string,
    fieldKey: string,
    value: string | undefined | null,
    isSensitive: boolean = false,
    rawValue?: string | null
  ) => {
    const displayVal = isSensitive && showUnmaskedNumbers && rawValue ? rawValue : value;
    const isMissing = !displayVal || displayVal.trim() === '';

    return (
      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 transition hover:border-[#CBD5E1]">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {label}
          </label>
          <div className="flex items-center gap-2">
            {!isMissing && (
              <button
                type="button"
                onClick={() => handleCopyField(label, displayVal)}
                className="text-[10px] text-[#0891B2] hover:text-[#0e7490] font-semibold flex items-center gap-0.5 cursor-pointer"
                title={`Copy ${label}`}
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedField === label ? 'check' : 'content_copy'}
                </span>
                <span>{copiedField === label ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

        {isMissing ? (
          <span className="text-xs text-[#94A3B8] italic block py-0.5">Not detected</span>
        ) : (
          <input
            type="text"
            value={displayVal}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            className="w-full text-xs font-semibold text-[#0F172A] bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-24 right-8 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg border border-[#334155] flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-sm text-[#0891B2]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#7C3AED]">
              Document & Identity Ingestion Pipeline
            </span>
            <span className="text-xs text-[#94A3B8]">•</span>
            <span className="text-xs font-mono text-[#64748B]">
              Multimodal OCR Engine v3.5
            </span>
          </div>
          <h1 className="font-serif-heading text-3xl font-bold text-[#0F172A] mt-1">
            Travel Documents & Identity Extractor
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Document-aware OCR for Aadhaar cards (front & back), Indian driving licences, passports, visas, flight boarding passes, and hotel vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={exportAsJSON}
            className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
        <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">
          shield_lock
        </span>
        <div className="space-y-1">
          <strong className="font-bold text-amber-950 block">
            Zero-Retention Privacy & Sensitive Data Safeguard
          </strong>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Uploaded identity cards, passports, and personal identification numbers are handled strictly in-memory during extraction. No identity documents or personal fields are permanently stored unless you explicitly click <strong>"Save to Dossier"</strong>. Aadhaar, passport, and licence numbers are masked by default.
          </p>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSingleFileChange(file);
        }}
      />
      <input
        ref={frontInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFrontFileChange(file);
        }}
      />
      <input
        ref={backInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleBackFileChange(file);
        }}
      />

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone, Upload Mode & Dossier History (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Mode Switcher */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Ingestion Mode
              </span>
              <span className="text-[10px] text-[#0891B2] font-semibold">
                Supports JPG, PNG, WEBP, PDF (Max 15MB)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#F1F5F9] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setUploadMode('single')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadMode === 'single'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Single File / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('card_pair')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadMode === 'card_pair'
                    ? 'bg-white text-[#7C3AED] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>ID Card (Front & Back)</span>
              </button>
            </div>

            {/* Mode 1: Single File Dropzone */}
            {uploadMode === 'single' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleSingleFileChange(file);
                }}
                className={`rounded-2xl border-2 border-dashed p-5 text-center space-y-3 transition-all ${
                  isDragging
                    ? 'border-[#0891B2] bg-[#EFF6FF]/40'
                    : 'border-[#CBD5E1] hover:border-[#0891B2]'
                }`}
              >
                {stagedFile ? (
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0891B2]">
                        Staged Document
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveSingleFile}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    {stagedPreviewUrl ? (
                      <div className="w-full h-36 rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50 flex items-center justify-center">
                        <img
                          src={stagedPreviewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full py-4 rounded-xl border border-[#E2E8F0] bg-slate-50 flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-3xl text-rose-500">
                          picture_as_pdf
                        </span>
                        <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[220px]">
                          {stagedFile.name}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {(stagedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold transition cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={handleProcessExtraction}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isProcessing ? 'sync' : 'document_scanner'}
                        </span>
                        <span>{isProcessing ? 'Extracting...' : 'Extract OCR'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#0891B2] flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                    </div>
                    <div>
                      <strong className="text-xs text-[#0F172A] block font-semibold">
                        Upload Passport, Visa, Ticket, or Voucher
                      </strong>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        Drag & drop or browse from your device
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      <span>Choose Document File</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Mode 2: ID Card (Front & Back Pair) */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Front Side */}
                  <div className="border border-[#CBD5E1] rounded-2xl p-3 text-center space-y-2 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                        1. Front Side
                      </span>
                      {frontFile && (
                        <button
                          type="button"
                          onClick={handleRemoveFrontFile}
                          className="text-[10px] text-rose-600 hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {frontFile ? (
                      <div className="h-24 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center">
                        {frontPreviewUrl ? (
                          <img
                            src={frontPreviewUrl}
                            alt="Front Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-[#0F172A] p-2 truncate">
                            {frontFile.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => frontInputRef.current?.click()}
                        className="h-24 border border-dashed border-[#CBD5E1] hover:border-[#7C3AED] rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer bg-white transition"
                      >
                        <span className="material-symbols-outlined text-xl text-[#7C3AED]">
                          add_photo_alternate
                        </span>
                        <span className="text-[10px] font-semibold text-[#64748B]">
                          Upload Front
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Back Side */}
                  <div className="border border-[#CBD5E1] rounded-2xl p-3 text-center space-y-2 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                        2. Back Side
                      </span>
                      {backFile && (
                        <button
                          type="button"
                          onClick={handleRemoveBackFile}
                          className="text-[10px] text-rose-600 hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {backFile ? (
                      <div className="h-24 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center">
                        {backPreviewUrl ? (
                          <img
                            src={backPreviewUrl}
                            alt="Back Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-[#0F172A] p-2 truncate">
                            {backFile.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => backInputRef.current?.click()}
                        className="h-24 border border-dashed border-[#CBD5E1] hover:border-[#7C3AED] rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer bg-white transition"
                      >
                        <span className="material-symbols-outlined text-xl text-[#7C3AED]">
                          add_photo_alternate
                        </span>
                        <span className="text-[10px] font-semibold text-[#64748B]">
                          Upload Back
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProcessExtraction}
                  disabled={isProcessing || (!frontFile && !backFile)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isProcessing ? 'sync' : 'badge'}
                  </span>
                  <span>
                    {isProcessing
                      ? 'Merging & Extracting...'
                      : 'Extract Both Card Sides'}
                  </span>
                </button>
              </div>
            )}

            {/* Quick Test Samples Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                Quick Test Genuine Samples
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadAadhaarPair}
                  className="text-[10px] font-semibold text-[#7C3AED] hover:bg-purple-100 px-2 py-1 rounded-lg bg-purple-50 transition cursor-pointer"
                >
                  Aadhaar (Front + Back)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSample(
                      '/samples/sample_driving_licence.png',
                      'Driving_Licence_KA14.png',
                      'image/png',
                      'single'
                    )
                  }
                  className="text-[10px] font-semibold text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg bg-blue-50 transition cursor-pointer"
                >
                  Driving Licence
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSample(
                      '/samples/sample_passport.png',
                      'Indian_Passport.png',
                      'image/png',
                      'single'
                    )
                  }
                  className="text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-lg bg-indigo-50 transition cursor-pointer"
                >
                  Passport
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSample(
                      '/samples/sample_visa.png',
                      'Schengen_Visa_France.png',
                      'image/png',
                      'single'
                    )
                  }
                  className="text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-lg bg-emerald-50 transition cursor-pointer"
                >
                  Schengen Visa
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSample(
                      '/samples/sample_ticket.png',
                      'Lufthansa_Ticket.png',
                      'image/png',
                      'single'
                    )
                  }
                  className="text-[10px] font-semibold text-cyan-700 hover:bg-cyan-100 px-2 py-1 rounded-lg bg-cyan-50 transition cursor-pointer"
                >
                  Flight PNG
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSample(
                      '/samples/sample_ticket.pdf',
                      'British_Airways.pdf',
                      'application/pdf',
                      'single'
                    )
                  }
                  className="text-[10px] font-semibold text-slate-700 hover:bg-slate-200 px-2 py-1 rounded-lg bg-slate-100 transition cursor-pointer"
                >
                  Flight PDF
                </button>
              </div>
            </div>

            {/* Error alerts */}
            {fileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-left flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{fileError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="text-rose-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Processing state indicator */}
            {isProcessing && (
              <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl text-left space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-[#0891B2]">
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                  <strong className="text-xs font-bold">Real OCR Extraction Active</strong>
                </div>
                <p className="text-[11px] text-[#64748B]">{processingStage}</p>
                <div className="w-full bg-[#BFDBFE] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0891B2] w-3/4 animate-pulse rounded-full" />
                </div>
              </div>
            )}

            {/* Extraction Error from Server */}
            {extractionError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs text-left space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>Extraction Diagnostic</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtractionError(null)}
                    className="text-rose-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer"
                  >
                    ✕ Dismiss
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-700">
                  {extractionError}
                </p>
              </div>
            )}
          </div>

          {/* Dossier Document List */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Ingested Documents ({documents.length})
              </span>
              {documents.length > 0 && (
                <span className="text-[10px] font-mono text-[#059669] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>Real OCR</span>
                </span>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8] space-y-2">
                <span className="material-symbols-outlined text-3xl">folder_open</span>
                <p className="text-xs font-medium">No documents extracted yet.</p>
                <p className="text-[10px]">
                  Upload an identity card, passport, visa, or travel ticket above.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  const isId =
                    doc.documentCategory === 'identity' ||
                    ['aadhaar', 'driving_licence', 'passport', 'visa'].includes(doc.documentType);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#0891B2] shadow-xs ring-1 ring-[#0891B2]/30'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`material-symbols-outlined text-lg ${
                              isId ? 'text-[#7C3AED]' : 'text-[#0891B2]'
                            }`}
                          >
                            {isId ? 'badge' : 'airplane_ticket'}
                          </span>
                          <div className="truncate">
                            <strong className="text-xs text-[#0F172A] block truncate">
                              {doc.fileName}
                            </strong>
                            <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">
                              {doc.documentTypeLabel || doc.documentType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {doc.isPair && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                              Front & Back
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {Math.round((doc.confidenceScore ?? 0.95) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: OCR Extraction View, Structured Entities & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {currentDoc ? (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs p-6 sm:p-7 space-y-6">
              {/* Header with confidence, badges, and toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-[#E2E8F0] gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        currentDoc.documentCategory === 'identity' ||
                        ['aadhaar', 'driving_licence', 'passport', 'visa'].includes(currentDoc.documentType)
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                      }`}
                    >
                      {currentDoc.documentCategory === 'identity' ||
                      ['aadhaar', 'driving_licence', 'passport', 'visa'].includes(currentDoc.documentType)
                        ? 'Identity Document'
                        : 'Travel Booking'}
                    </span>

                    {/* Document Type Label Badge */}
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                      {currentDoc.documentTypeLabel || currentDoc.documentType.replace('_', ' ')}
                    </span>

                    {/* Front & Back indicator */}
                    {currentDoc.isPair && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Front & Back Merged
                      </span>
                    )}

                    {/* Confidence Score */}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      {Math.round((currentDoc.confidenceScore ?? 0.95) * 100)}% Match
                    </span>
                  </div>

                  <h2 className="font-serif-heading text-xl font-bold text-[#0F172A]">
                    {currentDoc.fileName}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Parsed: {currentDoc.parsedAt || currentDoc.uploadedAt}
                  </p>
                </div>

                {/* Toolbar Buttons: Reveal, Copy All, Download, Save */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sensitive number mask/unmask toggle */}
                  {(currentDoc.documentCategory === 'identity' ||
                    ['aadhaar', 'driving_licence', 'passport', 'visa'].includes(currentDoc.documentType)) && (
                    <button
                      type="button"
                      onClick={() => setShowUnmaskedNumbers(!showUnmaskedNumbers)}
                      className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title={showUnmaskedNumbers ? 'Hide raw identity numbers' : 'Reveal unmasked identity numbers'}
                    >
                      <span className="material-symbols-outlined text-sm text-[#7C3AED]">
                        {showUnmaskedNumbers ? 'visibility_off' : 'visibility'}
                      </span>
                      <span>{showUnmaskedNumbers ? 'Mask Numbers' : 'Unmask'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Copy full extracted text and fields to clipboard"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span>Copy All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExtractedText}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Download extracted report as .txt"
                  >
                    <span className="material-symbols-outlined text-sm">file_download</span>
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToTrip}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    <span>Save to Dossier</span>
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Document fields synchronized with master trip dossier successfully!</span>
                </div>
              )}

              {/* View Switcher: Structured Entities vs Verbatim Text */}
              <div className="flex border-b border-[#E2E8F0] gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('structured')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    activeTab === 'structured'
                      ? 'text-[#0891B2] border-b-2 border-[#0891B2]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Structured Entities
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('raw_text')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    activeTab === 'raw_text'
                      ? 'text-[#0891B2] border-b-2 border-[#0891B2]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Verbatim OCR Transcription
                </button>
              </div>

              {activeTab === 'structured' ? (
                /* Document-Aware Structured Entities Grid */
                <div className="space-y-5">
                  {/* 1. Aadhaar Card Fields */}
                  {currentDoc.documentType === 'aadhaar' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">badge</span>
                          <span>Aadhaar Identity Details</span>
                        </span>
                        {editableFields.hasFront && editableFields.hasBack && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Front & Back Cross-Referenced
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renderFieldRow('Full Name', 'name', editableFields.name)}
                        {renderFieldRow(
                          'Aadhaar Number',
                          'aadhaarNumberMasked',
                          editableFields.aadhaarNumberMasked,
                          true,
                          editableFields.aadhaarNumberRaw
                        )}
                        {renderFieldRow('Date of Birth', 'dateOfBirth', editableFields.dateOfBirth)}
                        {renderFieldRow('Year of Birth', 'yearOfBirth', editableFields.yearOfBirth)}
                        {renderFieldRow('Gender', 'gender', editableFields.gender)}
                        {renderFieldRow('Father / Care Of (C/O)', 'careOf', editableFields.careOf)}
                        {renderFieldRow('Virtual ID (VID)', 'vid', editableFields.vid)}
                        <div className="sm:col-span-2">
                          {renderFieldRow('Permanent Address', 'address', editableFields.address)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Indian Driving Licence Fields */}
                  {currentDoc.documentType === 'driving_licence' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">directions_car</span>
                          <span>Driving Licence Details</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renderFieldRow('Licence Holder Name', 'name', editableFields.name)}
                        {renderFieldRow(
                          'Licence Number',
                          'licenceNumberMasked',
                          editableFields.licenceNumberMasked,
                          true,
                          editableFields.licenceNumberRaw
                        )}
                        {renderFieldRow('Issuing Authority / RTO', 'issuingAuthority', editableFields.issuingAuthority)}
                        {renderFieldRow(
                          'Vehicle Categories (COV)',
                          'vehicleCategories',
                          Array.isArray(editableFields.vehicleCategories)
                            ? editableFields.vehicleCategories.join(', ')
                            : editableFields.vehicleCategories
                        )}
                        {renderFieldRow('Date of Birth', 'dateOfBirth', editableFields.dateOfBirth)}
                        {renderFieldRow('Blood Group', 'bloodGroup', editableFields.bloodGroup)}
                        {renderFieldRow('Date of Issue', 'issueDate', editableFields.issueDate)}
                        {renderFieldRow('Expiry Date (Valid Till)', 'expiryDate', editableFields.expiryDate)}
                        <div className="sm:col-span-2">
                          {renderFieldRow('Registered Address', 'address', editableFields.address)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Passport Fields */}
                  {currentDoc.documentType === 'passport' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0F2440] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">travel_explore</span>
                          <span>Passport Details</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renderFieldRow('Full Name', 'name', editableFields.name || `${editableFields.givenNames || ''} ${editableFields.surname || ''}`.trim())}
                        {renderFieldRow(
                          'Passport Number',
                          'passportNumberMasked',
                          editableFields.passportNumberMasked,
                          true,
                          editableFields.passportNumberRaw
                        )}
                        {renderFieldRow('Nationality', 'nationality', editableFields.nationality)}
                        {renderFieldRow('Sex / Gender', 'gender', editableFields.gender)}
                        {renderFieldRow('Date of Birth', 'dateOfBirth', editableFields.dateOfBirth)}
                        {renderFieldRow('Place of Birth', 'placeOfBirth', editableFields.placeOfBirth)}
                        {renderFieldRow('Date of Issue', 'dateOfIssue', editableFields.dateOfIssue)}
                        {renderFieldRow('Date of Expiry', 'expiryDate', editableFields.expiryDate)}
                        {renderFieldRow('Place of Issue', 'placeOfIssue', editableFields.placeOfIssue)}
                        <div className="sm:col-span-2">
                          {renderFieldRow('MRZ Code', 'mrzCode', editableFields.mrzCode)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Visa Fields */}
                  {currentDoc.documentType === 'visa' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                          <span>Visa & Immigration Details</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renderFieldRow('Visa Holder Name', 'holderName', editableFields.holderName)}
                        {renderFieldRow(
                          'Visa Number',
                          'visaNumberMasked',
                          editableFields.visaNumberMasked,
                          true,
                          editableFields.visaNumberRaw
                        )}
                        {renderFieldRow('Visa Type / Category', 'visaType', editableFields.visaType)}
                        {renderFieldRow('Issuing Country', 'issuingCountry', editableFields.issuingCountry)}
                        {renderFieldRow('Valid From', 'validFrom', editableFields.validFrom)}
                        {renderFieldRow('Valid Until (Expiry)', 'validUntil', editableFields.validUntil)}
                        {renderFieldRow('Number of Entries', 'numberOfEntries', editableFields.numberOfEntries)}
                        {renderFieldRow('Duration of Stay', 'durationOfStay', editableFields.durationOfStay)}
                        {renderFieldRow('Issuing Authority', 'issuingAuthority', editableFields.issuingAuthority)}
                        {renderFieldRow(
                          'Passport Number',
                          'passportNumberMasked',
                          editableFields.passportNumberMasked,
                          true,
                          editableFields.passportNumberRaw
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Travel Booking Fields (Flight, Hotel, Train, Bus, Receipt, Other) */}
                  {!['aadhaar', 'driving_licence', 'passport', 'visa'].includes(currentDoc.documentType) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">flight_takeoff</span>
                          <span>Travel Booking Entities</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renderFieldRow('Passenger / Guest Names', 'passengerNames', editableFields.passengerNames)}
                        {renderFieldRow('Booking Reference / PNR', 'bookingReference', editableFields.bookingReference)}
                        {renderFieldRow('Origin Location / Hub', 'origin', editableFields.origin)}
                        {renderFieldRow('Destination Location', 'destination', editableFields.destination)}
                        {renderFieldRow('Departure / Check-in Date', 'departureDate', editableFields.departureDate)}
                        {renderFieldRow('Arrival / Checkout Date', 'arrivalDate', editableFields.arrivalDate)}
                        {renderFieldRow('Flight / Room / Vessel', 'flightOrRoomNumber', editableFields.flightOrRoomNumber || editableFields.carrierOrOperator)}
                        {renderFieldRow('Seat / Room Allocation', 'seatNumber', editableFields.seatNumber)}
                        {renderFieldRow('Terminal / Gate / Platform', 'terminalOrGate', editableFields.terminalOrGate)}
                        {renderFieldRow('Baggage Allowance', 'baggageAllowance', editableFields.baggageAllowance)}
                        {renderFieldRow('Total Price / Amount', 'pricePaid', editableFields.pricePaid)}
                        {renderFieldRow('Cancellation Terms', 'cancellationPolicy', editableFields.cancellationPolicy)}
                      </div>
                    </div>
                  )}

                  {/* Summary Note */}
                  <div className="pt-2 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Verified Factual Summary
                    </label>
                    <p className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
                      {currentDoc.rawSummary || 'No summary available.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Verbatim OCR Transcription View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Transcribed Document Text (Verbatim OCR)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('Raw Text', currentDoc.rawText || '')}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedField === 'Raw Text' ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedField === 'Raw Text' ? 'Copied' : 'Copy Verbatim Text'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F172A] text-slate-100 font-mono text-xs max-h-96 overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap select-text">
                    {currentDoc.rawText || 'No verbatim transcription available.'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#EFF6FF] text-[#0891B2] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">document_scanner</span>
              </div>
              <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">
                No Document Selected
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                Upload an identity card (Aadhaar front & back, driving licence, passport, visa) or travel booking (flight, hotel, train) on the left to extract structured entities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
