import React, { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { Timetable } from './components/Timetable';
import { CourseModal } from './components/CourseModal';
import { CaptchaModal } from './components/CaptchaModal';
import { extractScheduleFromImage } from './lib/gemini';
import { CourseSession } from './types';
import { Calendar, AlertCircle, ChevronLeft, ChevronRight, Download, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [schedule, setSchedule] = useState<CourseSession[] | null>(() => {
    const saved = localStorage.getItem('timetable_schedule');
    return saved ? JSON.parse(saved) : null;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{base64: string, mimeType: string} | null>(null);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);
  
  const [semesterStartDate, setSemesterStartDate] = useState<string>(() => {
    const saved = localStorage.getItem('timetable_startDate');
    if (saved) return saved;
    
    // Default to Monday of the current week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Listen for PWA install prompt
  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      // Fallback for iOS or browsers that don't support the prompt API
      setShowInstallGuide(true);
    }
  };

  // Auto-calculate current week based on start date
  useEffect(() => {
    if (semesterStartDate) {
      const start = new Date(semesterStartDate);
      const now = new Date();
      start.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      setCurrentWeek(Math.max(1, week));
    }
  }, [semesterStartDate]);

  // Persist schedule
  useEffect(() => {
    if (schedule) {
      localStorage.setItem('timetable_schedule', JSON.stringify(schedule));
    } else {
      localStorage.removeItem('timetable_schedule');
    }
  }, [schedule]);

  // Persist start date
  useEffect(() => {
    if (semesterStartDate) {
      localStorage.setItem('timetable_startDate', semesterStartDate);
    }
  }, [semesterStartDate]);

  const handleImageSelect = (base64: string, mimeType: string) => {
    setError(null);
    setPendingUpload({ base64, mimeType });
  };

  const processUpload = async () => {
    if (!pendingUpload) return;
    
    const { base64, mimeType } = pendingUpload;
    setPendingUpload(null);
    setIsProcessing(true);
    setError(null);
    
    try {
      const extractedSchedule = await extractScheduleFromImage(base64, mimeType);
      if (extractedSchedule.length === 0) {
        setError("我们无法在该图片中找到任何课表信息，请尝试其他图片。");
      } else {
        setSchedule(extractedSchedule);
        setShowSuccessPrompt(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生未知错误。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCourse = (id: string, updatedSession: Partial<CourseSession>) => {
    if (!schedule) return;
    setSchedule(schedule.map(session => 
      session.id === id ? { ...session, ...updatedSession } : session
    ));
  };

  const handleAddCourse = (id: string, newSession: Partial<CourseSession>) => {
    if (!schedule) return;
    const session: CourseSession = {
      id: Math.random().toString(36).substr(2, 9),
      courseName: newSession.courseName || '新课程',
      dayOfWeek: newSession.dayOfWeek || 1,
      startTime: newSession.startTime || '08:00',
      endTime: newSession.endTime || '09:40',
      location: newSession.location || '',
      teacher: newSession.teacher || '',
      remark: newSession.remark || '',
      weeks: newSession.weeks || [currentWeek],
      color: `hsl(${Math.random() * 360}, 70%, 85%)`
    };
    setSchedule([...schedule, session]);
    setIsAddingCourse(false);
  };

  const handleDeleteCourse = (id: string, deleteType: 'single' | 'all') => {
    if (!schedule) return;
    if (deleteType === 'all') {
      setSchedule(schedule.filter(s => s.id !== id));
    } else if (deleteType === 'single') {
      setSchedule(schedule.map(s => {
        if (s.id === id) {
          const newWeeks = (s.weeks || []).filter(w => w !== currentWeek);
          return { ...s, weeks: newWeeks };
        }
        return s;
      }).filter(s => s.weeks && s.weeks.length > 0));
    }
    setSelectedSession(null);
  };

  const maxWeek = schedule ? Math.max(20, ...schedule.flatMap(s => s.weeks || [])) : 20;
  const filteredSchedule = schedule ? schedule.filter(s => s.weeks?.includes(currentWeek)) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg text-white">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
              智能课程表
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                下载 App
              </button>
            )}
            {schedule && (
              <button 
                onClick={() => {
                  if (window.confirm('确定要删除当前课表并重新上传吗？')) {
                    setSchedule(null);
                  }
                }}
                className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
              >
                删除并重新上传
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8">
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

              <UploadZone onUpload={handleImageSelect} isProcessing={isProcessing} />

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
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">第一周：</label>
                    <input 
                      type="date" 
                      value={semesterStartDate}
                      onChange={(e) => setSemesterStartDate(e.target.value)}
                      className="text-xs sm:text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 text-slate-700"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                      disabled={currentWeek <= 1}
                      className="p-1 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="relative flex items-center justify-center min-w-[4.5rem]">
                      <select
                        value={currentWeek}
                        onChange={(e) => setCurrentWeek(Number(e.target.value))}
                        className="appearance-none bg-transparent font-semibold text-xs sm:text-sm text-center outline-none cursor-pointer hover:text-indigo-600 z-10 w-full"
                      >
                        {Array.from({ length: maxWeek }, (_, i) => i + 1).map(w => (
                          <option key={w} value={w}>第 {w} 周</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setCurrentWeek(w => Math.min(maxWeek, w + 1))}
                      disabled={currentWeek >= maxWeek}
                      className="p-1 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                      {filteredSchedule.length} 节课
                    </div>
                    <button
                      onClick={() => setIsAddingCourse(true)}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加
                    </button>
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
        <CaptchaModal 
          isOpen={!!pendingUpload}
          onClose={() => setPendingUpload(null)}
          onVerify={processUpload}
        />
        {isAddingCourse && (
          <CourseModal 
            session={{
              id: 'new',
              courseName: '',
              dayOfWeek: 1,
              startTime: '08:00',
              endTime: '09:40',
              location: '',
              teacher: '',
              remark: '',
              weeks: [currentWeek],
              color: ''
            }} 
            currentWeek={currentWeek}
            isNew={true}
            onClose={() => setIsAddingCourse(false)} 
            onSave={handleAddCourse}
            onDelete={() => {}}
          />
        )}
        {selectedSession && (
          <CourseModal 
            session={selectedSession} 
            currentWeek={currentWeek}
            onClose={() => setSelectedSession(null)} 
            onSave={handleSaveCourse}
            onDelete={handleDeleteCourse}
          />
        )}
        {showSuccessPrompt && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start p-5 border-b border-slate-100 bg-emerald-50/50">
                <h3 className="font-semibold text-xl text-slate-800 flex items-center gap-2">
                  <span className="text-emerald-500">✨</span> 识别成功
                </h3>
                <button onClick={() => setShowSuccessPrompt(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 text-slate-600">
                <p className="text-sm leading-relaxed mb-4">
                  课表已成功生成！为了防止 AI 识别出现偏差，<strong>请您务必仔细核对一遍</strong>。
                </p>
                <p className="text-sm leading-relaxed">
                  如果发现任何错误（如课程名称不对、时间错误、多课或少课），您可以直接<strong>点击对应的课程色块</strong>进行手动修改或删除。
                </p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setShowSuccessPrompt(false)} className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all">
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showInstallGuide && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-xl text-slate-800">如何下载 App</h3>
                <button onClick={() => setShowInstallGuide(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">🍎 苹果 (iOS) 用户</h4>
                  <p className="text-sm leading-relaxed">由于苹果系统限制，无法一键下载。请在 <strong>Safari 浏览器</strong> 中打开本网页，点击屏幕正下方的 <strong>「分享」</strong> 图标（一个方块加向上箭头），然后向下滑动菜单，找到并点击 <strong>「添加到主屏幕」</strong>。</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">🤖 安卓 (Android) 用户</h4>
                  <p className="text-sm leading-relaxed">请点击浏览器右上角的 <strong>「菜单」</strong>（三个点），然后选择 <strong>「添加到主屏幕」</strong> 或 <strong>「安装应用」</strong>。</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setShowInstallGuide(false)} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all">
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
