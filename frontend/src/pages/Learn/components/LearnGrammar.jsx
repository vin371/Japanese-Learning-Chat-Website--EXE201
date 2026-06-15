import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import http from '../../../api/client';
import { SpellCheck } from 'lucide-react';
import SpeakJaButton from '../../../components/learn/SpeakJaButton';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LearnGrammar() {
  const [grammarList, setGrammarList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetching grammar for lesson 9 as requested
    http.get('/api/lessons/9/grammar')
      .then(res => {
        setGrammarList(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="learn-grammar-page p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="learn-grammar-header mb-8 text-center">
        <h2 className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
          <SpellCheck size={32} />
          Ngữ pháp Bài 9
        </h2>
        <p className="text-gray-500 mt-2">Các cấu trúc ngữ pháp trọng tâm và ví dụ minh họa.</p>
      </motion.div>

      {loading ? (
        <div className="text-center p-12 text-gray-500">Đang tải ngữ pháp...</div>
      ) : (
        <motion.div 
          className="flex flex-col gap-6 max-w-4xl mx-auto" 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
        >
          {grammarList.map((item) => (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-lg"
              whileHover={{ y: -2 }}
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-gray-200">
                <h3 className="text-2xl font-bold text-blue-700 m-0" lang="ja">
                  {item.pattern}
                </h3>
                <SpeakJaButton text={item.pattern} label="Nghe mẫu ngữ pháp" />
              </div>
              
              <p className="text-lg text-gray-800 mb-6 font-medium">
                Ý nghĩa: {item.meaningVi}
              </p>

              {item.examples && item.examples.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Ví dụ</h4>
                  <ul className="list-none p-0 m-0 flex flex-col gap-4">
                    {item.examples.map((ex, idx) => (
                      <li key={idx} className="flex flex-col gap-1">
                        <div className="flex gap-2 items-start">
                          <span className="text-lg text-gray-800" lang="ja">{ex.jp}</span>
                          <SpeakJaButton text={ex.jp} />
                        </div>
                        {ex.romaji && <span className="text-sm text-gray-400">{ex.romaji}</span>}
                        <span className="text-base text-gray-600">{ex.vi}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
          {grammarList.length === 0 && !loading && (
            <p className="text-center text-gray-500">
              Không tìm thấy ngữ pháp nào cho bài này.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
