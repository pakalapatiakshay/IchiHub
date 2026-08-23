import { create } from 'zustand';
import { api, openEventStream } from '../lib/api';

export interface VendorProfile {
  id: string; user_id: string; business_name: string; description: string; category: string; address: string; city: string;
  lat: number; lng: number; service_radius: number; verification_status: 'pending' | 'verified' | 'rejected'; rating: number;
  review_count: number; availability: boolean; starting_price: number; image: string;
}
export type BookingStatus = 'pending' | 'accepted' | 'confirmed' | 'rejected' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export interface Booking {
  id: string; customer_id: string; vendor_id: string; service: string; date: string; time: string; status: BookingStatus;
  address: string; notes: string; created_at: string; booking_lat?: number; booking_lng?: number; booking_address?: string;
  vendor_live_lat?: number; vendor_live_lng?: number; vendor_live_heading?: number; vendor_live_speed?: number; vendor_live_accuracy?: number; vendor_live_timestamp?: number;
}
type ApiVendor = { id: string; userId: string | null; businessName: string; description: string; category: string; address: string; city: string; lat: number; lng: number; serviceRadius: number; verificationStatus: VendorProfile['verification_status']; rating: number; reviewCount: number; availability: boolean; startingPrice: number; image: string; };
type ApiBooking = { id: string; customerId: string; vendorId: string; service: string; date: string; time: string; status: BookingStatus; address: string; notes: string; createdAt: string; bookingLat?: number; bookingLng?: number; bookingAddress?: string; vendorLiveLocation?: { lat: number; lng: number; heading?: number; speed?: number; accuracy?: number; timestamp?: number }; };

const mapVendor = (vendor: ApiVendor): VendorProfile => ({ id: vendor.id, user_id: vendor.userId || '', business_name: vendor.businessName, description: vendor.description, category: vendor.category, address: vendor.address, city: vendor.city, lat: vendor.lat, lng: vendor.lng, service_radius: vendor.serviceRadius, verification_status: vendor.verificationStatus, rating: vendor.rating, review_count: vendor.reviewCount, availability: vendor.availability, starting_price: vendor.startingPrice, image: vendor.image });
const mapBooking = (booking: ApiBooking): Booking => ({ id: booking.id, customer_id: booking.customerId, vendor_id: booking.vendorId, service: booking.service, date: booking.date, time: booking.time, status: booking.status, address: booking.address, notes: booking.notes, created_at: booking.createdAt, booking_lat: booking.bookingLat, booking_lng: booking.bookingLng, booking_address: booking.bookingAddress, vendor_live_lat: booking.vendorLiveLocation?.lat, vendor_live_lng: booking.vendorLiveLocation?.lng, vendor_live_heading: booking.vendorLiveLocation?.heading, vendor_live_speed: booking.vendorLiveLocation?.speed, vendor_live_accuracy: booking.vendorLiveLocation?.accuracy, vendor_live_timestamp: booking.vendorLiveLocation?.timestamp });

let eventStream: EventSource | null = null;
interface DataState {
  vendors: VendorProfile[]; bookings: Booking[]; loading: boolean;
  loadMarketplace: () => Promise<void>; loadBookings: () => Promise<void>; startRealtime: () => void; stopRealtime: () => void;
  addBooking: (booking: Booking) => Promise<void>; updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>; updateBookingVendorLocation: (id: string, lat: number, lng: number, heading?: number, speed?: number, accuracy?: number) => Promise<void>;
  addVendor: (vendor: VendorProfile) => void; updateVendorStatus: (id: string, status: VendorProfile['verification_status']) => Promise<void>;
}
const replaceBooking = (bookings: Booking[], booking: Booking) => bookings.some((item) => item.id === booking.id) ? bookings.map((item) => item.id === booking.id ? booking : item) : [booking, ...bookings];

export const useDataStore = create<DataState>((set) => ({
  vendors: [], bookings: [], loading: false,
  loadMarketplace: async () => { set({ loading: true }); try { const response = await api<{ vendors: ApiVendor[] }>('/vendors'); set({ vendors: response.vendors.map(mapVendor) }); } finally { set({ loading: false }); } },
  loadBookings: async () => { const response = await api<{ bookings: ApiBooking[] }>('/bookings'); set({ bookings: response.bookings.map(mapBooking) }); },
  startRealtime: () => {
    eventStream?.close(); eventStream = openEventStream(); if (!eventStream) return;
    eventStream.addEventListener('booking.updated', (event) => { const booking = mapBooking(JSON.parse((event as MessageEvent).data).booking as ApiBooking); set((state) => ({ bookings: replaceBooking(state.bookings, booking) })); });
    eventStream.addEventListener('booking.location', (event) => { const update = JSON.parse((event as MessageEvent).data) as { bookingId: string; location: ApiBooking['vendorLiveLocation'] }; set((state) => ({ bookings: state.bookings.map((booking) => booking.id === update.bookingId ? { ...booking, vendor_live_lat: update.location?.lat, vendor_live_lng: update.location?.lng, vendor_live_heading: update.location?.heading, vendor_live_speed: update.location?.speed, vendor_live_accuracy: update.location?.accuracy, vendor_live_timestamp: update.location?.timestamp } : booking) })); });
    eventStream.addEventListener('vendor.updated', () => { void useDataStore.getState().loadMarketplace(); });
  },
  stopRealtime: () => { eventStream?.close(); eventStream = null; },
  addBooking: async (booking) => { const response = await api<{ booking: ApiBooking }>('/bookings', { method: 'POST', body: JSON.stringify({ vendorId: booking.vendor_id, service: booking.service, date: booking.date, time: booking.time, address: booking.address, notes: booking.notes, bookingLat: booking.booking_lat, bookingLng: booking.booking_lng, bookingAddress: booking.booking_address }) }); const created = mapBooking(response.booking); set((state) => ({ bookings: replaceBooking(state.bookings, created) })); },
  updateBookingStatus: async (id, status) => { const response = await api<{ booking: ApiBooking }>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); const updated = mapBooking(response.booking); set((state) => ({ bookings: replaceBooking(state.bookings, updated) })); },
  updateBookingVendorLocation: async (id, lat, lng, heading, speed, accuracy) => { const response = await api<{ booking: ApiBooking }>(`/bookings/${id}/location`, { method: 'PATCH', body: JSON.stringify({ lat, lng, heading, speed, accuracy }) }); const updated = mapBooking(response.booking); set((state) => ({ bookings: replaceBooking(state.bookings, updated) })); },
  addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
  updateVendorStatus: async (id, status) => { await api(`/admin/vendors/${id}/verification`, { method: 'PATCH', body: JSON.stringify({ status: status === 'verified' ? 'approved' : 'rejected' }) }); await useDataStore.getState().loadMarketplace(); },
}));

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) { const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
export function formatDistance(distanceKm: number): string { return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`; }
export function estimateETA(distanceKm: number): string { const minutes = Math.round((distanceKm / 25) * 60); return minutes < 1 ? '< 1 min' : minutes === 1 ? '1 min' : `${minutes} min`; }
