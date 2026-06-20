-- Bài test đầu vào: giữ 20 câu (7 N5, 7 N4, 6 N3) — xóa 20 câu không dùng.
-- Khớp PlacementActiveQuestionIds trong AssessmentService.cs

BEGIN;

-- Cập nhật metadata đề test
UPDATE placement_tests
SET total_questions = 20,
    duration_minutes = 15,
    description = 'Bài test giúp đánh giá trình độ N5/N4/N3 (20 câu: 7 N5, 7 N4, 6 N3).',
    updated_at = NOW()
WHERE id = 1;

-- Xóa đáp án của câu bị loại
DELETE FROM placement_question_options
WHERE question_id IN (2, 4, 6, 7, 9, 11, 13, 14, 17, 19, 21, 22, 24, 25, 27, 29, 32, 34, 35, 38);

-- Xóa câu hỏi không dùng
DELETE FROM placement_questions
WHERE id IN (2, 4, 6, 7, 9, 11, 13, 14, 17, 19, 21, 22, 24, 25, 27, 29, 32, 34, 35, 38);

-- Sắp xếp lại sort_order 1..20 cho 20 câu còn lại
UPDATE placement_questions SET sort_order = 1  WHERE id = 1;
UPDATE placement_questions SET sort_order = 2  WHERE id = 3;
UPDATE placement_questions SET sort_order = 3  WHERE id = 5;
UPDATE placement_questions SET sort_order = 4  WHERE id = 8;
UPDATE placement_questions SET sort_order = 5  WHERE id = 10;
UPDATE placement_questions SET sort_order = 6  WHERE id = 12;
UPDATE placement_questions SET sort_order = 7  WHERE id = 15;
UPDATE placement_questions SET sort_order = 8  WHERE id = 16;
UPDATE placement_questions SET sort_order = 9  WHERE id = 18;
UPDATE placement_questions SET sort_order = 10 WHERE id = 20;
UPDATE placement_questions SET sort_order = 11 WHERE id = 23;
UPDATE placement_questions SET sort_order = 12 WHERE id = 26;
UPDATE placement_questions SET sort_order = 13 WHERE id = 28;
UPDATE placement_questions SET sort_order = 14 WHERE id = 30;
UPDATE placement_questions SET sort_order = 15 WHERE id = 31;
UPDATE placement_questions SET sort_order = 16 WHERE id = 33;
UPDATE placement_questions SET sort_order = 17 WHERE id = 36;
UPDATE placement_questions SET sort_order = 18 WHERE id = 37;
UPDATE placement_questions SET sort_order = 19 WHERE id = 39;
UPDATE placement_questions SET sort_order = 20 WHERE id = 40;

COMMIT;

-- Kiểm tra:
-- SELECT COUNT(*) FROM placement_questions;
-- SELECT id, level_label, sort_order FROM placement_questions ORDER BY sort_order;
-- SELECT total_questions, duration_minutes FROM placement_tests WHERE id = 1;
