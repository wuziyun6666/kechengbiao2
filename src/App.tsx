import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { Timetable } from './components/Timetable';
import { CourseModal } from './components/CourseModal';
import { extractScheduleFromImage } from './lib/gemini';
import { CourseSession } from './types';
import { Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [schedule, setSchedule] = useState<CourseSession[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [semesterStartDate, setSemesterStartDate] = useState<string>('');

  const handleUpload = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const extractedSchedule = await extractScheduleFromImage(base64, mimeType);
      if (extractedSchedule.length === 0) {
        setError("我们无法在该图片中找到任何课表信息，请尝试其他图片。");
      } else {
        setSchedule(extractedSchedule);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生未知错误。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRemark = (id: string, remark: string) => {
    if (!schedule) return;
    setSchedule(schedule.map(session => 
      session.id === id ? { ...session, remark } : session
    ));
  };

  const maxWeek = schedule ? Math.max(20, ...schedule.flatMap(s => s.weeks || [])) : 20;
  const filteredSchedule = schedule ? schedule.filter(s => s.weeks?.includes(currentWeek)) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              智能课程表
            </h1>
          </div>
          {schedule && (
            <button 
              onClick={() => setSchedule(null)}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              重新上传课表
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {!schedule ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center mb-8 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                  将截图转化为智能课程表
                </h2>
                <p className="text-lg text-slate-600">
                  上传您的大学课表图片，我们将自动提取详细信息并为您生成精美的周视图。
                </p>
              </div>

              <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 max-w-2xl w-full"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="timetable"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h2 className="text-xl font-semibold tracking-tight">您的课表</h2>
                  <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-500 font-medium whitespace-nowrap">第一周开始于：</label>
                    <input 
                      type="date" 
                      value={semesterStartDate}
                      onChange={(e) => setSemesterStartDate(e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 text-slate-700"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full lg:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                      disabled={currentWeek <= 1}
                      className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="relative flex items-center justify-center min-w-[5rem]">
                      <select
                        value={currentWeek}
                        onChange={(e) => setCurrentWeek(Number(e.target.value))}
                        className="appearance-none bg-transparent font-semibold text-sm text-center outline-none cursor-pointer hover:text-indigo-600 z-10 w-full"
                      >
                        {Array.from({ length: maxWeek }, (_, i) => i + 1).map(w => (
                          <option key={w} value={w}>第 {w} 周</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setCurrentWeek(w => Math.min(maxWeek, w + 1))}
                      disabled={currentWeek >= maxWeek}
                      className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
                    {filteredSchedule.length} 节课
                  </div>
                </div>
              </div>
              <Timetable 
                fullSchedule={schedule} 
                currentWeek={currentWeek}
                semesterStartDate={semesterStartDate}
                onCourseClick={(session) => setSelectedSession(session)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedSession && (
          <CourseModal 
            session={selectedSession} 
            onClose={() => setSelectedSession(null)} 
            onSave={handleSaveRemark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
