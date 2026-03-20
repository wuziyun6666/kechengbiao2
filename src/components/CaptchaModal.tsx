import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { SliderCaptcha } from './SliderCaptcha';

interface Props {
  isOpen: boolean;
  onVerify: () => void;
  onClose: () => void;
}

export function CaptchaModal({ isOpen, onVerify, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            安全验证
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6 text-center">
            为了防止恶意上传，请完成下方的人机验证。
          </p>
          <SliderCaptcha onVerify={onVerify} />
        </div>
      </motion.div>
    </div>
  );
}
