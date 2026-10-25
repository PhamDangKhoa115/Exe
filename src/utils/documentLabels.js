// Display labels only. Backend enum values and unknown external labels stay intact.
const DOCUMENT_TYPES = {
  MEETING_MINUTES: 'Meeting Minutes',
  EVENT_PLAN: 'Event Plan',
  REPORT: 'Report',
  FINANCE: 'Finance',
  OTHER: 'Other',
};
const DOCUMENT_CATEGORIES = { EVENT: 'Event', CLUB_ACTIVITY: 'Club Activity' };
export function documentTypeLabel(value, fallback) {
  return DOCUMENT_TYPES[value] || fallback || value;
}
export function documentCategoryLabel(value, fallback) {
  return DOCUMENT_CATEGORIES[value] || fallback || value;
}
