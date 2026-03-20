import React, { useState, useEffect } from 'react';
import { CourseSession } from '../types';
import { X, MapPin, User, Clock, Calendar, FileText, BookOpen, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  session: CourseSession;
  currentWeek: number;
  isNew?: boolean;
  onClose: () => void;
  onSave: (id: string, updatedSession: Partial<CourseSession>) => void;
  onDelete: (id: string, type: 'single' | 'all') => void;
}

const DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

const parseWeeks = (input: string): number[] => {
  const weeks = new Set<number>();
  const parts = input.split(/[,，]/);
  for (const part of parts) {
    const range = part.split('-');
    if (range.length === 2) {
      const start = parseInt(range[0].trim());
      const end = parseInt(range[1].trim());
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) weeks.add(i);
      }
    } else {
      const num = parseInt(part.trim());
      if (!isNaN(num)) weeks.add(num);
    }
  }
  return Array.from(weeks).sort((a, b) => a - b);
};

const formatWeeks = (weeks: number[]): string => {
  if (!weeks || weeks.length === 0) return '';
  // Simple formatting for now
  let result = [];
  let start = weeks[0];
  let end = weeks[0];
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] === end + 1) {
      end = weeks[i];
    } else {
      result.push(start === end ? `${start}` : `${start}-${end}`);
      start = weeks[i];
      end = weeks[i];
    }
  }
  result.push(start === end ? `${start}` : `${start}-${end}`);
  return result.join(', ');
};

export function CourseModal({ session, currentWeek, isNew, onClose, onSave, onDelete }: Props) {
  const [courseName, setCourseName] = useState(session.courseName || '');
  const [dayOfWeek, setDayOfWeek] = useState(session.dayOfWeek || 1);
  const [startTime, setStartTime] = useState(session.startTime || '');
  const [endTime, setEndTime] = useState(session.endTime || '');
  const [location, setLocation] = useState(session.location || '');
  const [teacher, setTeacher] = useState(session.teacher || '');
  const [remark, setRemark] = useState(session.remark || '');
  const [weeksInput, setWeeksInput] = useState(() => {
    if (session.weeks && session.weeks.length > 0) return formatWeeks(session.weeks);
    return currentWeek.toString();
  });
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

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
            {isNew ? '添加课程' : '编辑课程'}
          </h3>
          <div className="flex items-center gap-1">
            {!isNew && !showDeleteOptions && (
              <button 
                onClick={() => setShowDeleteOptions(true)}
                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
                title="删除课程"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {showDeleteOptions && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 rounded-xl p-4 mb-2"
            >
              <div className="flex items-center gap-2 text-red-700 font-medium mb-3">
                <AlertCircle className="w-5 h-5" />
                确认删除该课程？
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onDelete(session.id, 'single')}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  仅删除本周 (第{currentWeek}周)
                </button>
                <button 
                  onClick={() => onDelete(session.id, 'all')}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-left"
                >
                  删除本学期所有该课程
                </button>
                <button 
                  onClick={() => setShowDeleteOptions(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors mt-1"
                >
                  取消
                </button>
              </div>
            </motion.div>
          )}

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
              <select 
                className="w-full bg-transparent border-none outline-none font-medium text-slate-800"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
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
                <Calendar className="w-4 h-4 text-orange-500" />
              </div>
              <input 
                type="text"
                className="w-full bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="上课周数 (如: 1-16, 18)"
                value={weeksInput}
                onChange={(e) => setWeeksInput(e.target.value)}
              />
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
                dayOfWeek,
                startTime,
                endTime,
                location,
                teacher,
                remark,
                weeks: parseWeeks(weeksInput)
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
