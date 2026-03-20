import React, { useState, useEffect } from 'react';
import { CourseSession } from '../types';
import { X, MapPin, User, Clock, Calendar, FileText, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  session: CourseSession;
  onClose: () => void;
  onSave: (id: string, updatedSession: Partial<CourseSession>) => void;
}

const DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

export function CourseModal({ session, onClose, onSave }: Props) {
  const [courseName, setCourseName] = useState(session.courseName || '');
  const [startTime, setStartTime] = useState(session.startTime || '');
  const [endTime, setEndTime] = useState(session.endTime || '');
  const [location, setLocation] = useState(session.location || '');
  const [teacher, setTeacher] = useState(session.teacher || '');
  const [remark, setRemark] = useState(session.remark || '');

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-xl text-slate-800 pr-4 leading-tight flex items-center gap-2">
            编辑课程
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200/60 shrink-0">
                <BookOpen className="w-4 h-4 text-indigo-500" />
              </div>
              <input 
                type="text"
                className="w-full bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="课程名称"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200/60 shrink-0">
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium px-1">{DAYS[session.dayOfWeek - 1]}</span>
            </div>
            
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200/60 shrink-0">
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="time"
                  className="bg-transparent border-none outline-none font-medium text-slate-800 w-full"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="time"
                  className="bg-transparent border-none outline-none font-medium text-slate-800 w-full"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200/60 shrink-0">
                <MapPin className="w-4 h-4 text-rose-500" />
              </div>
              <input 
                type="text"
                className="w-full bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="上课地点"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200/60 shrink-0">
                <User className="w-4 h-4 text-amber-500" />
              </div>
              <input 
                type="text"
                className="w-full bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="授课教师"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              备注 / 笔记
            </label>
            <textarea 
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none h-24 text-slate-700 placeholder:text-slate-400 transition-all bg-slate-50 focus:bg-white"
              placeholder="在此添加笔记（例如：带笔记本电脑、交作业...）"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSave(session.id, {
                courseName,
                startTime,
                endTime,
                location,
                teacher,
                remark
              });
              onClose();
            }} 
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 rounded-xl transition-all active:scale-[0.98]"
          >
            保存修改
          </button>
        </div>
      </motion.div>
    </div>
  );
}
