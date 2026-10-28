import {
  Service,
  ServiceCategory,
  ServiceArea,
  Staff,
  StaffSchedule,
  AvailabilityBlock,
  Booking,
  BookingStatus,
  Invoice,
  Quote,
  QuoteStatus,
  Payment,
  Project,
  BlogPost,
  FAQ,
  Review,
  BusinessSettings,
  AuditLog,
  CustomerInquiry,
  DataRequest,
} from '../types';
import {
  initialBusinessSettings,
  initialCategories,
  initialServices,
  initialServiceAreas,
  initialStaff,
  initialStaffSchedules,
  initialAvailabilityBlocks,
  initialBookings,
  initialInvoices,
  initialQuotes,
  initialProjects,
  initialReviews,
  initialFAQs,
  initialBlogPosts,
  initialDataRequests,
  initialAuditLogs,
} from './mock/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Storage keys v2 (incorporates PRD v1.1 confirmed decisions)
const STORAGE_KEYS = {
  SETTINGS: 'abc_settings_v2',
  SERVICES: 'abc_services_v2',
  CATEGORIES: 'abc_categories_v2',
  AREAS: 'abc_areas_v2',
  STAFF: 'abc_staff_remote_v1',
  SCHEDULES: 'abc_schedules_remote_v1',
  BLOCKS: 'abc_blocks_remote_v1',
  BOOKINGS: 'abc_bookings_remote_v1',
  INVOICES: 'abc_invoices_remote_v1',
  QUOTES: 'abc_quotes_remote_v1',
  INQUIRIES: 'abc_inquiries_remote_v1',
  DATA_REQUESTS: 'abc_datareqs_remote_v1',
  AUDIT: 'abc_audit_remote_v1',
  REVIEWS: 'abc_reviews_remote_v1',
  PROJECTS: 'abc_projects_remote_v1',
  FAQS: 'abc_faqs_remote_v1',
  BLOG_POSTS: 'abc_blog_posts_remote_v1',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to persist to localStorage', e);
  }
}


type DatabaseRow = Record<string, any>;

function toCamelRecord<T>(row: DatabaseRow): T {
  const mapped: DatabaseRow = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase())] = value;
  }
  return mapped as T;
}

function dispatchCatalogUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('abc:data-updated'));
  }
}

export const repository = {
  // Settings
  getSettings(): BusinessSettings {
    return getStored<BusinessSettings>(STORAGE_KEYS.SETTINGS, initialBusinessSettings);
  },
  updateSettings(settings: Partial<BusinessSettings>, actorName = 'Admin'): BusinessSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    setStored(STORAGE_KEYS.SETTINGS, updated);
    this.addAuditLog(actorName, 'owner', 'SETTINGS_UPDATED', 'settings', 'settings', 'Updated business settings');
    return updated;
  },

  // Services
  getServices(): Service[] {
    const list = getStored<Service[]>(STORAGE_KEYS.SERVICES, initialServices);
    // Enforce PRD v1.1 Decision 3: public pricing display mode is inspection_only
    return list.map((s) => ({
      ...s,
      pricingType: 'inspection_required',
      basePrice: null,
    }));
  },
  getServiceBySlug(slug: string): Service | undefined {
    return this.getServices().find((s) => s.slug === slug);
  },
  getServiceById(id: string): Service | undefined {
    return this.getServices().find((s) => s.id === id);
  },
  saveService(service: Service, actorName = 'Admin'): Service {
    const services = this.getServices();
    const index = services.findIndex((s) => s.id === service.id);
    let updated: Service[];
    if (index >= 0) {
      updated = [...services];
      updated[index] = service;
    } else {
      updated = [service, ...services];
    }
    setStored(STORAGE_KEYS.SERVICES, updated);
    this.addAuditLog(actorName, 'content_editor', 'SERVICE_SAVED', 'service', service.id, `Saved service: ${service.nameEn}`);
    return service;
  },

  // Categories & Areas
  getCategories(): ServiceCategory[] {
    return getStored<ServiceCategory[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  },
  getServiceAreas(): ServiceArea[] {
    return getStored<ServiceArea[]>(STORAGE_KEYS.AREAS, initialServiceAreas);
  },

  // Staff & Schedules
  getStaff(): Staff[] {
    return getStored<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
  },
  getTechnicians(): Staff[] {
    return this.getStaff().filter((s) => s.role === 'technician' && s.isActive);
  },
  getStaffSchedules(): StaffSchedule[] {
    return getStored<StaffSchedule[]>(STORAGE_KEYS.SCHEDULES, initialStaffSchedules);
  },
  saveStaffSchedule(schedule: StaffSchedule, actorName = 'Admin'): StaffSchedule {
    const schedules = this.getStaffSchedules();
    const index = schedules.findIndex((s) => s.id === schedule.id);
    let updated: StaffSchedule[];
    if (index >= 0) {
      updated = [...schedules];
      updated[index] = schedule;
    } else {
      updated = [schedule, ...schedules];
    }
    setStored(STORAGE_KEYS.SCHEDULES, updated);
    this.addAuditLog(actorName, 'owner', 'SCHEDULE_UPDATED', 'staff_schedule', schedule.id, `Updated schedule for ${schedule.technicianName}`);
    return schedule;
  },
  getAvailabilityBlocks(): AvailabilityBlock[] {
    return getStored<AvailabilityBlock[]>(STORAGE_KEYS.BLOCKS, initialAvailabilityBlocks);
  },
  createAvailabilityBlock(block: Omit<AvailabilityBlock, 'id' | 'createdAt'>, actorName = 'Admin'): AvailabilityBlock {
    const blocks = this.getAvailabilityBlocks();
    const newBlock: AvailabilityBlock = {
      ...block,
      id: `blk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newBlock, ...blocks];
    setStored(STORAGE_KEYS.BLOCKS, updated);
    this.addAuditLog(actorName, 'booking_manager', 'BLOCK_CREATED', 'availability_block', newBlock.id, `Created ${block.blockType} block: ${block.reason}`);
    return newBlock;
  },
  deleteAvailabilityBlock(id: string, actorName = 'Admin'): boolean {
    const blocks = this.getAvailabilityBlocks();
    const filtered = blocks.filter((b) => b.id !== id);
    setStored(STORAGE_KEYS.BLOCKS, filtered);
    this.addAuditLog(actorName, 'booking_manager', 'BLOCK_DELETED', 'availability_block', id, 'Deleted availability block');
    return true;
  },

  // Bookings
  getBookings(): Booking[] {
    return getStored<Booking[]>(STORAGE_KEYS.BOOKINGS, isSupabaseConfigured ? [] : initialBookings);
  },
  getBookingByReference(reference: string): Booking | undefined {
    const clean = reference.trim().toUpperCase();
    return this.getBookings().find((b) => b.bookingReference.toUpperCase() === clean);
  },
  getBookingById(id: string): Booking | undefined {
    return this.getBookings().find((b) => b.id === id);
  },
  createBooking(data: Omit<Booking, 'id' | 'bookingReference' | 'status' | 'createdAt' | 'updatedAt' | 'history'>): Booking {
    const bookings = this.getBookings();
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const reference = `ABC-${dateStr}-${randomChars}`;

    const newBooking: Booking = {
      ...data,
      id: `b-${Date.now()}`,
      bookingReference: reference,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          bookingId: `b-${Date.now()}`,
          oldStatus: null,
          newStatus: 'pending',
          changedBy: data.customerName,
          changedByType: 'customer',
          note: 'Online booking request submitted',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const updated = [newBooking, ...bookings];
    setStored(STORAGE_KEYS.BOOKINGS, updated);
    this.addAuditLog(data.customerName, 'owner', 'BOOKING_CREATED', 'booking', newBooking.id, `New appointment created: ${reference}`);
    return newBooking;
  },
  updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    note?: string,
    actorName = 'Staff',
    actorType: 'staff' | 'customer' | 'system' = 'staff'
  ): Booking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const current = bookings[index];
    const oldStatus = current.status;

    const historyEntry = {
      id: `h-${Date.now()}`,
      bookingId,
      oldStatus,
      newStatus,
      changedBy: actorName,
      changedByType: actorType,
      note: note || `Status changed from ${oldStatus} to ${newStatus}`,
      createdAt: new Date().toISOString(),
    };

    const updatedBooking: Booking = {
      ...current,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      history: [historyEntry, ...current.history],
    };

    bookings[index] = updatedBooking;
    setStored(STORAGE_KEYS.BOOKINGS, bookings);
    this.addAuditLog(actorName, 'booking_manager', 'STATUS_CHANGE', 'booking', bookingId, `Status changed to ${newStatus}`);
    return updatedBooking;
  },
  assignTechnician(bookingId: string, technicianId: string, actorName = 'Zubair Ahmed'): Booking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const tech = this.getStaff().find((s) => s.id === technicianId);
    const updatedBooking: Booking = {
      ...bookings[index],
      assignedTechnicianId: technicianId,
      assignedTechnicianName: tech ? tech.fullName : undefined,
      updatedAt: new Date().toISOString(),
    };

    bookings[index] = updatedBooking;
    setStored(STORAGE_KEYS.BOOKINGS, bookings);
    this.addAuditLog(actorName, 'booking_manager', 'TECH_ASSIGNED', 'booking', bookingId, `Assigned to ${tech?.fullName}`);
    return updatedBooking;
  },
  addInternalNote(bookingId: string, note: string, actorName = 'Staff'): Booking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const current = bookings[index];
    const existing = current.internalNotes ? `${current.internalNotes}\n` : '';
    const updatedBooking: Booking = {
      ...current,
      internalNotes: `${existing}[${new Date().toLocaleTimeString()} ${actorName}]: ${note}`,
      updatedAt: new Date().toISOString(),
    };

    bookings[index] = updatedBooking;
    setStored(STORAGE_KEYS.BOOKINGS, bookings);
    return updatedBooking;
  },
  cancelBooking(bookingId: string, reason: string, cancelledBy = 'Customer'): Booking | null {
    return this.updateBookingStatus(bookingId, 'cancelled', `Cancelled: ${reason}`, cancelledBy, 'customer');
  },
  rescheduleBooking(bookingId: string, newStart: string, newEnd: string, actorName = 'Customer'): Booking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const current = bookings[index];
    const updatedBooking: Booking = {
      ...current,
      scheduledStart: newStart,
      scheduledEnd: newEnd,
      status: 'pending', // Per PRD §E4 reconfirmation rule
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          bookingId,
          oldStatus: current.status,
          newStatus: 'pending',
          changedBy: actorName,
          changedByType: 'customer',
          note: `Appointment rescheduled to ${new Date(newStart).toLocaleString()}`,
          createdAt: new Date().toISOString(),
        },
        ...current.history,
      ],
    };

    bookings[index] = updatedBooking;
    setStored(STORAGE_KEYS.BOOKINGS, bookings);
    return updatedBooking;
  },

  // Slot Availability Generator (Asia/Karachi timezone, 09:00 - 18:00)
  getAvailableSlots(dateStr: string, _serviceId?: string): { time: string; start: string; end: string; available: boolean }[] {
    const candidateTimes = [
      { time: '09:00 AM - 10:30 AM', startH: 9, startM: 0, endH: 10, endM: 30 },
      { time: '10:30 AM - 12:00 PM', startH: 10, startM: 30, endH: 12, endM: 0 },
      { time: '12:00 PM - 01:30 PM', startH: 12, startM: 0, endH: 13, endM: 30 },
      { time: '02:00 PM - 03:30 PM', startH: 14, startM: 0, endH: 15, endM: 30 },
      { time: '03:30 PM - 05:00 PM', startH: 15, startM: 30, endH: 17, endM: 0 },
      { time: '05:00 PM - 06:30 PM', startH: 17, startM: 0, endH: 18, endM: 30 },
    ];

    const bookings = this.getBookings().filter((b) => b.status === 'confirmed' || b.status === 'pending');
    const techniciansCount = this.getTechnicians().length || 2;

    return candidateTimes.map((cand) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const start = new Date(Date.UTC(year, month - 1, day, cand.startH - 5, cand.startM)).toISOString(); // Convert PKT (UTC+5) to UTC
      const end = new Date(Date.UTC(year, month - 1, day, cand.endH - 5, cand.endM)).toISOString();

      // Check how many bookings overlap with this slot
      const overlapping = bookings.filter((b) => {
        const bStart = new Date(b.scheduledStart).getTime();
        const bEnd = new Date(b.scheduledEnd).getTime();
        const cStart = new Date(start).getTime();
        const cEnd = new Date(end).getTime();
        return (cStart >= bStart && cStart < bEnd) || (cEnd > bStart && cEnd <= bEnd);
      });

      const available = overlapping.length < techniciansCount;
      return {
        time: cand.time,
        start,
        end,
        available,
      };
    });
  },

  // Quotes
  getQuotes(): Quote[] {
    return getStored<Quote[]>(STORAGE_KEYS.QUOTES, initialQuotes);
  },
  getQuoteById(id: string): Quote | undefined {
    return this.getQuotes().find((q) => q.id === id);
  },
  createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'quoteNumber'>, actorName = 'Admin'): Quote {
    const quotes = this.getQuotes();
    const seq = String(quotes.length + 1).padStart(4, '0');
    const currentYear = new Date().getFullYear();
    const quoteNumber = `QUO-${currentYear}-${seq}`;

    const newQuote: Quote = {
      ...quote,
      id: `quo-${Date.now()}`,
      quoteNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newQuote, ...quotes];
    setStored(STORAGE_KEYS.QUOTES, updated);
    this.addAuditLog(actorName, 'booking_manager', 'QUOTE_CREATED', 'quote', newQuote.id, `Created quotation ${quoteNumber} for PKR ${newQuote.total}`);
    return newQuote;
  },
  updateQuoteStatus(quoteId: string, status: QuoteStatus, actorName = 'Admin'): Quote | null {
    const quotes = this.getQuotes();
    const index = quotes.findIndex((q) => q.id === quoteId);
    if (index === -1) return null;

    const updatedQuote: Quote = {
      ...quotes[index],
      status,
    };
    quotes[index] = updatedQuote;
    setStored(STORAGE_KEYS.QUOTES, quotes);
    this.addAuditLog(actorName, 'booking_manager', 'QUOTE_STATUS', 'quote', quoteId, `Quote status changed to ${status}`);
    return updatedQuote;
  },
  convertQuoteToInvoice(quoteId: string, actorName = 'Admin'): Invoice | null {
    const quote = this.getQuoteById(quoteId);
    if (!quote) return null;

    // Update quote status to approved
    this.updateQuoteStatus(quoteId, 'approved', actorName);

    // Create Invoice from Quote
    const invoice = this.createInvoice(
      {
        bookingId: quote.bookingId,
        bookingReference: quote.bookingReference,
        customerId: quote.customerId,
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        status: 'issued',
        subtotal: quote.subtotal,
        discount: quote.discount,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        amountPaid: 0,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        notes: `Converted from Quote ${quote.quoteNumber}. ${quote.notes || ''}`,
        items: quote.items.map((it) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemType: it.itemType,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
        payments: [],
      },
      actorName
    );

    return invoice;
  },

  // Invoices
  getInvoices(): Invoice[] {
    return getStored<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
  },
  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  },
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>, actorName = 'Admin'): Invoice {
    const invoices = this.getInvoices();
    const seq = String(invoices.length + 1).padStart(4, '0');
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${seq}`;

    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newInvoice, ...invoices];
    setStored(STORAGE_KEYS.INVOICES, updated);
    this.addAuditLog(actorName, 'booking_manager', 'INVOICE_CREATED', 'invoice', newInvoice.id, `Created invoice ${invoiceNumber} for PKR ${newInvoice.total}`);
    return newInvoice;
  },
  recordPayment(invoiceId: string, payment: Omit<Payment, 'id' | 'paidAt'>, actorName = 'Staff'): Invoice | null {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) return null;

    const current = invoices[index];
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`,
      paidAt: new Date().toISOString(),
    };

    const newAmountPaid = current.amountPaid + payment.amount;
    const isPaid = newAmountPaid >= current.total;

    const updatedInvoice: Invoice = {
      ...current,
      amountPaid: newAmountPaid,
      status: isPaid ? 'paid' : 'partially_paid',
      payments: [...current.payments, newPayment],
    };

    invoices[index] = updatedInvoice;
    setStored(STORAGE_KEYS.INVOICES, invoices);
    this.addAuditLog(actorName, 'booking_manager', 'PAYMENT_RECORDED', 'invoice', invoiceId, `Recorded PKR ${payment.amount} via ${payment.method}`);
    return updatedInvoice;
  },

  // Inquiries
  getInquiries(): CustomerInquiry[] {
    return getStored<CustomerInquiry[]>(STORAGE_KEYS.INQUIRIES, isSupabaseConfigured ? [] : initialInquiries);
  },
  createInquiry(inquiry: Omit<CustomerInquiry, 'id' | 'createdAt' | 'status'>): CustomerInquiry {
    const inquiries = this.getInquiries();
    const newInq: CustomerInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.INQUIRIES, [newInq, ...inquiries]);
    return newInq;
  },
  updateInquiryStatus(id: string, status: 'new' | 'in_progress' | 'handled', actorName = 'Admin'): CustomerInquiry | null {
    const inquiries = this.getInquiries();
    const index = inquiries.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updated: CustomerInquiry = {
      ...inquiries[index],
      status,
    };
    inquiries[index] = updated;
    setStored(STORAGE_KEYS.INQUIRIES, inquiries);
    this.addAuditLog(actorName, 'booking_manager', 'INQUIRY_STATUS', 'customer_inquiry', id, `Updated inquiry to ${status}`);
    return updated;
  },

  // Public content is cached from Supabase after app startup. When a configured database
  // returns an empty table, keep the real empty state rather than showing demo records.
  getProjects(): Project[] {
    return getStored<Project[]>(STORAGE_KEYS.PROJECTS, isSupabaseConfigured ? [] : initialProjects);
  },
  getFAQs(): FAQ[] {
    return getStored<FAQ[]>(STORAGE_KEYS.FAQS, isSupabaseConfigured ? [] : initialFAQs);
  },
  getReviews(includeUnmoderated = false): Review[] {
    const revs = getStored<Review[]>(STORAGE_KEYS.REVIEWS, isSupabaseConfigured ? [] : initialReviews);
    if (includeUnmoderated) return revs;
    return revs.filter((r) => r.moderationStatus === 'approved');
  },
  addReview(review: Omit<Review, 'id' | 'date' | 'isVerified' | 'moderationStatus'>): Review {
    const reviews = getStored<Review[]>(STORAGE_KEYS.REVIEWS, isSupabaseConfigured ? [] : initialReviews);
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      isVerified: false,
      moderationStatus: 'pending',
    };
    setStored(STORAGE_KEYS.REVIEWS, [newReview, ...reviews]);
    return newReview;
  },
  moderateReview(reviewId: string, status: 'approved' | 'rejected', actorName = 'Admin'): boolean {
    const reviews = getStored<Review[]>(STORAGE_KEYS.REVIEWS, initialReviews);
    const index = reviews.findIndex((r) => r.id === reviewId);
    if (index === -1) return false;

    reviews[index].moderationStatus = status;
    setStored(STORAGE_KEYS.REVIEWS, reviews);
    this.addAuditLog(actorName, 'content_editor', 'REVIEW_MODERATED', 'review', reviewId, `Review marked as ${status}`);
    return true;
  },
  getBlogPosts(): BlogPost[] {
    return getStored<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS, isSupabaseConfigured ? [] : initialBlogPosts);
  },

  // Data Requests (Privacy & GDPR compliance)
  getDataRequests(): DataRequest[] {
    return getStored<DataRequest[]>(STORAGE_KEYS.DATA_REQUESTS, initialDataRequests);
  },
  createDataRequest(req: Omit<DataRequest, 'id' | 'createdAt' | 'status'>, actorName = 'Customer'): DataRequest {
    const reqs = this.getDataRequests();
    const newReq: DataRequest = {
      ...req,
      id: `dreq-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.DATA_REQUESTS, [newReq, ...reqs]);
    this.addAuditLog(actorName, 'owner', 'DATA_REQUEST_FILED', 'data_request', newReq.id, `Filed ${req.requestType} request`);
    return newReq;
  },
  updateDataRequestStatus(id: string, status: 'open' | 'approved' | 'completed' | 'rejected', actorName = 'Owner'): boolean {
    const reqs = this.getDataRequests();
    const index = reqs.findIndex((r) => r.id === id);
    if (index === -1) return false;

    reqs[index].status = status;
    setStored(STORAGE_KEYS.DATA_REQUESTS, reqs);
    this.addAuditLog(actorName, 'owner', 'DATA_REQUEST_STATUS', 'data_request', id, `Updated to ${status}`);
    return true;
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT, initialAuditLogs);
  },
  addAuditLog(actorName: string, actorRole: any, action: string, entityType: string, entityId: string, details: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.AUDIT, [newLog, ...logs.slice(0, 100)]);
  },


  // Load only publicly readable catalog rows. Each result has its own error handling so a
  // failed optional section does not prevent other public content from refreshing.
  async initializeRemoteCatalog(): Promise<void> {
    if (!supabase) return;

    try {
      const [categories, services, areas, settings, faqs, blogs, projects, reviews] = await Promise.all([
        supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('service_areas').select('*').eq('is_active', true).order('city').order('area'),
        supabase.from('business_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('faqs').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false }),
        supabase.from('projects').select('*').eq('is_published', true).order('published_at', { ascending: false }),
        supabase.from('reviews').select('*').eq('moderation_status', 'approved').order('review_date', { ascending: false }),
      ]);

      const persistRows = <T,>(key: string, response: { data: any[] | null; error: any }): void => {
        if (!response.error && Array.isArray(response.data)) {
          setStored<T[]>(key, response.data.map((row) => toCamelRecord<T>(row)));
        } else if (response.error) {
          console.error('Unable to refresh public catalog section:', response.error.message);
        }
      };

      persistRows<ServiceCategory>(STORAGE_KEYS.CATEGORIES, categories);
      persistRows<Service>(STORAGE_KEYS.SERVICES, services);
      persistRows<ServiceArea>(STORAGE_KEYS.AREAS, areas);
      persistRows<FAQ>(STORAGE_KEYS.FAQS, faqs);
      persistRows<BlogPost>(STORAGE_KEYS.BLOG_POSTS, blogs);
      persistRows<Project>(STORAGE_KEYS.PROJECTS, projects);

      if (!reviews.error && Array.isArray(reviews.data)) {
        setStored<Review[]>(STORAGE_KEYS.REVIEWS, reviews.data.map((row) => ({
          ...toCamelRecord<Review>(row),
          date: row.review_date,
          isVerified: Boolean(row.is_verified),
          moderationStatus: row.moderation_status,
        })));
      } else if (reviews.error) {
        console.error('Unable to refresh public reviews:', reviews.error.message);
      }

      if (!settings.error && settings.data) {
        setStored<BusinessSettings>(STORAGE_KEYS.SETTINGS, toCamelRecord<BusinessSettings>(settings.data));
      } else if (settings.error) {
        console.error('Unable to refresh business settings:', settings.error.message);
      }
      dispatchCatalogUpdated();
    } catch (error) {
      console.error('Supabase public catalog refresh failed:', error);
    }
  },

  // Store website bookings using the database's website-only INSERT policy. Anonymous clients
  // intentionally cannot SELECT the resulting private customer or booking rows.
  async createOnlineBooking(
    data: Omit<Booking, 'id' | 'customerId' | 'bookingReference' | 'status' | 'createdAt' | 'updatedAt' | 'history' | 'attachments'>
  ): Promise<Booking> {
    if (!supabase) throw new Error('Online booking is temporarily unavailable. Please call our service desk.');

    const customerId = crypto.randomUUID();
    const bookingId = crypto.randomUUID();
    const now = new Date().toISOString();
    const datePart = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()).replace(/\D/g, '');
    const reference = `ABC-${datePart}-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    const { error: customerError } = await supabase.from('customers').insert({
      id: customerId,
      full_name: data.customerName,
      phone_e164: data.customerPhone,
      email: data.customerEmail || null,
      preferred_language: data.language,
      created_via: 'website',
    });
    if (customerError) {
      console.error('Supabase customer insert failed:', customerError.message);
      throw new Error('We could not save your booking details. Please try again or call our service desk.');
    }

    const { error: bookingError } = await supabase.from('bookings').insert({
      id: bookingId,
      booking_reference: reference,
      customer_id: customerId,
      service_id: data.serviceId,
      service_name_en: data.serviceNameEn,
      service_name_ur: data.serviceNameUr,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      problem_description: data.problemDescription,
      address_line: data.addressLine,
      city: data.city,
      area_name: data.areaName,
      postal_code: data.postalCode || null,
      scheduled_start: data.scheduledStart,
      scheduled_end: data.scheduledEnd,
      status: 'pending',
      urgency: data.urgency,
      estimated_amount: data.estimatedAmount ?? null,
      customer_notes: data.customerNotes || null,
      language: data.language,
      source: 'website',
      privacy_accepted_at: data.privacyAcceptedAt,
      terms_accepted_at: data.termsAcceptedAt,
    });
    if (bookingError) {
      console.error('Supabase booking insert failed:', bookingError.message);
      throw new Error('We could not confirm the booking in our system. Please contact our service desk before submitting again.');
    }

    const booking: Booking = {
      ...data,
      id: bookingId,
      customerId,
      bookingReference: reference,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      history: [{
        id: crypto.randomUUID(),
        bookingId,
        oldStatus: null,
        newStatus: 'pending',
        changedBy: data.customerName,
        changedByType: 'customer',
        note: 'Website booking request submitted',
        createdAt: now,
      }],
    };
    setStored<Booking[]>(STORAGE_KEYS.BOOKINGS, [booking, ...this.getBookings()]);
    dispatchCatalogUpdated();
    return booking;
  },

  async createOnlineInquiry(
    inquiry: Omit<CustomerInquiry, 'id' | 'createdAt' | 'status'>
  ): Promise<CustomerInquiry> {
    if (!supabase) throw new Error('The contact form is temporarily unavailable. Please call our service desk.');

    const record: CustomerInquiry = {
      ...inquiry,
      id: crypto.randomUUID(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('customer_inquiries').insert({
      id: record.id,
      full_name: record.fullName,
      phone: record.phone,
      email: record.email || null,
      subject: record.subject || 'General Inquiry',
      message: record.message,
      status: 'new',
    });
    if (error) {
      console.error('Supabase inquiry insert failed:', error.message);
      throw new Error('Your message could not be saved right now. Please try again or call our service desk.');
    }

    setStored<CustomerInquiry[]>(STORAGE_KEYS.INQUIRIES, [record, ...this.getInquiries()]);
    dispatchCatalogUpdated();
    return record;
  },

  // CSV Exporters for P1 audit & accounting
  exportBookingsCsv(): string {
    const bookings = this.getBookings();
    const headers = ['Reference', 'Customer Name', 'Phone', 'Service', 'City', 'Area', 'Scheduled Start', 'Status', 'Urgency', 'Estimated PKR'];
    const rows = bookings.map((b) => [
      b.bookingReference,
      `"${b.customerName.replace(/"/g, '""')}"`,
      b.customerPhone,
      `"${b.serviceNameEn.replace(/"/g, '""')}"`,
      b.city,
      `"${b.areaName.replace(/"/g, '""')}"`,
      b.scheduledStart,
      b.status,
      b.urgency,
      b.estimatedAmount || 0,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
  exportInvoicesCsv(): string {
    const invoices = this.getInvoices();
    const headers = ['Invoice Number', 'Customer Name', 'Phone', 'Issue Date', 'Total PKR', 'Amount Paid PKR', 'Status'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerPhone,
      inv.issueDate,
      inv.total,
      inv.amountPaid,
      inv.status,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
