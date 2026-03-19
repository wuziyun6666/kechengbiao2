import React, { useMemo } from 'react';
import { CourseSession } from '../types';
import { MapPin, User, Clock, FileText } from 'lucide-react';

interface TimetableProps {
  fullSchedule: CourseSession[];
  currentWeek: number;
  semesterStartDate?: string;
  onCourseClick: (session: CourseSession) => void;
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PIXELS_PER_MINUTE = 2.5; // Increased for better text visibility

const PALETTE = [
  'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200/80',
  'bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200/80',
  'bg-violet-100 text-violet-900 border-violet-200 hover:bg-violet-200/80',
  'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200/80',
  'bg-pink-100 text-pink-900 border-pink-200 hover:bg-pink-200/80',
  'bg-cyan-100 text-cyan-900 border-cyan-200 hover:bg-cyan-200/80',
  'bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200/80',
  'bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200/80',
  'bg-teal-100 text-teal-900 border-teal-200 hover:bg-teal-200/80',
  'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200 hover:bg-fuchsia-200/80',
  'bg-orange-100 text-orange-900 border-orange-200 hover:bg-orange-200/80',
  'bg-lime-100 text-lime-900 border-lime-200 hover:bg-lime-200/80',
  'bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200/80',
  'bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200/80',
];

const getMinutesFromStart = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export function Timetable({ fullSchedule, currentWeek, semesterStartDate, onCourseClick }: TimetableProps) {
  const courseColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIndex = 0;
    
    // Sort to ensure consistent color assignment
    const uniqueCourses = Array.from(new Set(fullSchedule.map(s => s.courseName))).sort();
    
    uniqueCourses.forEach(courseName => {
      map[courseName] = PALETTE[colorIndex % PALETTE.length];
      colorIndex++;
    });
    return map;
  }, [fullSchedule]);

  const getDayDate = (dayIndex: number) => {
    if (!semesterStartDate) return null;
    const [year, month, day] = semesterStartDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    
    const targetDate = new Date(year, month - 1, day);
    targetDate.setDate(targetDate.getDate() + (currentWeek - 1) * 7 + dayIndex);
    
    return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
  };

  const timeSet = new Set<string>();
  if (fullSchedule.length > 0) {
    fullSchedule.forEach(s => {
      if (s.startTime) timeSet.add(s.startTime);
      if (s.endTime) timeSet.add(s.endTime);
    });
  } else {
    timeSet.add("08:00");
    timeSet.add("22:00");
  }

  const uniqueTimes = Array.from(timeSet).sort((a, b) => getMinutesFromStart(a) - getMinutesFromStart(b));
  
  // Add 30 minutes padding to the top and bottom for better aesthetics
  const minMins = Math.max(0, getMinutesFromStart(uniqueTimes[0]) - 30);
  const maxMins = Math.min(24 * 60, getMinutesFromStart(uniqueTimes[uniqueTimes.length - 1]) + 30);
  
  const totalMins = Math.max(maxMins - minMins, 60); // At least 60 mins to avoid 0 height

  const visibleSchedule = fullSchedule.filter(s => s.weeks?.includes(currentWeek));
  
  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[600px] max-h-[800px]">
      {/* Header: Days of the week */}
      <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-20">
        <div className="p-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200 flex items-center justify-center">
          时间
        </div>
        {DAYS.map((day, index) => (
          <div key={day} className="p-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-slate-700">{day}</span>
            {semesterStartDate && (
              <span className="text-xs font-medium text-slate-500 mt-0.5">{getDayDate(index)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable Grid Area */}
      <div className="flex-1 overflow-y-auto relative bg-slate-50/30">
        <div className="grid grid-cols-8 relative" style={{ height: `${totalMins * PIXELS_PER_MINUTE}px`, minHeight: '100%' }}>
          
          {/* Time Column & Horizontal Grid Lines */}
          <div className="col-span-1 border-r border-slate-200 relative bg-white z-10">
            {uniqueTimes.map((time) => {
              const topPos = (getMinutesFromStart(time) - minMins) * PIXELS_PER_MINUTE;
              return (
                <div 
                  key={time} 
                  className="absolute w-full text-right pr-4 text-xs font-bold text-indigo-600"
                  style={{ top: `${topPos}px`, transform: 'translateY(-50%)' }}
                >
                  {time}
                </div>
              );
            })}
          </div>

          {/* Vertical Day Columns & Horizontal Lines */}
          <div className="col-span-7 grid grid-cols-7 relative">
            {/* Horizontal Lines */}
            {uniqueTimes.map((time) => {
              const topPos = (getMinutesFromStart(time) - minMins) * PIXELS_PER_MINUTE;
              return (
                <div 
                  key={`line-${time}`} 
                  className="absolute w-full border-t border-slate-200 pointer-events-none"
                  style={{ top: `${topPos}px` }}
                />
              );
            })}
            
            {/* Vertical Lines */}
            {DAYS.map((_, i) => (
              <div key={`v-line-${i}`} className="border-r border-slate-200 last:border-r-0 h-full" />
            ))}

            {/* Course Cards */}
            {visibleSchedule.map((session, idx) => {
              const startMins = getMinutesFromStart(session.startTime);
              const endMins = getMinutesFromStart(session.endTime);
              const duration = endMins - startMins;
              
              if (isNaN(startMins) || isNaN(endMins) || duration <= 0 || session.dayOfWeek < 1 || session.dayOfWeek > 7) {
                return null;
              }

              const top = (startMins - minMins) * PIXELS_PER_MINUTE;
              const height = duration * PIXELS_PER_MINUTE;
              const colorClass = courseColorMap[session.courseName] || PALETTE[0];

              return (
                <div
                  key={`${session.id || idx}`}
                  onClick={() => onCourseClick(session)}
                  className={`absolute rounded-xl border p-2 shadow-sm overflow-y-auto transition-all hover:shadow-md hover:z-30 flex flex-col cursor-pointer ${colorClass}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(${(session.dayOfWeek - 1) * (100 / 7)}% + 4px)`,
                    width: `calc(${100 / 7}% - 8px)`,
                    // Hide scrollbar for cleaner look but keep scrollability
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <style>{`
                    div::-webkit-scrollbar { display: none; }
                  `}</style>
                  
                  <div className="font-bold text-sm leading-tight mb-1">
                    {session.courseName}
                  </div>
                  <div className="text-xs opacity-80 mb-1.5 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 inline" />
                    {session.startTime} - {session.endTime}
                  </div>
                  
                  <div className="mt-auto space-y-1.5">
                    {session.location && (
                      <div className="text-xs opacity-90 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 inline mt-0.5 shrink-0" />
                        <span className="leading-snug">{session.location}</span>
                      </div>
                    )}
                    {session.teacher && (
                      <div className="text-xs opacity-90 flex items-start gap-1">
                        <User className="w-3.5 h-3.5 inline mt-0.5 shrink-0" />
                        <span className="leading-snug">{session.teacher}</span>
                      </div>
                    )}
                    {session.remark && (
                      <div className="text-xs opacity-100 font-medium bg-white/40 p-1.5 rounded-md flex items-start gap-1 mt-2 border border-white/30">
                        <FileText className="w-3.5 h-3.5 inline mt-0.5 shrink-0" />
                        <span className="leading-snug italic">{session.remark}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
