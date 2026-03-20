import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';

interface Props {
  onVerify: () => void;
}

export function SliderCaptcha({ onVerify }: Props) {
  const [isVerified, setIsVerified] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    if (containerRef.current) {
      // 48px thumb width + 8px total padding (left 4px + right 4px)
      setConstraints(containerRef.current.offsetWidth - 56);
    }
  }, []);

  const handleDragEnd = (event: any, info: any) => {
    if (isVerified) return;
    
    // If dragged close to the right edge (within 15px)
    if (info.offset.x >= constraints - 15) {
      setIsVerified(true);
      controls.start({ x: constraints });
      setTimeout(() => {
        onVerify();
      }, 400);
    } else {
      // Snap back to start
      controls.start({ x: 0 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center select-none"
    >
      {/* Background fill that expands as you drag - optional, keeping it simple with just the text for now */}
      <span className={`text-sm font-medium z-10 transition-colors duration-300 ${isVerified ? 'text-emerald-600' : 'text-slate-500'}`}>
        {isVerified ? '验证通过' : '请按住滑块，拖动到最右边'}
      </span>
      
      <motion.div
        drag={isVerified ? false : "x"}
        dragConstraints={{ left: 0, right: constraints }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`absolute left-1 top-1 bottom-1 w-12 rounded-lg bg-white shadow-sm border flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-colors duration-300 ${
          isVerified ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
        }`}
      >
        {isVerified ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </motion.div>
    </div>
  );
}
