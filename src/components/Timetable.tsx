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

  const visibleSchedule = fullSchedule.filter(s => s.weeks?.includes(currentWeek));

  // Extract unique start times to create rows (Method B: sequential slots, no gaps)
  const timeSlots = Array.from(new Set(visibleSchedule.map(s => s.startTime)))
    .filter(Boolean)
    .sort((a, b) => getMinutesFromStart(a) - getMinutesFromStart(b));

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)] min-h-[500px]">
      {/* Scrollable Container */}
      <div className="overflow-x-auto flex-1 flex flex-col snap-x snap-mandatory hide-scrollbar">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        <div className="flex flex-col min-w-max sm:min-w-full flex-1">
          
          {/* Header: Days of the week */}
          <div className="flex border-b border-slate-200 bg-slate-50/90 backdrop-blur-md sticky top-0 z-30">
            <div className="w-10 sm:w-14 shrink-0 sticky left-0 z-40 bg-slate-50/90 backdrop-blur-md border-r border-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-medium text-slate-500">
              时间
            </div>
            {DAYS.map((day, index) => (
              <div 
                key={day} 
                className="w-[19vw] min-w-[4.5rem] sm:w-0 sm:flex-1 shrink-0 border-r border-slate-200 last:border-r-0 py-2 sm:py-3 flex flex-col items-center justify-center snap-start"
              >
                <span className="text-xs sm:text-sm font-semibold text-slate-700">{day}</span>
                {semesterStartDate && (
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">{getDayDate(index)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Body: Course Slots */}
          <div className="flex-1 flex flex-col bg-slate-50/30">
            {timeSlots.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                本周没有课程安排
              </div>
            ) : (
              timeSlots.map((slotTime, slotIndex) => {
                const coursesInSlot = visibleSchedule.filter(s => s.startTime === slotTime);
                // Get the most common end time for this slot to display in the left column
                const endTimes = coursesInSlot.map(s => s.endTime).filter(Boolean);
                const displayEndTime = endTimes.length > 0 ? endTimes.sort((a,b) =>
                  endTimes.filter(v => v===a).length - endTimes.filter(v => v===b).length
                ).pop() : '';

                return (
                  <div key={slotTime} className="flex border-b border-slate-200 last:border-b-0 flex-1 min-h-[6rem] sm:min-h-[7rem]">
                    {/* Time Column */}
                    <div className="w-10 sm:w-14 shrink-0 sticky left-0 z-20 bg-white/90 backdrop-blur-sm border-r border-slate-200 flex flex-col items-center justify-center py-2 px-1">
                      <span className="text-[10px] sm:text-xs font-bold text-indigo-600">{slotTime}</span>
                      {displayEndTime && (
                        <span className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5">{displayEndTime}</span>
                      )}
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((_, dayIndex) => {
                      const dayOfWeek = dayIndex + 1;
                      const sessions = coursesInSlot.filter(s => s.dayOfWeek === dayOfWeek);

                      return (
                        <div 
                          key={dayIndex} 
                          className="w-[19vw] min-w-[4.5rem] sm:w-0 sm:flex-1 shrink-0 border-r border-slate-200 last:border-r-0 p-1 sm:p-1.5 flex flex-col gap-1 snap-start"
                        >
                          {sessions.map((session, idx) => (
                            <div
                              key={session.id || idx}
                              onClick={() => onCourseClick(session)}
                              className={`flex-1 rounded-lg border p-1.5 sm:p-2 shadow-sm transition-all hover:shadow-md cursor-pointer flex flex-col ${courseColorMap[session.courseName] || PALETTE[0]}`}
                            >
                              <div className="font-bold text-[10px] sm:text-xs leading-tight mb-1 break-words">
                                {session.courseName}
                              </div>
                              <div className="mt-auto space-y-0.5 sm:space-y-1">
                                {session.location && (
                                  <div className="text-[8px] sm:text-[10px] opacity-90 flex items-start gap-0.5">
                                    <MapPin className="w-2.5 h-2.5 inline mt-[1px] shrink-0" />
                                    <span className="leading-tight break-words">{session.location}</span>
                                  </div>
                                )}
                                {session.teacher && (
                                  <div className="text-[8px] sm:text-[10px] opacity-90 flex items-start gap-0.5">
                                    <User className="w-2.5 h-2.5 inline mt-[1px] shrink-0" />
                                    <span className="leading-tight break-words">{session.teacher}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
