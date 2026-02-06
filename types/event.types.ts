/** Matches backend EventType enum */
export type EventType = 'conference' | 'fieldtrip' | 'event' | 'holiday';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RSVPStatus = 'pending' | 'going' | 'not_going' | 'maybe';

export interface InviteeDto {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  profilePicture?: string | null;
  rsvpStatus: RSVPStatus;
  selectedTimeSlotId?: string | null;
}

export interface TimeSlotDto {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number | null;
  currentParticipants: number;
}

export interface RSVPStatsDto {
  going: number;
  notGoing: number;
  maybe: number;
  pending: number;
}

export interface EventResponseDto {
  id: string;
  title: string;
  type: EventType;
  description: string | null;
  location: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  appleMapsUrl?: string | null;
  googleMapsUrl?: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  multipleTimeSlots: boolean;
  slotDuration: number | null;
  slotRestriction: boolean;
  maxParticipantsPerSlot: number | null;
  repeat: RepeatType;
  requestRSVP: boolean;
  creatorId: string;
  creator: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profilePicture: string | null;
  };
  invitees: InviteeDto[];
  timeSlots: TimeSlotDto[];
  rsvpStats: RSVPStatsDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  type: EventType;
  description?: string;
  location?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  multipleTimeSlots?: boolean;
  slotDuration?: number;
  slotRestriction?: boolean;
  maxParticipantsPerSlot?: number;
  repeat?: RepeatType;
  requestRSVP?: boolean;
  inviteeIds?: string[];
}

export interface UpdateEventDto {
  title?: string;
  type?: EventType;
  description?: string;
  location?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  multipleTimeSlots?: boolean;
  slotDuration?: number;
  slotRestriction?: boolean;
  maxParticipantsPerSlot?: number;
  repeat?: RepeatType;
  requestRSVP?: boolean;
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  filter?: 'all' | 'upcoming' | 'past' | 'my-events';
  type?: EventType;
  month?: number;
  year?: number;
}
