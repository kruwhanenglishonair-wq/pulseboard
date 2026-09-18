import { NextResponse } from 'next/server';
import { MOCK_EVENTS } from '@/lib/mockData';
import { generateIcsContent } from '@/lib/calendar';

export async function GET() {
  const vEvents = MOCK_EVENTS.map((event) => {
    return generateIcsContent(event);
  }).join('\r\n');

  const fullIcs = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PulseBoard//Company Calendar Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Company Announcements & Events',
    'X-WR-TIMEZONE:Asia/Bangkok',
    vEvents,
    'END:VCALENDAR'
  ].join('\r\n');

  return new NextResponse(fullIcs, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="company-calendar.ics"'
    }
  });
}
