import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import http from '../../../api/client';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LearnAlphabet() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alphabetType, setAlphabetType] = useState('hiragana'); // 'hiragana' hoặc 'katakana'

  useEffect(() => {
    setLoading(true);
    const lessonId = alphabetType === 'hiragana' ? 7 : 8;
    http.get(`/api/lessons/${lessonId}/vocabulary`)
      .then(res => {
        // Assume data might be in res.data, res.data.items, or res.data.Items depending on standard API response wrapper
        const items = res.data?.items ?? res.data?.Items ?? res.data;
        if (Array.isArray(items)) {
          // Sort by sortOrder if available
          items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setData(items);
        } else {
          setData([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch alphabet', err);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [alphabetType]);

  return (
    <motion.section className="w-full" variants={containerVariants} initial="hidden" animate="show">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {alphabetType === 'hiragana' ? 'Bảng chữ cái Hiragana' : 'Bảng chữ cái Katakana'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {alphabetType === 'hiragana' 
              ? 'Bảng chữ mềm (Hiragana) dùng cho từ thuần Nhật' 
              : 'Bảng chữ cứng (Katakana) dùng cho từ mượn tiếng nước ngoài'}
          </p>
        </div>
        <div className="learn-view-toggle" role="group" aria-label="Chọn loại bảng chữ cái">
          <button
            type="button"
            className={`learn-view-toggle__btn${alphabetType === 'hiragana' ? ' learn-view-toggle__btn--on' : ''}`}
            onClick={() => setAlphabetType('hiragana')}
            aria-pressed={alphabetType === 'hiragana'}
          >
            Hiragana
          </button>
          <button
            type="button"
            className={`learn-view-toggle__btn${alphabetType === 'katakana' ? ' learn-view-toggle__btn--on' : ''}`}
            onClick={() => setAlphabetType('katakana')}
            aria-pressed={alphabetType === 'katakana'}
          >
            Katakana
          </button>
        </div>
      </div>

      {loading ? (
        <p className="learn-track__loading py-8">Đang tải bảng chữ cái...</p>
      ) : data.length === 0 ? (
        <p className="learn-track__empty py-8 text-center text-slate-500">Không tìm thấy dữ liệu bảng chữ cái.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 py-2">
          {data.map(item => (
            <motion.div 
              key={`${alphabetType}-${item.id}`} 
              className="flex flex-col items-center justify-center bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg py-6 px-2 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#b72025] dark:hover:border-[#b72025]"
              variants={itemVariants}
            >
              <div className="text-[1.85rem] font-bold text-slate-800 dark:text-slate-100 mb-1 leading-none" lang="ja">{item.wordJp}</div>
              <div className="text-[0.9rem] text-slate-500 dark:text-slate-400 font-semibold">{item.reading}</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
