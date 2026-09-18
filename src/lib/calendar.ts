import { CompanyEvent } from './types';

// Format Date for iCalendar (YYYYMMDDTHHmmssZ)
const formatIcsDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Generate an RFC 5545 standard .ics file string
export const generateIcsContent = (event: CompanyEvent): string => {
  const dtStamp = formatIcsDate(new Date().toISOString());
  const dtStart = formatIcsDate(event.start_time);
  const dtEnd = formatIcsDate(event.end_time);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PulseBoard//Company Announcements//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:pulseboard-${event.id}@company.internal`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(event.location || 'Company Portal').replace(/[,;]/g, ' ')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

// Trigger direct .ics file download in the browser
export const downloadIcsFile = (event: CompanyEvent) => {
  const icsData = generateIcsContent(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate Google Calendar Link
export const getGoogleCalendarUrl = (event: CompanyEvent): string => {
  const start = formatIcsDate(event.start_time);
  const end = formatIcsDate(event.end_time);
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};
