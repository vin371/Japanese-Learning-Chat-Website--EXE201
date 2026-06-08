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

  useEffect(() => {
    http.get('/api/lessons/7/vocabulary')
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="learn-track__loading">Đang tải bảng chữ cái...</p>;
  }

  return (
    <motion.section className="w-full" variants={containerVariants} initial="hidden" animate="show">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 py-4">
        {data.map(item => (
          <motion.div 
            key={item.id} 
            className="flex flex-col items-center justify-center bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg py-6 px-2 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#b72025] dark:hover:border-[#b72025]"
            variants={itemVariants}
          >
            <div className="text-[1.85rem] font-bold text-slate-800 dark:text-slate-100 mb-1 leading-none" lang="ja">{item.wordJp}</div>
            <div className="text-[0.9rem] text-slate-500 dark:text-slate-400 font-semibold">{item.reading}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
