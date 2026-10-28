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
  ADMIN_SERVICES: 'abc_admin_services_remote_v1',
  ADMIN_REVIEWS: 'abc_admin_reviews_remote_v1',
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

async function recordRemoteAuditLog(
  actorName: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): Promise<void> {
  if (!supabase) return;
  try {
    const { data: userResult } = await supabase.auth.getUser();
    const userId = userResult.user?.id;
    if (!userId) return;

    const { data: staffProfile, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id, role')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    if (staffError || !staffProfile) return;

    const { error } = await supabase.from('audit_logs').insert({
      actor_staff_id: staffProfile.id,
      actor_name: actorName,
      actor_role: staffProfile.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details.slice(0, 2000),
    });
    if (error) console.warn('Remote audit log could not be saved:', error.message);
  } catch (error) {
    console.warn('Remote audit logging failed:', error);
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
  getAdminServices(): Service[] {
    const list = getStored<Service[]>(
      STORAGE_KEYS.ADMIN_SERVICES,
      isSupabaseConfigured ? this.getServices() : initialServices
    );
    return list.map((service) => ({
      ...service,
      pricingType: 'inspection_required',
      basePrice: null,
    }));
  },
  getServices(): Service[] {
    const list = getStored<Service[]>(STORAGE_KEYS.SERVICES, isSupabaseConfigured ? [] : initialServices);
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
  async updateOnlineBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    note?: string,
    actorName = 'Staff'
  ): Promise<Booking> {
    if (!supabase) {
      const local = this.updateBookingStatus(bookingId, newStatus, note, actorName, 'staff');
      if (!local) throw new Error('Booking not found.');
      return local;
    }

    const { data, error } = await supabase.rpc('update_staff_booking_status', {
      p_booking_id: bookingId,
      p_new_status: newStatus,
      p_note: note || `Status changed to ${newStatus}`,
    });
    if (error || !data) {
      console.error('Staff booking status update failed:', error?.message);
      throw new Error(error?.message?.includes('NOT_AUTHORIZED')
        ? 'Your staff role cannot make this booking change.'
        : 'Booking status could not be updated. Refresh and try again.');
    }

    await recordRemoteAuditLog(actorName, 'BOOKING_STATUS_CHANGED', 'booking', bookingId, note || `Status changed to ${newStatus}`);
    await this.initializeRemoteAdminData();
    return data as Booking;
  },

  async assignOnlineTechnician(
    bookingId: string,
    technicianId: string,
    actorName = 'Staff'
  ): Promise<Booking> {
    if (!supabase) {
      const local = this.assignTechnician(bookingId, technicianId, actorName);
      if (!local) throw new Error('Booking not found.');
      return local;
    }
    const technician = this.getStaff().find((staff) => staff.id === technicianId);
    if (!technician) throw new Error('Select an active technician.');

    const { data, error } = await supabase
      .from('bookings')
      .update({
        assigned_technician_id: technicianId,
        assigned_technician_name: technician.fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      console.error('Technician assignment failed:', error?.message);
      throw new Error('Technician could not be assigned. Check your staff role and try again.');
    }
    await recordRemoteAuditLog(actorName, 'TECHNICIAN_ASSIGNED', 'booking', bookingId, `Assigned to ${technician.fullName}`);
    await this.initializeRemoteAdminData();
    const updated = this.getBookings().find((booking) => booking.id === bookingId);
    return updated || toCamelRecord<Booking>(data);
  },

  async addOnlineInternalNote(
    bookingId: string,
    note: string,
    actorName = 'Staff'
  ): Promise<Booking> {
    if (!supabase) {
      const local = this.addInternalNote(bookingId, note, actorName);
      if (!local) throw new Error('Booking not found.');
      return local;
    }
    const current = this.getBookings().find((booking) => booking.id === bookingId);
    if (!current) throw new Error('Booking not found. Refresh the booking list and try again.');
    const existing = current.internalNotes ? `${current.internalNotes}\n` : '';
    const internalNotes = `${existing}[${new Date().toISOString()} ${actorName}]: ${note.trim()}`;
    const { data, error } = await supabase
      .from('bookings')
      .update({ internal_notes: internalNotes, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      console.error('Internal booking note failed:', error?.message);
      throw new Error('The internal note could not be saved.');
    }
    await recordRemoteAuditLog(actorName, 'BOOKING_NOTE_ADDED', 'booking', bookingId, note.trim());
    await this.initializeRemoteAdminData();
    const updated = this.getBookings().find((booking) => booking.id === bookingId);
    return updated || toCamelRecord<Booking>(data);
  },

  async updateOnlineInquiryStatus(
    id: string,
    status: 'new' | 'in_progress' | 'handled',
    actorName = 'Staff'
  ): Promise<CustomerInquiry> {
    if (!supabase) {
      const local = this.updateInquiryStatus(id, status, actorName);
      if (!local) throw new Error('Inquiry not found.');
      return local;
    }
    const { data, error } = await supabase
      .from('customer_inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      console.error('Inquiry status update failed:', error?.message);
      throw new Error('The inquiry status could not be saved.');
    }
    await recordRemoteAuditLog(actorName, 'INQUIRY_STATUS_CHANGED', 'customer_inquiry', id, `Inquiry set to ${status}`);
    await this.initializeRemoteAdminData();
    return toCamelRecord<CustomerInquiry>(data);
  },

  async updateOnlineBusinessSettings(
    settings: Partial<BusinessSettings>,
    actorName = 'Owner'
  ): Promise<BusinessSettings> {
    if (!supabase) return this.updateSettings(settings, actorName);
    const columnMap: Record<string, string> = {
      name: 'name',
      phone: 'phone',
      phoneDisplay: 'phone_display',
      whatsapp: 'whatsapp',
      phonePlaceholder: 'phone_placeholder',
      phoneDial: 'phone_dial',
      whatsappPlaceholder: 'whatsapp_placeholder',
      whatsappNumber: 'whatsapp_number',
      email: 'email',
      addressEn: 'address_en',
      addressUr: 'address_ur',
      city: 'city',
      operatingHoursEn: 'operating_hours_en',
      operatingHoursUr: 'operating_hours_ur',
      slotIntervalMinutes: 'slot_interval_minutes',
      bufferMinutes: 'buffer_minutes',
      minNoticeHours: 'min_notice_hours',
      maxAdvanceDays: 'max_advance_days',
      cancellationWindowHours: 'cancellation_window_hours',
      emergencyUrgencyEnabled: 'emergency_urgency_enabled',
      taxRatePercent: 'tax_rate_percent',
      pricingPublicDisplay: 'pricing_public_display',
      inspectionNoticeEn: 'inspection_notice_en',
      inspectionNoticeUr: 'inspection_notice_ur',
    };
    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (Object.prototype.hasOwnProperty.call(columnMap, key)) payload[columnMap[key]] = value;
    }
    if (Object.keys(payload).length === 0) return this.getSettings();

    const { data, error } = await supabase
      .from('business_settings')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      console.error('Business settings update failed:', error?.message);
      throw new Error('Business settings could not be saved. Only the owner role can change them.');
    }
    const updated = toCamelRecord<BusinessSettings>(data);
    setStored<BusinessSettings>(STORAGE_KEYS.SETTINGS, updated);
    await recordRemoteAuditLog(actorName, 'SETTINGS_UPDATED', 'settings', 'business_settings', 'Updated public business configuration');
    await this.initializeRemoteCatalog();
    return updated;
  },

  async updateOnlineDataRequestStatus(
    id: string,
    status: 'open' | 'approved' | 'completed' | 'rejected',
    actorName = 'Owner'
  ): Promise<boolean> {
    if (!supabase) return this.updateDataRequestStatus(id, status, actorName);
    const { error } = await supabase
      .from('data_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Data request status update failed:', error.message);
      throw new Error('The privacy request status could not be saved.');
    }
    await recordRemoteAuditLog(actorName, 'DATA_REQUEST_STATUS', 'data_request', id, `Updated to ${status}`);
    await this.initializeRemoteAdminData();
    return true;
  },

  async createOnlineAvailabilityBlock(
    block: Omit<AvailabilityBlock, 'id' | 'createdAt'>,
    actorName = 'Owner'
  ): Promise<AvailabilityBlock> {
    if (!supabase) return this.createAvailabilityBlock(block, actorName);
    const { data, error } = await supabase.from('availability_blocks').insert({
      technician_id: block.technicianId || null,
      starts_at: block.startsAt,
      ends_at: block.endsAt,
      block_type: block.blockType,
      reason: block.reason.trim(),
    }).select('*').single();
    if (error || !data) {
      console.error('Availability block creation failed:', error?.message);
      throw new Error('The time-off block could not be saved. The owner role is required.');
    }
    await recordRemoteAuditLog(actorName, 'AVAILABILITY_BLOCK_CREATED', 'availability_block', data.id, block.reason);
    await this.initializeRemoteAdminData();
    return toCamelRecord<AvailabilityBlock>(data);
  },

  async deleteOnlineAvailabilityBlock(id: string, actorName = 'Owner'): Promise<boolean> {
    if (!supabase) return this.deleteAvailabilityBlock(id, actorName);
    const { error } = await supabase.from('availability_blocks').delete().eq('id', id);
    if (error) {
      console.error('Availability block deletion failed:', error.message);
      throw new Error('The time-off block could not be deleted. The owner role is required.');
    }
    await recordRemoteAuditLog(actorName, 'AVAILABILITY_BLOCK_DELETED', 'availability_block', id, 'Deleted availability block');
    await this.initializeRemoteAdminData();
    return true;
  },

  async saveOnlineService(service: Service, actorName = 'Admin'): Promise<Service> {
    if (!supabase) {
      return this.saveService(service, actorName);
    }

    const payload = {
      id: service.id,
      category_id: service.categoryId,
      slug: service.slug,
      name_en: service.nameEn,
      name_ur: service.nameUr,
      short_description_en: service.shortDescriptionEn,
      short_description_ur: service.shortDescriptionUr,
      description_en: service.descriptionEn,
      description_ur: service.descriptionUr,
      pricing_type: 'inspection_required',
      base_price: null,
      estimated_duration_minutes: service.estimatedDurationMinutes,
      buffer_minutes: service.bufferMinutes,
      is_bookable: service.isBookable,
      is_active: service.isActive,
      sort_order: service.sortOrder,
      image_path: service.imagePath,
      icon_name: service.iconName,
      included_en: service.includedEn,
      included_ur: service.includedUr,
      process_en: service.processEn,
      process_ur: service.processUr,
      seo_title_en: service.seoTitleEn || null,
      seo_title_ur: service.seoTitleUr || null,
    };

    const { data: existing, error: updateError } = await supabase
      .from('services')
      .update(payload)
      .eq('id', service.id)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Service update failed:', updateError.message);
      throw new Error('Service could not be saved. Check your staff role and try again.');
    }

    if (!existing) {
      const { error: insertError } = await supabase.from('services').insert(payload);
      if (insertError) {
        console.error('Service creation failed:', insertError.message);
        throw new Error('Service could not be created. Check its category and slug, then try again.');
      }
    }

    await Promise.all([
      this.initializeRemoteCatalog(),
      this.initializeRemoteAdminData(),
    ]);
    await recordRemoteAuditLog(actorName, 'SERVICE_SAVED', 'service', service.id, `Saved service: ${service.nameEn}`);
    return service;
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
    return getStored<ServiceCategory[]>(STORAGE_KEYS.CATEGORIES, isSupabaseConfigured ? [] : initialCategories);
  },
  getServiceAreas(): ServiceArea[] {
    return getStored<ServiceArea[]>(STORAGE_KEYS.AREAS, isSupabaseConfigured ? [] : initialServiceAreas);
  },

  // Staff & Schedules
  getStaff(): Staff[] {
    return getStored<Staff[]>(STORAGE_KEYS.STAFF, isSupabaseConfigured ? [] : initialStaff);
  },
  getTechnicians(): Staff[] {
    return this.getStaff().filter((s) => s.role === 'technician' && s.isActive);
  },
  getStaffSchedules(): StaffSchedule[] {
    return getStored<StaffSchedule[]>(STORAGE_KEYS.SCHEDULES, isSupabaseConfigured ? [] : initialStaffSchedules);
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
    return getStored<AvailabilityBlock[]>(STORAGE_KEYS.BLOCKS, isSupabaseConfigured ? [] : initialAvailabilityBlocks);
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
    return getStored<Quote[]>(STORAGE_KEYS.QUOTES, isSupabaseConfigured ? [] : initialQuotes);
  },
  getQuoteById(id: string): Quote | undefined {
    return this.getQuotes().find((q) => q.id === id);
  },
  async createOnlineQuote(
    quote: Omit<Quote, 'id' | 'createdAt' | 'quoteNumber'>,
    actorName = 'Admin'
  ): Promise<Quote> {
    if (!supabase) return this.createQuote(quote, actorName);

    const { data, error } = await supabase.rpc('create_staff_quote', {
      p_customer_name: quote.customerName,
      p_customer_phone: quote.customerPhone,
      p_customer_address: quote.customerAddress,
      p_status: quote.status,
      p_valid_until: quote.validUntil,
      p_notes: quote.notes || null,
      p_items: quote.items.map((item) => ({
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      p_booking_id: quote.bookingId || null,
      p_booking_reference: quote.bookingReference || null,
      p_discount: quote.discount || 0,
      p_tax_rate: quote.taxRate || 0,
    });
    if (error || !data) {
      console.error('Quote creation failed:', error?.message);
      throw new Error(error?.message?.includes('NOT_AUTHORIZED')
        ? 'Your staff role cannot create quotations.'
        : 'The quotation could not be saved. Check the customer details and line items.');
    }
    await recordRemoteAuditLog(actorName, 'QUOTE_CREATED', 'quote', String(data.id), `Created quotation ${data.quoteNumber} for PKR ${data.total}`);
    await this.initializeRemoteAdminData();
    return this.getQuotes().find((item) => item.id === data.id) || toCamelRecord<Quote>(data);
  },

  async convertOnlineQuoteToInvoice(quoteId: string, actorName = 'Admin'): Promise<Invoice> {
    if (!supabase) {
      const invoice = this.convertQuoteToInvoice(quoteId, actorName);
      if (!invoice) throw new Error('Quotation was not found.');
      return invoice;
    }
    const { data, error } = await supabase.rpc('convert_staff_quote_to_invoice', {
      p_quote_id: quoteId,
    });
    if (error || !data) {
      console.error('Quote conversion failed:', error?.message);
      throw new Error(error?.message?.includes('QUOTE_NOT_CONVERTIBLE')
        ? 'This quotation has already been approved or can no longer be converted.'
        : 'The quotation could not be converted to an invoice.');
    }
    await recordRemoteAuditLog(actorName, 'QUOTE_CONVERTED_TO_INVOICE', 'quote', quoteId, `Created invoice ${data.invoiceNumber}`);
    await this.initializeRemoteAdminData();
    return this.getInvoices().find((item) => item.id === data.id) || toCamelRecord<Invoice>({ ...data, total: data.total ?? this.getQuotes().find((item) => item.id === quoteId)?.total ?? 0 });
  },

  async createOnlineInvoice(
    invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>,
    actorName = 'Admin'
  ): Promise<Invoice> {
    if (!supabase) return this.createInvoice(invoice, actorName);

    const { data, error } = await supabase.rpc('create_staff_invoice', {
      p_customer_name: invoice.customerName,
      p_customer_phone: invoice.customerPhone,
      p_customer_address: invoice.customerAddress,
      p_status: invoice.status,
      p_issue_date: invoice.issueDate,
      p_due_date: invoice.dueDate,
      p_notes: invoice.notes || null,
      p_items: invoice.items.map((item) => ({
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      p_booking_id: invoice.bookingId || null,
      p_booking_reference: invoice.bookingReference || null,
      p_discount: invoice.discount || 0,
      p_tax_rate: invoice.taxRate || 0,
    });
    if (error || !data) {
      console.error('Invoice creation failed:', error?.message);
      throw new Error(error?.message?.includes('NOT_AUTHORIZED')
        ? 'Your staff role cannot create invoices.'
        : 'The invoice could not be saved. Check the customer details and line items.');
    }
    await recordRemoteAuditLog(actorName, 'INVOICE_CREATED', 'invoice', String(data.id), `Created invoice ${data.invoiceNumber} for PKR ${data.total}`);
    await this.initializeRemoteAdminData();
    return this.getInvoices().find((item) => item.id === data.id) || toCamelRecord<Invoice>(data);
  },

  async recordOnlinePayment(
    invoiceId: string,
    payment: Omit<Payment, 'id' | 'paidAt'>,
    actorName = 'Owner'
  ): Promise<Invoice> {
    if (!supabase) {
      const invoice = this.recordPayment(invoiceId, payment, actorName);
      if (!invoice) throw new Error('Invoice not found.');
      return invoice;
    }
    const { data, error } = await supabase.rpc('record_staff_payment', {
      p_invoice_id: invoiceId,
      p_amount: payment.amount,
      p_method: payment.method,
      p_notes: payment.notes || null,
    });
    if (error || !data) {
      console.error('Payment recording failed:', error?.message);
      throw new Error(error?.message?.includes('PAYMENT_EXCEEDS_BALANCE')
        ? 'Payment amount exceeds the remaining invoice balance.'
        : error?.message?.includes('NOT_AUTHORIZED')
          ? 'Only the owner can record payments.'
          : 'Payment could not be recorded. Please verify the amount and payment method.');
    }
    await recordRemoteAuditLog(actorName, 'PAYMENT_RECORDED', 'invoice', invoiceId, `Payment of PKR ${payment.amount} via ${payment.method}`);
    await this.initializeRemoteAdminData();
    const updated = this.getInvoices().find((item) => item.id === invoiceId);
    if (!updated) throw new Error('Payment was recorded, but the updated invoice could not be reloaded. Refresh the page.');
    return updated;
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
    return getStored<Invoice[]>(STORAGE_KEYS.INVOICES, isSupabaseConfigured ? [] : initialInvoices);
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
  getAdminReviews(): Review[] {
    return getStored<Review[]>(
      STORAGE_KEYS.ADMIN_REVIEWS,
      isSupabaseConfigured ? this.getReviews(true) : initialReviews
    );
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
  async moderateOnlineReview(
    reviewId: string,
    status: 'approved' | 'rejected',
    actorName = 'Admin'
  ): Promise<boolean> {
    if (!supabase) return this.moderateReview(reviewId, status, actorName);

    const { error } = await supabase
      .from('reviews')
      .update({ moderation_status: status })
      .eq('id', reviewId);
    if (error) {
      console.error('Review moderation failed:', error.message);
      throw new Error('Review moderation failed. Check your content-editor permissions and try again.');
    }
    await Promise.all([
      this.initializeRemoteCatalog(),
      this.initializeRemoteAdminData(),
    ]);
    await recordRemoteAuditLog(actorName, 'REVIEW_MODERATED', 'review', reviewId, `Review marked as ${status}`);
    return true;
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
    return getStored<DataRequest[]>(STORAGE_KEYS.DATA_REQUESTS, isSupabaseConfigured ? [] : initialDataRequests);
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
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT, isSupabaseConfigured ? [] : initialAuditLogs);
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

  // Load private operational records only after Supabase Auth has verified an active staff profile.
  // Row-level security remains authoritative; records that the current staff role cannot read stay empty.
  async initializeRemoteAdminData(): Promise<void> {
    if (!supabase) return;

    try {
      const [
        bookingRows, historyRows, attachmentRows, inquiryRows, customerRows,
        staffRows, scheduleRows, blockRows, quoteRows, quoteItemRows,
        invoiceRows, invoiceItemRows, paymentRows, dataRequestRows, auditRows,
        serviceRows, reviewRows,
      ] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('booking_status_history').select('*').order('created_at', { ascending: false }),
        supabase.from('booking_attachments').select('*').order('created_at', { ascending: true }),
        supabase.from('customer_inquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('staff_profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('staff_schedules').select('*').order('weekday', { ascending: true }),
        supabase.from('availability_blocks').select('*').order('starts_at', { ascending: true }),
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('quote_items').select('*'),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('invoice_items').select('*'),
        supabase.from('payments').select('*').order('paid_at', { ascending: false }),
        supabase.from('data_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('reviews').select('*').order('review_date', { ascending: false }),
      ]);

      const logFailure = (label: string, response: { error: any }) => {
        if (response.error) {
          console.warn('Staff data section is unavailable for this role:', label, response.error.message);
        }
      };
      const rows = (response: { data: any[] | null; error: any }, label: string): any[] => {
        logFailure(label, response);
        return !response.error && Array.isArray(response.data) ? response.data : [];
      };

      const staffRecords = rows(staffRows, 'staff profiles');
      const staffById = new Map<string, Staff>(
        staffRecords.map((row) => [row.id, toCamelRecord<Staff>(row)] as [string, Staff])
      );

      const historiesByBooking = new Map<string, any[]>();
      for (const row of rows(historyRows, 'booking status history')) {
        const item = toCamelRecord<any>(row);
        historiesByBooking.set(item.bookingId, [...(historiesByBooking.get(item.bookingId) || []), item]);
      }
      const attachmentsByBooking = new Map<string, any[]>();
      for (const row of rows(attachmentRows, 'booking attachments')) {
        const item = {
          ...toCamelRecord<any>(row),
          fileUrl: row.storage_path,
        };
        attachmentsByBooking.set(item.bookingId, [...(attachmentsByBooking.get(item.bookingId) || []), item]);
      }
      const bookingData = rows(bookingRows, 'bookings').map((row) => ({
        ...toCamelRecord<Booking>(row),
        assignedTechnicianName: row.assigned_technician_name ||
          staffById.get(row.assigned_technician_id)?.fullName,
        history: historiesByBooking.get(row.id) || [],
        attachments: attachmentsByBooking.get(row.id) || [],
      }));
      if (!bookingRows.error) setStored<Booking[]>(STORAGE_KEYS.BOOKINGS, bookingData);

      const inquiries = rows(inquiryRows, 'customer inquiries').map((row) => toCamelRecord<CustomerInquiry>(row));
      if (!inquiryRows.error) setStored<CustomerInquiry[]>(STORAGE_KEYS.INQUIRIES, inquiries);

      const customers = rows(customerRows, 'customers').map((row) => toCamelRecord<any>(row));
      // AdminCustomers derives the visible list from bookings. Keep the customer cache available for future modules.
      if (!customerRows.error) setStored('abc_customers_remote_v1', customers);

      const staff = staffRecords.map((row) => toCamelRecord<Staff>(row));
      if (!staffRows.error) setStored<Staff[]>(STORAGE_KEYS.STAFF, staff);

      const schedules = rows(scheduleRows, 'staff schedules').map((row) => ({
        ...toCamelRecord<StaffSchedule>(row),
        technicianName: staffById.get(row.technician_id)?.fullName || '',
      }));
      if (!scheduleRows.error) setStored<StaffSchedule[]>(STORAGE_KEYS.SCHEDULES, schedules);

      const blocks = rows(blockRows, 'availability blocks').map((row) => ({
        ...toCamelRecord<AvailabilityBlock>(row),
        technicianName: staffById.get(row.technician_id)?.fullName || undefined,
      }));
      if (!blockRows.error) setStored<AvailabilityBlock[]>(STORAGE_KEYS.BLOCKS, blocks);

      const quoteItems = rows(quoteItemRows, 'quotation items');
      const quotes = rows(quoteRows, 'quotations').map((row) => ({
        ...toCamelRecord<Quote>(row),
        items: quoteItems.filter((item) => item.quote_id === row.id).map((item) => toCamelRecord<any>(item)),
      }));
      if (!quoteRows.error && !quoteItemRows.error) setStored<Quote[]>(STORAGE_KEYS.QUOTES, quotes);

      const invoiceItems = rows(invoiceItemRows, 'invoice items');
      const payments = rows(paymentRows, 'payments');
      const invoices = rows(invoiceRows, 'invoices').map((row) => ({
        ...toCamelRecord<Invoice>(row),
        items: invoiceItems.filter((item) => item.invoice_id === row.id).map((item) => toCamelRecord<any>(item)),
        payments: payments.filter((payment) => payment.invoice_id === row.id).map((payment) => ({
          ...toCamelRecord<Payment>(payment),
          recordedBy: payment.recorded_by,
        })),
      }));
      if (!invoiceRows.error && !invoiceItemRows.error) {
        // Payment rows are owner-only; a booking manager can still see invoices without payment details.
        setStored<Invoice[]>(STORAGE_KEYS.INVOICES, invoices);
      }

      const requests = rows(dataRequestRows, 'data requests').map((row) => toCamelRecord<DataRequest>(row));
      if (!dataRequestRows.error) setStored<DataRequest[]>(STORAGE_KEYS.DATA_REQUESTS, requests);

      const audit = rows(auditRows, 'audit logs').map((row) => ({
        ...toCamelRecord<AuditLog>(row),
        timestamp: row.created_at,
      }));
      if (!auditRows.error) setStored<AuditLog[]>(STORAGE_KEYS.AUDIT, audit);

      const allServices = rows(serviceRows, 'services').map((row) => toCamelRecord<Service>(row));
      if (!serviceRows.error) setStored<Service[]>(STORAGE_KEYS.ADMIN_SERVICES, allServices);

      const allReviews = rows(reviewRows, 'reviews').map((row) => ({
        ...toCamelRecord<Review>(row),
        date: row.review_date,
        isVerified: Boolean(row.is_verified),
        moderationStatus: row.moderation_status,
      }));
      if (!reviewRows.error) setStored<Review[]>(STORAGE_KEYS.ADMIN_REVIEWS, allReviews);

      dispatchCatalogUpdated();
    } catch (error) {
      console.error('Unable to refresh staff records from Supabase:', error);
      throw new Error('The staff workspace could not load its records. Please refresh and try again.');
    }
  },

  // Store website bookings using the database's website-only INSERT policy. Anonymous clients
  // intentionally cannot SELECT the resulting private customer or booking rows.
  async getOnlineAvailableSlots(
    dateStr: string,
    serviceId: string
  ): Promise<{ time: string; start: string; end: string; available: boolean }[]> {
    if (!supabase) return this.getAvailableSlots(dateStr, serviceId);
    const { data, error } = await supabase.rpc('get_website_available_slots', {
      p_service_id: serviceId,
      p_date: dateStr,
    });
    if (error) {
      console.error('Available slots query failed:', error.message);
      throw new Error('Appointment times are temporarily unavailable. Please try again.');
    }
    return (Array.isArray(data) ? data : []).map((slot: any) => ({
      time: String(slot.time),
      start: String(slot.start),
      end: String(slot.end),
      available: Boolean(slot.available),
    }));
  },

  async trackOnlineBooking(reference: string, phone: string): Promise<Booking | null> {
    if (!supabase) {
      const localBooking = this.getBookingByReference(reference);
      if (!localBooking) return null;
      const digits = (value: string) => value.replace(/\D/g, '');
      return digits(localBooking.customerPhone) === digits(phone) ? localBooking : null;
    }
    const { data, error } = await supabase.rpc('track_website_booking', {
      p_booking_reference: reference.trim().toUpperCase(),
      p_customer_phone: phone.trim(),
    });
    if (error) {
      console.error('Booking tracking failed:', error.message);
      throw new Error('We could not verify those details right now. Please try again.');
    }
    if (!data) return null;
    const booking = data as Booking;
    setStored<Booking[]>(
      STORAGE_KEYS.BOOKINGS,
      [booking, ...this.getBookings().filter((item) => item.id !== booking.id)]
    );
    return booking;
  },

  async cancelOnlineBooking(reference: string, phone: string, reason: string): Promise<Booking> {
    if (!supabase) {
      const booking = this.getBookingByReference(reference);
      if (!booking) throw new Error('Booking not found. Check the reference and phone number.');
      const updated = this.cancelBooking(booking.id, reason || 'Customer requested cancellation');
      if (!updated) throw new Error('This booking could not be cancelled.');
      return updated;
    }
    const { data, error } = await supabase.rpc('cancel_website_booking', {
      p_booking_reference: reference.trim().toUpperCase(),
      p_customer_phone: phone.trim(),
      p_reason: reason || 'Customer requested cancellation',
    });
    const result = data as { ok?: boolean; message?: string; booking?: Booking } | null;
    if (error) {
      console.error('Booking cancellation failed:', error.message);
      throw new Error('We could not cancel this booking right now. Please try again or contact support.');
    }
    if (!result?.ok || !result.booking) {
      throw new Error(result?.message || 'This booking could not be cancelled online.');
    }
    const booking = result.booking;
    setStored<Booking[]>(STORAGE_KEYS.BOOKINGS, [booking, ...this.getBookings().filter((item) => item.id !== booking.id)]);
    dispatchCatalogUpdated();
    return booking;
  },

  async rescheduleOnlineBooking(
    reference: string,
    phone: string,
    newStart: string,
    newEnd: string
  ): Promise<Booking> {
    if (!supabase) {
      const booking = this.getBookingByReference(reference);
      if (!booking) throw new Error('Booking not found. Check the reference and phone number.');
      const updated = this.rescheduleBooking(booking.id, newStart, newEnd, booking.customerName);
      if (!updated) throw new Error('This booking could not be rescheduled.');
      return updated;
    }
    const { data, error } = await supabase.rpc('reschedule_website_booking', {
      p_booking_reference: reference.trim().toUpperCase(),
      p_customer_phone: phone.trim(),
      p_new_start: newStart,
      p_new_end: newEnd,
    });
    const result = data as { ok?: boolean; message?: string; booking?: Booking } | null;
    if (error) {
      console.error('Booking reschedule failed:', error.message);
      throw new Error('We could not reschedule this booking right now. Please try again or contact support.');
    }
    if (!result?.ok || !result.booking) {
      throw new Error(result?.message || 'This booking could not be rescheduled online.');
    }
    const booking = result.booking;
    setStored<Booking[]>(STORAGE_KEYS.BOOKINGS, [booking, ...this.getBookings().filter((item) => item.id !== booking.id)]);
    dispatchCatalogUpdated();
    return booking;
  },

  // The database validates service eligibility, booking hours, consent, and overlapping requests
  // in one transaction. Photos are uploaded only to a private, staff-readable storage bucket.
  async createOnlineBooking(
    data: Omit<Booking, 'id' | 'customerId' | 'bookingReference' | 'status' | 'createdAt' | 'updatedAt' | 'history' | 'attachments'>,
    photos: string[] = []
  ): Promise<Booking> {
    if (!supabase) throw new Error('Online booking is temporarily unavailable. Please call our service desk.');
    if (photos.length > 5) throw new Error('Please attach no more than five photos.');

    const preparedPhotos: { blob: Blob; extension: string; fileName: string }[] = [];
    for (let index = 0; index < photos.length; index += 1) {
      const response = await fetch(photos[index]);
      const blob = await response.blob();
      const extensionByType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const extension = extensionByType[blob.type];
      if (!extension) throw new Error('Photos must be JPEG, PNG, or WebP images.');
      if (blob.size <= 0 || blob.size > 5 * 1024 * 1024) {
        throw new Error('Each photo must be smaller than 5 MB.');
      }
      preparedPhotos.push({
        blob,
        extension,
        fileName: `photo_${index + 1}.${extension}`,
      });
    }

    const { data: responseData, error } = await supabase.rpc('create_website_booking', {
      p_service_id: data.serviceId,
      p_customer_name: data.customerName.trim(),
      p_customer_phone: data.customerPhone,
      p_customer_email: data.customerEmail || null,
      p_problem_description: data.problemDescription.trim(),
      p_address_line: data.addressLine.trim(),
      p_city: data.city,
      p_area_name: data.areaName,
      p_postal_code: data.postalCode || null,
      p_scheduled_start: data.scheduledStart,
      p_scheduled_end: data.scheduledEnd,
      p_urgency: data.urgency,
      p_language: data.language,
      p_privacy_accepted_at: data.privacyAcceptedAt,
      p_terms_accepted_at: data.termsAcceptedAt,
    });

    if (error) {
      console.error('Supabase booking RPC failed:', error.message);
      if (error.message.includes('SLOT_UNAVAILABLE')) {
        throw new Error('That appointment slot is no longer available. Please choose another time.');
      }
      if (error.message.includes('SERVICE_AREA_UNAVAILABLE')) {
        throw new Error('This service area is not currently available. Please contact our service desk.');
      }
      if (error.message.includes('SERVICE_UNAVAILABLE')) {
        throw new Error('This service is not currently bookable. Please select another service.');
      }
      throw new Error('We could not save your booking. Please check the details and try again.');
    }
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('The booking service returned an invalid response. Please contact support before retrying.');
    }

    let booking = responseData as Booking;
    const uploaded: BookingAttachment[] = [];
    let uploadFailed = false;

    for (const photo of preparedPhotos) {
      const path = `${booking.id}/${crypto.randomUUID()}.${photo.extension}`;
      const { error: uploadError } = await supabase.storage
        .from('booking-attachments')
        .upload(path, photo.blob, { contentType: photo.blob.type, upsert: false });
      if (uploadError) {
        uploadFailed = true;
        console.warn('Booking photo upload failed:', uploadError.message);
        continue;
      }

      const attachmentId = crypto.randomUUID();
      const { error: attachmentError } = await supabase.from('booking_attachments').insert({
        id: attachmentId,
        booking_id: booking.id,
        file_name: photo.fileName,
        storage_path: path,
        file_size: photo.blob.size,
        file_type: photo.blob.type,
      });
      if (attachmentError) {
        uploadFailed = true;
        console.warn('Booking attachment metadata insert failed:', attachmentError.message);
        continue;
      }
      uploaded.push({
        id: attachmentId,
        bookingId: booking.id,
        fileName: photo.fileName,
        fileUrl: path,
        fileSize: photo.blob.size,
        fileType: photo.blob.type,
      });
    }

    booking = {
      ...booking,
      attachments: uploaded,
      attachmentsUploadWarning: uploadFailed,
    };
    setStored<Booking[]>(STORAGE_KEYS.BOOKINGS, [booking, ...this.getBookings().filter((item) => item.id !== booking.id)]);
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
