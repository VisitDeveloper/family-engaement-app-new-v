/**
 * Dashboard API types.
 * GET /dashboard returns different shapes by role (parent vs admin/manager).
 */

// --- Parent Dashboard (GET /dashboard with parent role) ---

export interface ParentNewPosts {
  /** New posts in the last 7 days */
  count: number;
  /** Total posts in scope */
  postsViewed: number;
}

export interface ParentUnreadMessages {
  count: number;
  messagesRead: number;
}

export interface ParentUpcomingEvent {
  id: string;
  title: string;
  date: string;
  timeDisplay?: string | null;
  allDay?: boolean;
}

export interface ParentRecentActivityItem {
  id: string;
  type: 'post' | 'message';
  title: string;
  timeAgo?: string | null;
}

export interface ParentDashboardResponse {
  newPosts: ParentNewPosts;
  unreadMessages: ParentUnreadMessages;
  upcomingEvents: ParentUpcomingEvent[];
  recentActivity: ParentRecentActivityItem[];
}

// --- Admin Dashboard (GET /dashboard with admin / organization_manager / site_manager) ---

export interface DashboardTrend {
  /** e.g. "up", "down", "same" */
  direction?: 'up' | 'down' | 'same';
  /** e.g. "5% from last month" */
  label?: string;
  /** numeric delta for display */
  value?: number;
}

export interface AdminSummaryMetrics {
  activeFamilies: number;
  totalFamilies: number;
  engagementRate: number;
  engagementRateTrend?: DashboardTrend;
  postsSharedThisMonth: number;
  postsSharedTrend?: DashboardTrend;
  messagesSentThisMonth: number;
  messagesSentTrend?: DashboardTrend;
}

export interface TeacherEngagementItem {
  teacherId: string;
  teacherName: string;
  postsCount: number;
  responsesCount: number;
  /** 0–100 */
  engagementPercent: number;
}
export interface AdminDashboardResponse {
  summaryMetrics: SummaryMetric[];
  teacherEngagement: TeacherEngagement[];
}

export interface SummaryMetric {
  value: number | string;
  label: string;
  context?: string;
  trend?: string;
  trendDirection?: string;
}

export interface TeacherEngagement {
  teacherId: string;
  displayName: string;
  postsCount: number;
  responsesCount: number;
  engagementPercent: number;
}

// --- Union for GET /dashboard (backend returns one of these by role) ---

export type DashboardResponse = ParentDashboardResponse | AdminDashboardResponse;

export function isParentDashboardResponse(
  data: DashboardResponse
): data is ParentDashboardResponse {
  return 'newPosts' in data && 'unreadMessages' in data;
}

export function isAdminDashboardResponse(
  data: DashboardResponse
): data is AdminDashboardResponse {
  return 'summaryMetrics' in data && 'teacherEngagement' in data;
}
