import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const DEMO_VENDORS = [
  ['Spark Electrical Services', 'Professional electrical repair and installation.', 'Electrician', 12.9736, 77.5966, 4.8, 124, true, 299, 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop'],
  ['IchiFix Plumbing', 'Expert plumbing for residential and commercial.', 'Plumber', 12.9776, 77.5906, 4.5, 89, true, 199, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2070&auto=format&fit=crop'],
  ['QuickWrench Auto Care', 'Fast and reliable car mechanic services.', 'Car Mechanic', 12.9596, 77.6046, 4.9, 210, false, 999, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop'],
  ['CleanNest Services', 'Deep cleaning for homes and offices.', 'Cleaning', 12.9676, 77.5896, 0, 0, true, 499, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop'],
];

export function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export class Store {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.writing = Promise.resolve();
  }

  async init() {
    try {
      this.data = JSON.parse(await readFile(this.filePath, 'utf8'));
      if (this.migrate()) await this.persist();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.data = this.seed();
      await this.persist();
    }
  }

  seed() {
    const now = new Date().toISOString();
    return {
      users: [],
      vendors: DEMO_VENDORS.map(([businessName, description, category, lat, lng, rating, reviewCount, availability, startingPrice, image], index) => ({
        id: `demo-vendor-${index + 1}`,
        userId: null,
        businessName,
        description,
        category,
        address: index === 1 ? '45 Park Ave' : index === 2 ? '78 Auto Nagar' : index === 3 ? '90 Clean St' : '123 Main St',
        city: 'Bangalore', lat, lng, serviceRadius: index === 2 ? 15 : index === 1 ? 10 : 5,
        verificationStatus: index === 3 ? 'pending' : 'verified', rating, reviewCount, availability, startingPrice, image,
        createdAt: now,
      })),
      bookings: [],
      bookingStatusHistory: [],
      verificationApplications: [],
      reviews: [],
      complaints: [],
      supportMessages: [],
      notifications: [],
      auditLogs: [],
      availability: [],
      payments: [],
      payouts: [],
      serviceCategories: ['Electrician', 'Plumber', 'Car Mechanic', 'Cleaning', 'Appliance Repair', 'AC Repair', 'Painting', 'Carpentry'].map((name) => ({ id: randomUUID(), name, active: true, createdAt: now })),
      serviceAreas: [{ id: randomUUID(), name: 'Bangalore', active: true, createdAt: now }],
    };
  }

  migrate() {
    let changed = false;
    for (const key of ['users', 'vendors', 'bookings', 'bookingStatusHistory', 'verificationApplications', 'reviews', 'complaints', 'supportMessages', 'notifications', 'auditLogs', 'availability', 'payments', 'payouts', 'serviceCategories', 'serviceAreas']) {
      if (!Array.isArray(this.data[key])) { this.data[key] = []; changed = true; }
    }
    if (!this.data.serviceCategories.length) { this.data.serviceCategories = this.seed().serviceCategories; changed = true; }
    if (!this.data.serviceAreas.length) { this.data.serviceAreas = this.seed().serviceAreas; changed = true; }
    for (const user of this.data.users) if (!user.accountStatus) { user.accountStatus = 'active'; changed = true; }
    return changed;
  }

  async persist() {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.writing = this.writing.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporaryFile = `${this.filePath}.tmp`;
      await writeFile(temporaryFile, snapshot, 'utf8');
      await rename(temporaryFile, this.filePath);
    });
    return this.writing;
  }

  createUser({ name, email, phone, role, passwordHash }) {
    const user = { id: randomUUID(), name, email: email.toLowerCase(), phone: phone || '', role, accountStatus: 'active', passwordHash, createdAt: new Date().toISOString() };
    this.data.users.push(user);
    return user;
  }

  getUserByEmail(email) { return this.data.users.find((user) => user.email === email.toLowerCase()); }
  getUser(id) { return this.data.users.find((user) => user.id === id); }
  listVendors() { return this.data.vendors; }
  getVendor(id) { return this.data.vendors.find((vendor) => vendor.id === id); }
  getVendorForUser(userId) { return this.data.vendors.find((vendor) => vendor.userId === userId); }

  createVendor(userId, input) {
    const vendor = {
      id: randomUUID(), userId, businessName: input.businessName, description: input.description || '', category: input.category || 'General Services',
      address: input.address || '', city: input.city || '', lat: input.lat ?? 12.9716, lng: input.lng ?? 77.5946,
      serviceRadius: input.serviceRadius ?? 5, verificationStatus: 'pending', rating: 0, reviewCount: 0,
      availability: input.availability ?? true, startingPrice: input.startingPrice ?? 0, image: input.image || '', createdAt: new Date().toISOString(),
    };
    this.data.vendors.push(vendor);
    this.createVerificationApplication(vendor.id, input.verification || {});
    return vendor;
  }

  createBooking(customerId, input) {
    const booking = {
      id: randomUUID(), customerId, vendorId: input.vendorId, service: input.service, date: input.date, time: input.time,
      status: 'pending', address: input.address, notes: input.notes || '', bookingLat: input.bookingLat, bookingLng: input.bookingLng,
      bookingAddress: input.bookingAddress || input.address, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    this.data.bookings.push(booking);
    this.recordBookingStatus(booking, null, 'pending', customerId, 'Booking created');
    return booking;
  }

  recordBookingStatus(booking, previousStatus, newStatus, actorId, note = '') {
    const now = new Date().toISOString();
    const entry = { id: randomUUID(), bookingId: booking.id, previousStatus, status: newStatus, actorId, note, createdAt: now };
    this.data.bookingStatusHistory.push(entry);
    booking.statusHistory = [...(booking.statusHistory || []), entry.id];
    booking.statusTimestamps = { ...(booking.statusTimestamps || {}), [newStatus]: now };
    return entry;
  }

  createVerificationApplication(vendorId, input) {
    const application = {
      id: randomUUID(), vendorId, status: 'draft', governmentIdType: input.governmentIdType || '', governmentIdLast4: input.governmentIdNumber ? String(input.governmentIdNumber).slice(-4) : '',
      documentReference: input.documentReference || '', supportingDocumentReferences: input.supportingDocumentReferences || [], submittedAt: null, reviewedAt: null, reviewedBy: null,
      rejectionReason: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    this.data.verificationApplications.push(application);
    return application;
  }

  getVerificationApplication(vendorId) { return this.data.verificationApplications.find((application) => application.vendorId === vendorId); }
  listVerificationApplications() { return this.data.verificationApplications; }

  addAudit(actorId, action, entityType, entityId, details = {}) {
    const audit = { id: randomUUID(), actorId, action, entityType, entityId, details, createdAt: new Date().toISOString() };
    this.data.auditLogs.push(audit);
    return audit;
  }

  createNotification(userId, type, title, body, data = {}) {
    const notification = { id: randomUUID(), userId, type, title, body, data, readAt: null, createdAt: new Date().toISOString() };
    this.data.notifications.push(notification);
    return notification;
  }

  createPayment(booking) {
    const payment = { id: randomUUID(), bookingId: booking.id, amount: booking.price, platformFee: Math.round(booking.price * 0.15 * 100) / 100, vendorEarnings: Math.round(booking.price * 0.85 * 100) / 100, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.data.payments.push(payment);
    return payment;
  }

  createComplaint(customerId, input) {
    const complaint = { id: randomUUID(), ticketNumber: `ICH-${Math.floor(10000 + Math.random() * 90000)}`, customerId, bookingId: input.bookingId, vendorId: input.vendorId, category: input.category, description: input.description, preferredResolution: input.preferredResolution || '', attachmentReferences: input.attachmentReferences || [], priority: input.priority || 'medium', status: 'open', assignedTo: null, resolution: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.data.complaints.push(complaint);
    return complaint;
  }

  createSupportMessage(complaintId, authorId, message, attachmentReferences = []) {
    const supportMessage = { id: randomUUID(), complaintId, authorId, message, attachmentReferences, createdAt: new Date().toISOString() };
    this.data.supportMessages.push(supportMessage);
    return supportMessage;
  }

  createReview(customerId, input) {
    const review = { id: randomUUID(), customerId, bookingId: input.bookingId, vendorId: input.vendorId, rating: input.rating, serviceQuality: input.serviceQuality, behavior: input.behavior, timeliness: input.timeliness, text: input.text || '', photoReferences: input.photoReferences || [], createdAt: new Date().toISOString() };
    this.data.reviews.push(review);
    const vendor = this.getVendor(input.vendorId);
    if (vendor) {
      const reviews = this.data.reviews.filter((item) => item.vendorId === vendor.id);
      vendor.reviewCount = reviews.length;
      vendor.rating = Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10;
    }
    return review;
  }

  getBooking(id) { return this.data.bookings.find((booking) => booking.id === id); }
  listBookingsForUser(user) {
    if (user.role === 'admin') return this.data.bookings;
    if (user.role === 'customer') return this.data.bookings.filter((booking) => booking.customerId === user.id);
    const vendor = this.getVendorForUser(user.id);
    return vendor ? this.data.bookings.filter((booking) => booking.vendorId === vendor.id) : [];
  }

  getBookingHistory(bookingId) { return this.data.bookingStatusHistory.filter((entry) => entry.bookingId === bookingId); }
  getPayment(bookingId) { return this.data.payments.find((payment) => payment.bookingId === bookingId); }
  getReviewForBooking(bookingId) { return this.data.reviews.find((review) => review.bookingId === bookingId); }
  getComplaintsForBooking(bookingId) { return this.data.complaints.filter((complaint) => complaint.bookingId === bookingId); }
}
