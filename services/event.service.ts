import { apiClient, ApiError } from './api';

/** Matches backend EventType enum: conference | fieldtrip | event | holiday */
export type EventType =
  | 'conference'
  | 'fieldtrip'
  | 'event'
  | 'holiday';

export type TimeRepetition = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RSVPStatus = 'pending' | 'going' | 'not_going' | 'maybe';

export interface AuthorResponseDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

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
  rsvpStats: {
    going: number;
    notGoing: number;
    maybe: number;
    pending: number;
  };
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
  startTime?: string; // Format: HH:mm (e.g., "15:00")
  endTime?: string; // Format: HH:mm (e.g., "16:30")
  multipleTimeSlots?: boolean;
  slotDuration?: number; // Duration in minutes
  slotRestriction?: boolean;
  maxParticipantsPerSlot?: number;
  repeat?: RepeatType;
  requestRSVP?: boolean;
  inviteeIds?: string[]; // Array of user IDs to invite
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
  startTime?: string; // Format: HH:mm
  endTime?: string; // Format: HH:mm
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
  month?: number; // 1-12
  year?: number;
}

export interface EventService {
  getAll(params?: GetEventsParams): Promise<{ events: EventResponseDto[], limit: number, page: number, total: number }>;
  getById(id: string): Promise<EventResponseDto>;
  create(data: CreateEventDto): Promise<EventResponseDto>;
  update(id: string, data: UpdateEventDto): Promise<EventResponseDto>;
  delete(id: string): Promise<void>;
  rsvp(id: string, status: RSVPStatus, timeSlotId?: string): Promise<void>;
  getMyEvents(params?: GetEventsParams): Promise<{ events: EventResponseDto[], limit: number, page: number, total: number }>;
}

class EventServiceImpl implements EventService {
  async getAll(params?: GetEventsParams): Promise<{ events: EventResponseDto[], limit: number, page: number, total: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.filter) {
        queryParams.append('filter', params.filter);
      }
      if (params?.type) {
        queryParams.append('type', params.type);
      }
      if (params?.month) {
        queryParams.append('month', params.month.toString());
      }
      if (params?.year) {
        queryParams.append('year', params.year.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/events${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{ events: EventResponseDto[], limit: number, page: number, total: number }>(endpoint);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch events. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getById(id: string): Promise<EventResponseDto> {
    try {
      const response = await apiClient.get<EventResponseDto>(`/events/${id}`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch event. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async create(data: CreateEventDto): Promise<EventResponseDto> {
    try {
      // API expects lowercase event type (conference, fieldtrip, event, holiday)
      const requestData = { ...data, type: data.type };
      const response = await apiClient.post<EventResponseDto>('/events', requestData);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to create event. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async update(id: string, data: UpdateEventDto): Promise<EventResponseDto> {
    try {
      const requestData = { ...data };
      const response = await apiClient.put<EventResponseDto>(`/events/${id}`, requestData);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to update event. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/events/${id}`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to delete event. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async rsvp(id: string, status: RSVPStatus, timeSlotId?: string): Promise<void> {
    try {
      const body: { status: string; timeSlotId?: string } = { status };
      if (timeSlotId) {
        body.timeSlotId = timeSlotId;
      }
      await apiClient.patch(`/events/${id}/rsvp`, body);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to update RSVP. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getMyEvents(params?: GetEventsParams): Promise<{ events: EventResponseDto[], limit: number, page: number, total: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.filter) {
        queryParams.append('filter', params.filter);
      }
      if (params?.type) {
        queryParams.append('type', params.type);
      }
      if (params?.month) {
        queryParams.append('month', params.month.toString());
      }
      if (params?.year) {
        queryParams.append('year', params.year.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/events/my${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{ events: EventResponseDto[], limit: number, page: number, total: number }>(endpoint);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch my events. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const eventService: EventService = new EventServiceImpl();

