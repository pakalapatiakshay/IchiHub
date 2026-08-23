import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { Store, publicUser } from './store.js';

const scrypt = promisify(scryptCallback);
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_FILE = resolve(process.cwd(), process.env.DATA_FILE || './data/ichihub.json');
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'development-only-change-this-secret';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const BOOKING_STATUSES = new Set(['pending', 'accepted', 'confirmed', 'rejected', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed']);
const STATUS_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'], accepted: ['confirmed', 'on_the_way', 'cancelled'], confirmed: ['on_the_way', 'cancelled'],
  rejected: [], on_the_way: ['arrived', 'cancelled'], arrived: ['in_progress', 'cancelled'], in_progress: ['completed', 'cancelled'], completed: ['disputed'], cancelled: [], disputed: ['completed', 'cancelled'],
};
const VERIFICATION_STATUSES = new Set(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmission_required', 'suspended']);
const COMPLAINT_STATUSES = new Set(['open', 'under_review', 'action_required', 'resolved', 'closed']);
const ADMIN_ROLES = new Set(['super_admin', 'operations_admin', 'verification_admin', 'support_admin', 'finance_admin']);
const clients = new Set();

const store = new Store(DATA_FILE);
const send = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': CORS_ORIGIN, vary: 'origin' });
  response.end(JSON.stringify(body));
};
const error = (response, status, message) => send(response, status, { error: message });
const getBody = async (request) => new Promise((resolveBody, reject) => {
  let raw = '';
  request.on('data', (chunk) => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('Request body is too large')); });
  request.on('end', () => { try { resolveBody(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Request body must be valid JSON')); } });
  request.on('error', reject);
});
const requiredString = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
};
const optionalNumber = (value, field) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} must be a number`);
  return value;
};

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}
async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = Buffer.from(await scrypt(password, salt, 64));
  const stored = Buffer.from(key, 'hex');
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}
function signToken(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  const signature = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function getAuthenticatedUser(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  return getUserFromToken(token);
}
function getUserFromToken(token) {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (claims.exp < Date.now()) return null;
    return store.getUser(claims.sub) || null;
  } catch { return null; }
}
function publish(type, data, recipientIds = []) {
  const encoded = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.user.role === 'admin' || recipientIds.includes(client.user.id)) client.response.write(encoded);
  }
}
function bookingRecipients(booking) {
  const vendor = store.getVendor(booking.vendorId);
  return [booking.customerId, vendor?.userId].filter(Boolean);
}
function notifyBookingUsers(booking, type, title, body) {
  for (const userId of bookingRecipients(booking)) store.createNotification(userId, type, title, body, { bookingId: booking.id });
}
function requireUser(request, response, role) {
  const user = getAuthenticatedUser(request);
  if (!user) { error(response, 401, 'Authentication required'); return null; }
  if (role && user.role !== role) { error(response, 403, 'You do not have permission for this action'); return null; }
  return user;
}
function requireAdminPermission(request, response, allowedRoles) {
  const user = requireUser(request, response, 'admin');
  if (!user) return null;
  if (!allowedRoles.includes(user.adminRole || '')) { error(response, 403, 'Your admin role cannot perform this action'); return null; }
  return user;
}
function ownsBooking(user, booking) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return booking.customerId === user.id;
  return store.getVendorForUser(user.id)?.id === booking.vendorId;
}

async function handle(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'access-control-allow-origin': CORS_ORIGIN, 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS', 'access-control-allow-headers': 'Content-Type, Authorization', vary: 'origin' });
    response.end(); return;
  }
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname;
  try {
    if (request.method === 'GET' && path === '/health') return send(response, 200, { status: 'ok' });
    if (request.method === 'GET' && path === '/events') {
      const user = getUserFromToken(url.searchParams.get('token'));
      if (!user) return error(response, 401, 'Authentication required');
      response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'access-control-allow-origin': CORS_ORIGIN, vary: 'origin' });
      response.write('event: connected\ndata: {"connected":true}\n\n');
      const client = { user, response }; clients.add(client);
      request.on('close', () => clients.delete(client));
      return;
    }
    if (request.method === 'POST' && path === '/auth/register') {
      const body = await getBody(request); const role = requiredString(body.role, 'role');
      if (!['customer', 'vendor'].includes(role)) return error(response, 422, 'role must be customer or vendor');
      const email = requiredString(body.email, 'email').toLowerCase(); const password = requiredString(body.password, 'password');
      if (!/^\S+@\S+\.\S+$/.test(email)) return error(response, 422, 'email must be valid');
      if (password.length < 8) return error(response, 422, 'password must be at least 8 characters');
      if (store.getUserByEmail(email)) return error(response, 409, 'An account already exists for this email');
      const user = store.createUser({ name: requiredString(body.name, 'name'), email, phone: typeof body.phone === 'string' ? body.phone.trim() : '', role, passwordHash: await hashPassword(password) });
      const vendor = role === 'vendor' ? store.createVendor(user.id, { businessName: body.businessName || user.name, ...body.vendorProfile }) : null;
      if (vendor) {
        const application = store.getVerificationApplication(vendor.id);
        application.status = 'submitted'; application.submittedAt = new Date().toISOString(); application.updatedAt = application.submittedAt;
        store.addAudit(user.id, 'submitted_vendor_verification', 'vendor_verification', application.id, { vendorId: vendor.id });
      }
      await store.persist();
      return send(response, 201, { token: signToken(user), user: publicUser(user), vendor });
    }
    if (request.method === 'POST' && path === '/auth/login') {
      const body = await getBody(request); const email = requiredString(body.email, 'email'); const password = requiredString(body.password, 'password');
      const user = store.getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) return error(response, 401, 'Invalid email or password');
      if (body.role && body.role !== user.role) return error(response, 403, 'This account does not have that role');
      return send(response, 200, { token: signToken(user), user: publicUser(user), vendor: user.role === 'vendor' ? store.getVendorForUser(user.id) : null });
    }
    if (request.method === 'GET' && path === '/auth/me') {
      const user = requireUser(request, response); if (!user) return;
      return send(response, 200, { user: publicUser(user), vendor: user.role === 'vendor' ? store.getVendorForUser(user.id) : null });
    }
    if (request.method === 'GET' && path === '/notifications') {
      const user = requireUser(request, response); if (!user) return;
      const notifications = store.data.notifications.filter((notification) => notification.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return send(response, 200, { notifications });
    }
    const readNotificationMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
    if (request.method === 'PATCH' && readNotificationMatch) {
      const user = requireUser(request, response); if (!user) return; const notification = store.data.notifications.find((item) => item.id === readNotificationMatch[1] && item.userId === user.id);
      if (!notification) return error(response, 404, 'Notification not found'); notification.readAt = new Date().toISOString(); await store.persist(); return send(response, 200, { notification });
    }
    if (request.method === 'GET' && path === '/vendors') {
      let vendors = store.listVendors(); const category = url.searchParams.get('category'); const available = url.searchParams.get('available');
      if (category) vendors = vendors.filter((vendor) => vendor.category.toLowerCase() === category.toLowerCase());
      if (available === 'true') vendors = vendors.filter((vendor) => vendor.availability);
      return send(response, 200, { vendors });
    }
    const vendorMatch = path.match(/^\/vendors\/([^/]+)$/);
    if (request.method === 'GET' && vendorMatch) {
      const vendor = store.getVendor(vendorMatch[1]); return vendor ? send(response, 200, { vendor }) : error(response, 404, 'Vendor not found');
    }
    if (request.method === 'PATCH' && path === '/vendors/me') {
      const user = requireUser(request, response, 'vendor'); if (!user) return;
      const vendor = store.getVendorForUser(user.id); if (!vendor) return error(response, 404, 'Vendor profile not found');
      const body = await getBody(request); const permitted = ['businessName', 'description', 'category', 'address', 'city', 'lat', 'lng', 'serviceRadius', 'availability', 'startingPrice', 'image'];
      for (const key of permitted) if (body[key] !== undefined) vendor[key] = ['lat', 'lng', 'serviceRadius', 'startingPrice'].includes(key) ? optionalNumber(body[key], key) : body[key];
      vendor.updatedAt = new Date().toISOString(); await store.persist(); return send(response, 200, { vendor });
    }
    if (request.method === 'GET' && path === '/vendors/me/verification') {
      const user = requireUser(request, response, 'vendor'); if (!user) return;
      const vendor = store.getVendorForUser(user.id); if (!vendor) return error(response, 404, 'Vendor profile not found');
      return send(response, 200, { application: store.getVerificationApplication(vendor.id) });
    }
    if (request.method === 'PATCH' && path === '/vendors/me/verification') {
      const user = requireUser(request, response, 'vendor'); if (!user) return; const vendor = store.getVendorForUser(user.id); const body = await getBody(request);
      if (!vendor) return error(response, 404, 'Vendor profile not found'); const application = store.getVerificationApplication(vendor.id);
      if (!application || !['draft', 'rejected', 'resubmission_required'].includes(application.status)) return error(response, 409, 'This verification application cannot be submitted right now');
      application.governmentIdType = requiredString(body.governmentIdType, 'governmentIdType');
      application.governmentIdLast4 = requiredString(body.governmentIdNumber, 'governmentIdNumber').slice(-4);
      application.documentReference = requiredString(body.documentReference, 'documentReference');
      application.supportingDocumentReferences = Array.isArray(body.supportingDocumentReferences) ? body.supportingDocumentReferences.slice(0, 5) : [];
      application.status = 'submitted'; application.submittedAt = new Date().toISOString(); application.updatedAt = application.submittedAt; application.rejectionReason = null;
      vendor.verificationStatus = 'pending'; store.addAudit(user.id, 'submitted_vendor_verification', 'vendor_verification', application.id, { vendorId: vendor.id }); await store.persist();
      publish('verification.updated', { vendorId: vendor.id, status: application.status }, [user.id]); return send(response, 200, { application });
    }
    if (request.method === 'GET' && path === '/vendors/me/availability') {
      const user = requireUser(request, response, 'vendor'); if (!user) return; const vendor = store.getVendorForUser(user.id); if (!vendor) return error(response, 404, 'Vendor profile not found');
      return send(response, 200, { availability: store.data.availability.filter((item) => item.vendorId === vendor.id), online: vendor.availability });
    }
    if (request.method === 'PATCH' && path === '/vendors/me/availability') {
      const user = requireUser(request, response, 'vendor'); if (!user) return; const vendor = store.getVendorForUser(user.id); const body = await getBody(request);
      if (!vendor) return error(response, 404, 'Vendor profile not found'); if (typeof body.online !== 'boolean') return error(response, 422, 'online must be a boolean');
      vendor.availability = body.online; if (Array.isArray(body.schedule)) { store.data.availability = store.data.availability.filter((item) => item.vendorId !== vendor.id); for (const item of body.schedule.slice(0, 14)) store.data.availability.push({ id: randomBytes(8).toString('hex'), vendorId: vendor.id, day: item.day, start: item.start, end: item.end, available: item.available !== false, createdAt: new Date().toISOString() }); }
      store.addAudit(user.id, 'updated_availability', 'vendor', vendor.id, { online: body.online }); await store.persist(); publish('vendor.updated', { vendor }, [user.id]); return send(response, 200, { vendor, availability: store.data.availability.filter((item) => item.vendorId === vendor.id) });
    }
    if (request.method === 'GET' && path === '/vendors/me/performance') {
      const user = requireUser(request, response, 'vendor'); if (!user) return; const vendor = store.getVendorForUser(user.id); if (!vendor) return error(response, 404, 'Vendor profile not found');
      const bookings = store.data.bookings.filter((booking) => booking.vendorId === vendor.id); const payments = store.data.payments.filter((payment) => bookings.some((booking) => booking.id === payment.bookingId)); const completed = bookings.filter((booking) => booking.status === 'completed'); const rejected = bookings.filter((booking) => booking.status === 'rejected'); const totalNet = payments.filter((payment) => payment.status !== 'failed').reduce((sum, payment) => sum + payment.vendorEarnings, 0);
      return send(response, 200, { performance: { rating: vendor.rating, completedJobs: completed.length, acceptanceRate: bookings.length ? Math.round(((bookings.length - rejected.length) / bookings.length) * 1000) / 10 : 0, completionRate: bookings.length ? Math.round((completed.length / bookings.length) * 1000) / 10 : 0, grossEarnings: payments.reduce((sum, payment) => sum + payment.amount, 0), platformFee: payments.reduce((sum, payment) => sum + payment.platformFee, 0), netEarnings: totalNet, pendingPayments: payments.filter((payment) => payment.status === 'pending').reduce((sum, payment) => sum + payment.vendorEarnings, 0) } });
    }
    if (request.method === 'GET' && path === '/bookings') {
      const user = requireUser(request, response); if (!user) return;
      return send(response, 200, { bookings: store.listBookingsForUser(user) });
    }
    if (request.method === 'POST' && path === '/bookings') {
      const user = requireUser(request, response, 'customer'); if (!user) return;
      const body = await getBody(request); const vendor = store.getVendor(requiredString(body.vendorId, 'vendorId'));
      if (!vendor) return error(response, 404, 'Vendor not found');
      if (!vendor.availability || vendor.verificationStatus !== 'verified') return error(response, 409, 'This vendor cannot accept bookings right now');
      const booking = store.createBooking(user.id, { vendorId: vendor.id, service: requiredString(body.service, 'service'), date: requiredString(body.date, 'date'), time: requiredString(body.time, 'time'), address: requiredString(body.address, 'address'), notes: body.notes, bookingLat: optionalNumber(body.bookingLat, 'bookingLat'), bookingLng: optionalNumber(body.bookingLng, 'bookingLng'), bookingAddress: body.bookingAddress });
      booking.price = optionalNumber(body.price, 'price') ?? vendor.startingPrice;
      booking.paymentStatus = 'pending'; store.createPayment(booking);
      notifyBookingUsers(booking, 'booking_created', 'New booking request', `${booking.service} has been requested.`);
      await store.persist(); publish('booking.updated', { booking }, bookingRecipients(booking)); return send(response, 201, { booking });
    }
    const bookingMatch = path.match(/^\/bookings\/([^/]+)$/);
    if (request.method === 'GET' && bookingMatch) {
      const user = requireUser(request, response); if (!user) return; const booking = store.getBooking(bookingMatch[1]);
      if (!booking) return error(response, 404, 'Booking not found'); if (!ownsBooking(user, booking)) return error(response, 403, 'You do not have access to this booking');
      return send(response, 200, { booking, statusHistory: store.getBookingHistory(booking.id), payment: store.getPayment(booking.id), review: store.getReviewForBooking(booking.id), complaints: store.getComplaintsForBooking(booking.id) });
    }
    const statusMatch = path.match(/^\/bookings\/([^/]+)\/status$/);
    if (request.method === 'PATCH' && statusMatch) {
      const user = requireUser(request, response); if (!user) return; const booking = store.getBooking(statusMatch[1]); const body = await getBody(request);
      if (!booking) return error(response, 404, 'Booking not found'); if (!ownsBooking(user, booking)) return error(response, 403, 'You do not have access to this booking');
      const status = requiredString(body.status, 'status'); if (!BOOKING_STATUSES.has(status)) return error(response, 422, 'Invalid booking status');
      if (user.role === 'customer' && status !== 'cancelled') return error(response, 403, 'Customers may only cancel bookings');
      if (user.role === 'customer' && !STATUS_TRANSITIONS[booking.status].includes(status)) return error(response, 409, `Cannot change ${booking.status} to ${status}`);
      if (user.role === 'vendor' && !STATUS_TRANSITIONS[booking.status].includes(status)) return error(response, 409, `Cannot change ${booking.status} to ${status}`);
      const previousStatus = booking.status; booking.status = status; booking.updatedAt = new Date().toISOString();
      store.recordBookingStatus(booking, previousStatus, status, user.id, typeof body.note === 'string' ? body.note.slice(0, 500) : '');
      if (status === 'completed') { const payment = store.getPayment(booking.id); if (payment) { payment.status = 'authorized'; payment.updatedAt = booking.updatedAt; } }
      notifyBookingUsers(booking, 'booking_status', 'Booking status updated', `Your ${booking.service} booking is now ${status.replaceAll('_', ' ')}.`);
      await store.persist(); publish('booking.updated', { booking }, bookingRecipients(booking)); return send(response, 200, { booking, statusHistory: store.getBookingHistory(booking.id) });
    }
    const locationMatch = path.match(/^\/bookings\/([^/]+)\/location$/);
    if (request.method === 'PATCH' && locationMatch) {
      const user = requireUser(request, response, 'vendor'); if (!user) return; const booking = store.getBooking(locationMatch[1]); const body = await getBody(request);
      if (!booking) return error(response, 404, 'Booking not found'); if (!ownsBooking(user, booking)) return error(response, 403, 'You do not have access to this booking');
      const lat = optionalNumber(body.lat, 'lat'); const lng = optionalNumber(body.lng, 'lng');
      if (lat === undefined || lng === undefined || lat < -90 || lat > 90 || lng < -180 || lng > 180) return error(response, 422, 'A valid latitude and longitude are required');
      booking.vendorLiveLocation = { lat, lng, heading: optionalNumber(body.heading, 'heading'), speed: optionalNumber(body.speed, 'speed'), accuracy: optionalNumber(body.accuracy, 'accuracy'), timestamp: Date.now() };
      booking.updatedAt = new Date().toISOString(); await store.persist(); publish('booking.location', { bookingId: booking.id, location: booking.vendorLiveLocation }, bookingRecipients(booking)); return send(response, 200, { booking });
    }
    const reviewMatch = path.match(/^\/bookings\/([^/]+)\/review$/);
    if (request.method === 'POST' && reviewMatch) {
      const user = requireUser(request, response, 'customer'); if (!user) return; const booking = store.getBooking(reviewMatch[1]); const body = await getBody(request);
      if (!booking) return error(response, 404, 'Booking not found'); if (booking.customerId !== user.id) return error(response, 403, 'You do not have access to this booking'); if (booking.status !== 'completed') return error(response, 409, 'Reviews are available after completion'); if (store.getReviewForBooking(booking.id)) return error(response, 409, 'This booking already has a review');
      const rating = optionalNumber(body.rating, 'rating'); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return error(response, 422, 'rating must be an integer from 1 to 5');
      const review = store.createReview(user.id, { bookingId: booking.id, vendorId: booking.vendorId, rating, serviceQuality: optionalNumber(body.serviceQuality, 'serviceQuality'), behavior: optionalNumber(body.behavior, 'behavior'), timeliness: optionalNumber(body.timeliness, 'timeliness'), text: typeof body.text === 'string' ? body.text.slice(0, 2000) : '', photoReferences: Array.isArray(body.photoReferences) ? body.photoReferences.slice(0, 5) : [] });
      notifyBookingUsers(booking, 'review_created', 'New service review', 'A customer has left a review.'); await store.persist(); publish('review.created', { review }, bookingRecipients(booking)); return send(response, 201, { review });
    }
    if (request.method === 'GET' && path === '/reviews') {
      const vendorId = requiredString(url.searchParams.get('vendorId'), 'vendorId'); return send(response, 200, { reviews: store.data.reviews.filter((review) => review.vendorId === vendorId) });
    }
    if (request.method === 'POST' && path === '/complaints') {
      const user = requireUser(request, response, 'customer'); if (!user) return; const body = await getBody(request); const booking = store.getBooking(requiredString(body.bookingId, 'bookingId'));
      if (!booking) return error(response, 404, 'Booking not found'); if (booking.customerId !== user.id) return error(response, 403, 'You do not have access to this booking');
      const complaint = store.createComplaint(user.id, { bookingId: booking.id, vendorId: booking.vendorId, category: requiredString(body.category, 'category'), description: requiredString(body.description, 'description').slice(0, 5000), preferredResolution: typeof body.preferredResolution === 'string' ? body.preferredResolution.slice(0, 1000) : '', attachmentReferences: Array.isArray(body.attachmentReferences) ? body.attachmentReferences.slice(0, 5) : [], priority: 'medium' });
      booking.status = booking.status === 'completed' ? 'disputed' : booking.status; store.addAudit(user.id, 'created_complaint', 'complaint', complaint.id, { bookingId: booking.id }); await store.persist(); publish('complaint.created', { complaint }, bookingRecipients(booking)); return send(response, 201, { complaint });
    }
    if (request.method === 'GET' && path === '/complaints') {
      const user = requireUser(request, response); if (!user) return; const complaints = user.role === 'admin' ? store.data.complaints : user.role === 'customer' ? store.data.complaints.filter((item) => item.customerId === user.id) : store.data.complaints.filter((item) => item.vendorId === store.getVendorForUser(user.id)?.id);
      return send(response, 200, { complaints });
    }
    const complaintMatch = path.match(/^\/complaints\/([^/]+)$/);
    if (request.method === 'GET' && complaintMatch) {
      const user = requireUser(request, response); if (!user) return; const complaint = store.data.complaints.find((item) => item.id === complaintMatch[1]);
      if (!complaint) return error(response, 404, 'Support ticket not found'); if (user.role !== 'admin' && user.id !== complaint.customerId && store.getVendorForUser(user.id)?.id !== complaint.vendorId) return error(response, 403, 'You do not have access to this ticket');
      return send(response, 200, { complaint, messages: store.data.supportMessages.filter((message) => message.complaintId === complaint.id) });
    }
    const complaintStatusMatch = path.match(/^\/complaints\/([^/]+)\/status$/);
    if (request.method === 'PATCH' && complaintStatusMatch) {
      const user = requireAdminPermission(request, response, ['super_admin', 'operations_admin', 'support_admin']); if (!user) return; const complaint = store.data.complaints.find((item) => item.id === complaintStatusMatch[1]); const body = await getBody(request);
      if (!complaint) return error(response, 404, 'Support ticket not found'); if (!COMPLAINT_STATUSES.has(body.status)) return error(response, 422, 'Invalid complaint status'); complaint.status = body.status; complaint.priority = body.priority || complaint.priority; complaint.resolution = typeof body.resolution === 'string' ? body.resolution.slice(0, 3000) : complaint.resolution; complaint.assignedTo = body.assignedTo || user.id; complaint.updatedAt = new Date().toISOString(); store.addAudit(user.id, 'updated_complaint', 'complaint', complaint.id, { status: complaint.status }); await store.persist(); publish('complaint.updated', { complaint }, [complaint.customerId]); return send(response, 200, { complaint });
    }
    const messageMatch = path.match(/^\/complaints\/([^/]+)\/messages$/);
    if (request.method === 'POST' && messageMatch) {
      const user = requireUser(request, response); if (!user) return; const complaint = store.data.complaints.find((item) => item.id === messageMatch[1]); const body = await getBody(request);
      if (!complaint) return error(response, 404, 'Support ticket not found'); if (user.role !== 'admin' && user.id !== complaint.customerId && store.getVendorForUser(user.id)?.id !== complaint.vendorId) return error(response, 403, 'You do not have access to this ticket');
      const message = store.createSupportMessage(complaint.id, user.id, requiredString(body.message, 'message').slice(0, 3000), Array.isArray(body.attachmentReferences) ? body.attachmentReferences.slice(0, 5) : []); complaint.updatedAt = message.createdAt; await store.persist(); publish('support.message', { complaintId: complaint.id, message }, [complaint.customerId]); return send(response, 201, { message });
    }
    const approvalMatch = path.match(/^\/admin\/vendors\/([^/]+)\/verification$/);
    if (request.method === 'PATCH' && approvalMatch) {
      const user = requireAdminPermission(request, response, ['super_admin', 'verification_admin']); if (!user) return; const body = await getBody(request); const vendor = store.getVendor(approvalMatch[1]);
      if (!vendor) return error(response, 404, 'Vendor not found'); const application = store.getVerificationApplication(vendor.id); if (!application) return error(response, 404, 'Verification application not found');
      const status = requiredString(body.status, 'status'); if (!['approved', 'rejected', 'resubmission_required', 'under_review', 'suspended'].includes(status)) return error(response, 422, 'Invalid verification status');
      const previousStatus = application.status; application.status = status; application.reviewedAt = new Date().toISOString(); application.reviewedBy = user.id; application.updatedAt = application.reviewedAt; application.rejectionReason = typeof body.reason === 'string' ? body.reason.slice(0, 2000) : null;
      vendor.verificationStatus = status === 'approved' ? 'verified' : status === 'suspended' ? 'rejected' : 'pending'; vendor.updatedAt = application.updatedAt;
      store.addAudit(user.id, 'reviewed_vendor_verification', 'vendor_verification', application.id, { vendorId: vendor.id, previousStatus, newStatus: status, reason: application.rejectionReason });
      if (vendor.userId) store.createNotification(vendor.userId, 'verification_updated', 'Verification status updated', `Your verification application is ${status.replaceAll('_', ' ')}.`, { vendorId: vendor.id });
      await store.persist(); publish('verification.updated', { vendorId: vendor.id, status }, [vendor.userId].filter(Boolean)); return send(response, 200, { vendor, application });
    }
    if (request.method === 'GET' && path === '/admin/verifications') {
      const user = requireAdminPermission(request, response, ['super_admin', 'verification_admin']); if (!user) return; const status = url.searchParams.get('status');
      const applications = store.listVerificationApplications().filter((application) => !status || application.status === status).map((application) => ({ ...application, vendor: store.getVendor(application.vendorId) })); return send(response, 200, { applications });
    }
    if (request.method === 'GET' && path === '/admin/metrics') {
      const user = requireAdminPermission(request, response, [...ADMIN_ROLES]); if (!user) return; const today = new Date().toISOString().slice(0, 10); const bookings = store.data.bookings; const payments = store.data.payments;
      const completed = bookings.filter((booking) => booking.status === 'completed'); const todays = bookings.filter((booking) => booking.createdAt.slice(0, 10) === today); const completedToday = completed.filter((booking) => booking.updatedAt?.slice(0, 10) === today);
      const grossRevenue = payments.filter((payment) => payment.status !== 'failed').reduce((sum, payment) => sum + payment.amount, 0); const platformEarnings = payments.filter((payment) => payment.status !== 'failed').reduce((sum, payment) => sum + payment.platformFee, 0);
      return send(response, 200, { metrics: { totalUsers: store.data.users.filter((item) => item.role === 'customer').length, activeVendors: store.data.vendors.filter((vendor) => vendor.availability && vendor.verificationStatus === 'verified').length, todaysBookings: todays.length, completedToday: completedToday.length, pendingBookings: bookings.filter((booking) => booking.status === 'pending').length, cancelledToday: bookings.filter((booking) => booking.status === 'cancelled' && booking.updatedAt?.slice(0, 10) === today).length, grossRevenue, platformEarnings, openComplaints: store.data.complaints.filter((complaint) => !['resolved', 'closed'].includes(complaint.status)).length, pendingVerifications: store.data.verificationApplications.filter((application) => ['submitted', 'under_review', 'resubmission_required'].includes(application.status)).length, activeServices: bookings.filter((booking) => ['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status)).length } });
    }
    if (request.method === 'GET' && path === '/admin/analytics') {
      const user = requireAdminPermission(request, response, [...ADMIN_ROLES]); if (!user) return; const from = url.searchParams.get('from'); const to = url.searchParams.get('to'); const bookings = store.data.bookings.filter((booking) => (!from || booking.createdAt >= from) && (!to || booking.createdAt <= `${to}T23:59:59.999Z`));
      const group = (key) => Object.entries(bookings.reduce((result, booking) => { const value = key(booking) || 'Unknown'; result[value] = (result[value] || 0) + 1; return result; }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
      const paymentByBooking = new Map(store.data.payments.map((payment) => [payment.bookingId, payment]));
      return send(response, 200, { analytics: { bookingStatus: group((booking) => booking.status), serviceDemand: group((booking) => booking.service), areaDemand: group((booking) => booking.address.split(',').at(-1)?.trim()), bookingsByHour: group((booking) => new Date(booking.createdAt).getHours().toString().padStart(2, '0')), bookingsByDay: group((booking) => new Date(booking.createdAt).toLocaleDateString('en-US', { weekday: 'long' })), revenueByService: Object.entries(bookings.reduce((result, booking) => { result[booking.service] = (result[booking.service] || 0) + (paymentByBooking.get(booking.id)?.amount || 0); return result; }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), completionRate: bookings.length ? Math.round((bookings.filter((booking) => booking.status === 'completed').length / bookings.length) * 1000) / 10 : 0, cancellationRate: bookings.length ? Math.round((bookings.filter((booking) => ['cancelled', 'rejected'].includes(booking.status)).length / bookings.length) * 1000) / 10 : 0 } });
    }
    if (request.method === 'GET' && path === '/admin/audit-logs') {
      const user = requireAdminPermission(request, response, ['super_admin']); if (!user) return; return send(response, 200, { auditLogs: [...store.data.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500) });
    }
    if (request.method === 'GET' && path === '/services') return send(response, 200, { services: store.data.serviceCategories.filter((service) => service.active) });
    if (request.method === 'POST' && path === '/admin/services') {
      const user = requireAdminPermission(request, response, ['super_admin', 'operations_admin']); if (!user) return; const body = await getBody(request); const service = { id: randomBytes(8).toString('hex'), name: requiredString(body.name, 'name'), active: true, createdAt: new Date().toISOString() }; store.data.serviceCategories.push(service); store.addAudit(user.id, 'created_service', 'service', service.id, { name: service.name }); await store.persist(); return send(response, 201, { service });
    }
    const serviceMatch = path.match(/^\/admin\/services\/([^/]+)$/);
    if (request.method === 'PATCH' && serviceMatch) {
      const user = requireAdminPermission(request, response, ['super_admin', 'operations_admin']); if (!user) return; const service = store.data.serviceCategories.find((item) => item.id === serviceMatch[1]); const body = await getBody(request); if (!service) return error(response, 404, 'Service not found'); if (body.name !== undefined) service.name = requiredString(body.name, 'name'); if (body.active !== undefined && typeof body.active !== 'boolean') return error(response, 422, 'active must be a boolean'); if (body.active !== undefined) service.active = body.active; store.addAudit(user.id, 'updated_service', 'service', service.id, { active: service.active }); await store.persist(); return send(response, 200, { service });
    }
    return error(response, 404, 'Route not found');
  } catch (caught) { return error(response, 422, caught.message || 'Invalid request'); }
}

await store.init();
if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD && !store.getUserByEmail(process.env.BOOTSTRAP_ADMIN_EMAIL)) {
  const administrator = store.createUser({ name: process.env.BOOTSTRAP_ADMIN_NAME || 'IchiHub Administrator', email: process.env.BOOTSTRAP_ADMIN_EMAIL, phone: '', role: 'admin', passwordHash: await hashPassword(process.env.BOOTSTRAP_ADMIN_PASSWORD) });
  administrator.adminRole = 'super_admin';
  store.addAudit(administrator.id, 'created_bootstrap_admin', 'admin', administrator.id);
  await store.persist();
}
createServer(handle).listen(PORT, HOST, () => console.log(`IchiHub API listening on http://${HOST}:${PORT}`));
