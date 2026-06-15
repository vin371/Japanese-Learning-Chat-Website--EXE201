import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import http from '../../../api/client';
import { BookOpen } from 'lucide-react';
import SpeakJaButton from '../../../components/learn/SpeakJaButton';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LearnVocab() {
  const [vocabList, setVocabList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetching vocabulary for lesson 9 as requested
    http.get('/api/lessons/9/vocabulary')
      .then(res => {
        setVocabList(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="learn-vocab-page p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="learn-vocab-header mb-8 text-center">
        <h2 className="text-3xl font-bold text-red-800 flex items-center justify-center gap-2">
          <BookOpen size={32} />
          Từ vựng Bài 9
        </h2>
        <p className="text-gray-500 mt-2">Danh sách từ vựng chi tiết với phát âm.</p>
      </motion.div>

      {loading ? (
        <div className="text-center p-12 text-gray-500">Đang tải từ vựng...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-6 px-6 text-sm font-semibold text-gray-400 w-16 text-center uppercase tracking-wider">STT</th>
                <th className="py-6 px-6 text-lg font-bold text-red-800">Kanji</th>
                <th className="py-6 px-6 text-lg font-bold text-red-800">Hiragana</th>
                <th className="py-6 px-6 text-lg font-bold text-red-800">Nghĩa</th>
                <th className="py-6 px-6 w-16"></th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {vocabList.map((item, index) => (
                <motion.tr
                  key={item.id}
                  variants={itemVariants}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-5 px-6 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                  <td className="py-5 px-6 text-xl font-medium text-gray-800" lang="ja">
                    {item.reading}
                  </td>
                  <td className="py-5 px-6 text-lg text-gray-700" lang="ja">
                    {item.wordJp}
                  </td>
                  <td className="py-5 px-6 text-lg text-gray-800">
                    {item.meaningVi}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <SpeakJaButton text={item.reading || item.wordJp} label="Nghe phát âm" />
                  </td>
                </motion.tr>
              ))}
              {vocabList.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    Không tìm thấy từ vựng nào cho bài này.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      )}
    </div>
  );
}
