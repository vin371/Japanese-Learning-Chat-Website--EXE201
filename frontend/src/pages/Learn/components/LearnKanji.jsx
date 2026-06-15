import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import http from '../../../api/client';
import { Languages } from 'lucide-react';
import SpeakJaButton from '../../../components/learn/SpeakJaButton';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LearnKanji() {
  const [kanjiList, setKanjiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetching kanji for lesson 9 as requested
    http.get('/api/lessons/9/kanji')
      .then(res => {
        setKanjiList(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="learn-kanji-page p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="learn-kanji-header mb-8 text-center">
        <h2 className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
          <Languages size={32} />
          Hán tự Bài 9
        </h2>
        <p className="text-gray-500 mt-2">Danh sách Hán tự, âm đọc và ví dụ minh họa.</p>
      </motion.div>

      {loading ? (
        <div className="text-center p-12 text-gray-500">Đang tải Hán tự...</div>
      ) : (
        <motion.div 
          className="grid gap-6" 
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
        >
          {kanjiList.map((item) => (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-6 border-b border-dashed border-gray-200 pb-4">
                <div 
                  className="text-5xl font-bold text-blue-800 flex items-center justify-center w-20 h-20 bg-gray-50 rounded-xl" 
                  lang="ja"
                >
                  {item.char}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-800 m-0 mb-2">
                    Nghĩa: <span className="text-blue-600">{item.vi}</span>
                  </p>
                  {item.reading && (
                    <div className="flex items-center gap-2">
                      <span className="text-base text-gray-500" lang="ja">
                        {item.reading}
                      </span>
                      <SpeakJaButton text={item.reading} />
                    </div>
                  )}
                </div>
              </div>
              
              {item.ex && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">
                    Ví dụ
                  </p>
                  <div className="flex gap-2 items-start">
                    <p className="text-lg text-gray-700 m-0" lang="ja">
                      {item.ex}
                    </p>
                    <SpeakJaButton text={item.ex} />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {kanjiList.length === 0 && !loading && (
            <p className="col-span-full text-center text-gray-500">
              Không tìm thấy Hán tự nào cho bài này.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
