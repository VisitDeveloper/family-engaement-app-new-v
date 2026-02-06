import { apiClient, ApiError } from './api';
import type {
  EventType,
  EventResponseDto,
  CreateEventDto,
  UpdateEventDto,
  GetEventsParams,
  RepeatType,
  RSVPStatus,
  InviteeDto,
  TimeSlotDto,
  RSVPStatsDto,
} from '@/types';
import type { PaginatedResponse, PaginatedResult } from '@/types';
import { toPaginatedResult } from '@/types';

export type {
  EventType,
  EventResponseDto,
  CreateEventDto,
  UpdateEventDto,
  GetEventsParams,
  RepeatType,
  RSVPStatus,
  InviteeDto,
  TimeSlotDto,
  RSVPStatsDto,
};

export type GetEventsResponse = PaginatedResult<EventResponseDto, 'events'>;

export interface EventService {
  getAll(params?: GetEventsParams): Promise<GetEventsResponse>;
  getById(id: string): Promise<EventResponseDto>;
  create(data: CreateEventDto): Promise<EventResponseDto>;
  update(id: string, data: UpdateEventDto): Promise<EventResponseDto>;
  delete(id: string): Promise<void>;
  rsvp(id: string, status: RSVPStatus, timeSlotId?: string): Promise<void>;
  getMyEvents(params?: GetEventsParams): Promise<GetEventsResponse>;
}

class EventServiceImpl implements EventService {
  async getAll(params?: GetEventsParams): Promise<GetEventsResponse> {
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
      const response = await apiClient.get<PaginatedResponse<EventResponseDto>>(endpoint);
      return toPaginatedResult(response, 'events');
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

  async getMyEvents(params?: GetEventsParams): Promise<GetEventsResponse> {
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
      const response = await apiClient.get<PaginatedResponse<EventResponseDto>>(endpoint);
      return toPaginatedResult(response, 'events');
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

