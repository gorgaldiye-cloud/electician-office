export type AppRole = 'owner' | 'booking_manager' | 'technician' | 'content_editor';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show';

export type PricingType =
  | 'fixed'
  | 'starting_at'
  | 'estimate_required'
  | 'inspection_required';

export type UrgencyLevel = 'standard' | 'urgent' | 'emergency';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'other' | 'gateway';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type DataRequestType = 'correction' | 'deletion' | 'export';

export interface ServiceCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  shortDescriptionEn: string;
  shortDescriptionUr: string;
  descriptionEn: string;
  descriptionUr: string;
  pricingType: PricingType;
  basePrice: number | null; // in PKR
  estimatedDurationMinutes: number;
  bufferMinutes: number;
  isBookable: boolean;
  isActive: boolean;
  sortOrder: number;
  imagePath: string;
  iconName: string;
  includedEn: string[];
  includedUr: string[];
  processEn: string[];
  processUr: string[];
  seoTitleEn?: string;
  seoTitleUr?: string;
}

export interface ServiceArea {
  id: string;
  city: string;
  area: string;
  nameUr: string;
  postalCode?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  phoneE164: string;
  email?: string;
  preferredLanguage: 'en' | 'ur';
  createdVia: 'website' | 'staff' | 'import';
  createdAt: string;
}

export interface BookingAttachment {
  id: string;
  bookingId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  oldStatus: BookingStatus | null;
  newStatus: BookingStatus;
  changedBy: string; // name or role
  changedByType: 'staff' | 'customer' | 'system';
  note?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string; // e.g. ABC-261019-X9P2K3
  customerId: string;
  serviceId: string;
  serviceNameEn: string;
  serviceNameUr: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  problemDescription: string;
  addressLine: string;
  city: string;
  areaName: string;
  postalCode?: string;
  scheduledStart: string; // ISO string
  scheduledEnd: string; // ISO string
  status: BookingStatus;
  urgency: UrgencyLevel;
  estimatedAmount?: number;
  finalAmount?: number;
  customerNotes?: string;
  internalNotes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  language: 'en' | 'ur';
  source: 'website' | 'phone' | 'admin';
  privacyAcceptedAt: string;
  termsAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
  history: BookingStatusHistory[];
  attachments?: BookingAttachment[];
  attachmentsUploadWarning?: boolean;
}

export interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AppRole;
  isActive: boolean;
  avatarUrl?: string;
  specializationEn?: string;
  specializationUr?: string;
}

export interface StaffSchedule {
  id: string;
  technicianId: string;
  technicianName: string;
  weekday: number; // 0=Sunday, 1=Monday...
  startsAt: string;
  endsAt: string;
}

export interface AvailabilityBlock {
  id: string;
  technicianId?: string; // empty = entire company
  technicianName?: string;
  startsAt: string;
  endsAt: string;
  blockType: 'holiday' | 'leave' | 'break' | 'maintenance' | 'other';
  reason: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  itemType: 'labor' | 'material' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  recordedBy: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  bookingId?: string;
  bookingReference?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  itemType: 'labor' | 'material' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteNumber: string; // e.g. QUO-2026-0001
  bookingId?: string;
  bookingReference?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string;
  notes?: string;
  items: QuoteItem[];
  createdAt: string;
}

export interface Project {
  id: string;
  slug: string;
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  category: string;
  city: string;
  area: string;
  imagePath: string;
  publishedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleUr: string;
  excerptEn: string;
  excerptUr: string;
  bodyEn: string;
  bodyUr: string;
  coverImage: string;
  readTime: string;
  publishedAt: string;
  category: string;
}

export interface FAQ {
  id: string;
  category: 'general' | 'booking' | 'pricing' | 'emergency';
  questionEn: string;
  questionUr: string;
  answerEn: string;
  answerUr: string;
}

export interface Review {
  id: string;
  authorName: string;
  area: string;
  city: string;
  rating: number;
  commentEn: string;
  commentUr: string;
  date: string;
  isVerified: boolean;
  moderationStatus: ModerationStatus;
}

export interface CustomerInquiry {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'handled';
  createdAt: string;
}

export interface DataRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  requestType: DataRequestType;
  details: string;
  status: 'open' | 'approved' | 'completed' | 'rejected';
  createdAt: string;
}

export interface BusinessSettings {
  name: string;
  phone: string; // E.164 e.g. +923463902834
  phoneDisplay: string; // Display format: 0346 3902834
  whatsapp: string; // Click-to-chat number, empty = hidden until confirmed by owner
  phonePlaceholder?: string;
  phoneDial?: string;
  whatsappPlaceholder?: string;
  whatsappNumber?: string;
  email: string;
  addressEn: string;
  addressUr: string;
  city: string;
  operatingHoursEn: string;
  operatingHoursUr: string;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  cancellationWindowHours: number;
  emergencyUrgencyEnabled: boolean;
  taxRatePercent: number;
  pricingPublicDisplay: 'inspection_only';
  inspectionNoticeEn: string;
  inspectionNoticeUr: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: AppRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}
