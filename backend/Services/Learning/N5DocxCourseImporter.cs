using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using backend.Data;
using backend.Models.Learning;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Learning;

/// <summary>Import khóa N5 từ 3 file DOCX (từ vựng, ngữ pháp, hán tự) — phân bài theo chủ đề.</summary>
public static class N5DocxCourseImporter
{
    private static readonly Regex LessonHeaderRx = new(
        @"^Bài\s*(\d+)\s*[:：\-–]\s*(.+)$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex LevelSectionRx = new(
        @"\bN([345])\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static async Task<int> RunAsync(ApplicationDbContext db, string importDir, bool dryRun = false)
    {
        var vocabPath = FindDocx(importDir, "vựng", "vung");
        var grammarPath = FindDocx(importDir, "pháp", "phap", "Pháp");
        var kanjiPath = FindDocx(importDir, "hán", "han", "Hán", "Tự");

        if (vocabPath == null || grammarPath == null || kanjiPath == null)
            throw new FileNotFoundException(
                $"Thiếu file DOCX trong {importDir}. Cần: Từ vựng, Ngữ pháp, Hán tự N5-N3.");

        Console.WriteLine($"[import-n5] Vocab:   {Path.GetFileName(vocabPath)}");
        Console.WriteLine($"[import-n5] Grammar: {Path.GetFileName(grammarPath)}");
        Console.WriteLine($"[import-n5] Kanji:   {Path.GetFileName(kanjiPath)}");

        var vocabLessons = ParseVocabDocx(vocabPath);
        var grammarLessons = ParseGrammarDocx(grammarPath);
        var kanjiLessons = ParseKanjiDocx(kanjiPath);

        Console.WriteLine($"[import-n5] N5 — từ vựng: {vocabLessons.Count} bài, ngữ pháp: {grammarLessons.Count} bài, kanji: {kanjiLessons.Count} bài");

        if (dryRun)
        {
            foreach (var l in vocabLessons)
                Console.WriteLine($"  vocab #{l.Number} {l.Title} ({l.VocabRows.Count} từ)");
            foreach (var l in grammarLessons)
                Console.WriteLine($"  grammar #{l.Number} {l.Title} ({l.GrammarRows.Count} mẫu)");
            foreach (var l in kanjiLessons)
                Console.WriteLine($"  kanji #{l.Number} {l.Title} ({l.KanjiRows.Count} chữ)");
            return 0;
        }

        var n5CategoryIds = await db.LessonCategories
            .Where(c => c.LevelId == 1)
            .Select(c => c.Id)
            .ToListAsync();

        var lessonIds = await db.Lessons
            .Where(l => n5CategoryIds.Contains(l.CategoryId))
            .Select(l => l.Id)
            .ToListAsync();

        if (lessonIds.Count > 0)
        {
            var quiz = await db.LessonQuizQuestions.Where(q => lessonIds.Contains(q.LessonId)).ToListAsync();
            db.LessonQuizQuestions.RemoveRange(quiz);
            var vocab = await db.VocabularyItems.Where(v => v.LessonId != null && lessonIds.Contains(v.LessonId.Value)).ToListAsync();
            db.VocabularyItems.RemoveRange(vocab);
            var kanji = await db.KanjiItems.Where(k => k.LessonId != null && lessonIds.Contains(k.LessonId.Value)).ToListAsync();
            db.KanjiItems.RemoveRange(kanji);
            var grammar = await db.GrammarItems.Where(g => g.LessonId != null && lessonIds.Contains(g.LessonId.Value)).ToListAsync();
            db.GrammarItems.RemoveRange(grammar);
            var progress = await db.UserLessonProgresses.Where(p => lessonIds.Contains(p.LessonId)).ToListAsync();
            db.UserLessonProgresses.RemoveRange(progress);
            var lessons = await db.Lessons.Where(l => lessonIds.Contains(l.Id)).ToListAsync();
            db.Lessons.RemoveRange(lessons);
            await db.SaveChangesAsync();
            Console.WriteLine($"[import-n5] Đã xóa {lessons.Count} bài N5 cũ.");
        }

        var now = DateTime.UtcNow;
        var catVocab = await db.LessonCategories.FirstAsync(c => c.Id == 1);
        var catGrammar = await db.LessonCategories.FirstAsync(c => c.Id == 2);
        var catKanji = await db.LessonCategories.FirstAsync(c => c.Id == 3);

        var inserted = 0;
        inserted += await InsertVocabLessons(db, catVocab.Id, vocabLessons, now);
        inserted += await InsertGrammarLessons(db, catGrammar.Id, grammarLessons, now);
        inserted += await InsertKanjiLessons(db, catKanji.Id, kanjiLessons, now);

        Console.WriteLine($"[import-n5] Hoàn tất — {inserted} bài mới trên Supabase.");
        return inserted;
    }

    private static string? FindDocx(string dir, params string[] hints)
    {
        if (!Directory.Exists(dir)) return null;
        foreach (var f in Directory.EnumerateFiles(dir, "*.docx"))
        {
            var name = Path.GetFileName(f);
            if (hints.Any(h => name.Contains(h, StringComparison.OrdinalIgnoreCase)))
                return f;
        }
        return null;
    }

    private static async Task<int> InsertVocabLessons(
        ApplicationDbContext db, int categoryId, List<ParsedLesson> lessons, DateTime now)
    {
        var count = 0;
        foreach (var pl in lessons.OrderBy(l => l.Number))
        {
            var slug = Slugify($"n5-vocab-bai-{pl.Number}-{pl.Title}");
            var lesson = new Lesson
            {
                CategoryId = categoryId,
                Title = pl.Title,
                Slug = slug,
                Content = BuildVocabIntroHtml(pl),
                SortOrder = pl.Number,
                EstimatedMinutes = Math.Clamp(pl.VocabRows.Count / 3 + 5, 10, 45),
                IsPremium = false,
                IsPublished = true,
                CreatedAt = now,
                UpdatedAt = now,
            };
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();

            var order = 1;
            foreach (var row in pl.VocabRows)
            {
                db.VocabularyItems.Add(new VocabularyItem
                {
                    LessonId = lesson.Id,
                    WordJp = row.KanjiOrWord,
                    Reading = row.Hiragana,
                    MeaningVi = row.Meaning,
                    SortOrder = order++,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            await db.SaveChangesAsync();
            count++;
        }
        return count;
    }

    private static async Task<int> InsertGrammarLessons(
        ApplicationDbContext db, int categoryId, List<ParsedLesson> lessons, DateTime now)
    {
        var count = 0;
        foreach (var pl in lessons.OrderBy(l => l.Number))
        {
            var slug = Slugify($"n5-grammar-bai-{pl.Number}-{pl.Title}");
            var lesson = new Lesson
            {
                CategoryId = categoryId,
                Title = pl.Title,
                Slug = slug,
                Content = BuildGrammarIntroHtml(pl),
                SortOrder = pl.Number,
                EstimatedMinutes = Math.Clamp(pl.GrammarRows.Count * 3 + 5, 12, 40),
                IsPremium = false,
                IsPublished = true,
                CreatedAt = now,
                UpdatedAt = now,
            };
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();

            var order = 1;
            foreach (var row in pl.GrammarRows)
            {
                db.GrammarItems.Add(new GrammarItem
                {
                    LessonId = lesson.Id,
                    Pattern = row.Pattern,
                    Structure = row.Usage,
                    MeaningVi = row.Meaning,
                    ExampleSentences = row.Example,
                    LevelId = 1,
                    SortOrder = order++,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            await db.SaveChangesAsync();
            count++;
        }
        return count;
    }

    private static async Task<int> InsertKanjiLessons(
        ApplicationDbContext db, int categoryId, List<ParsedLesson> lessons, DateTime now)
    {
        var count = 0;
        foreach (var pl in lessons.OrderBy(l => l.Number))
        {
            var slug = Slugify($"n5-kanji-bai-{pl.Number}-{pl.Title}");
            var lesson = new Lesson
            {
                CategoryId = categoryId,
                Title = pl.Title,
                Slug = slug,
                Content = BuildKanjiIntroHtml(pl),
                SortOrder = pl.Number,
                EstimatedMinutes = Math.Clamp(pl.KanjiRows.Count * 2 + 8, 15, 50),
                IsPremium = false,
                IsPublished = true,
                CreatedAt = now,
                UpdatedAt = now,
            };
            db.Lessons.Add(lesson);
            await db.SaveChangesAsync();

            var order = 1;
            foreach (var row in pl.KanjiRows)
            {
                db.KanjiItems.Add(new KanjiItem
                {
                    LessonId = lesson.Id,
                    KanjiChar = row.Character,
                    MeaningVi = row.HanViet,
                    ReadingsKun = row.Kun,
                    ReadingsOn = row.On,
                    JlptLevel = "N5",
                    SortOrder = order++,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            await db.SaveChangesAsync();
            count++;
        }
        return count;
    }

    private static string BuildVocabIntroHtml(ParsedLesson pl) =>
        $"<p class=\"learn-intro\">Chủ đề <strong>{Esc(pl.Title)}</strong> — {pl.VocabRows.Count} từ vựng JLPT N5.</p>";

    private static string BuildGrammarIntroHtml(ParsedLesson pl) =>
        $"<p class=\"learn-intro\">Ngữ pháp N5: <strong>{Esc(pl.Title)}</strong> — {pl.GrammarRows.Count} mẫu câu.</p>";

    private static string BuildKanjiIntroHtml(ParsedLesson pl) =>
        $"<p class=\"learn-intro\">Hán tự N5: <strong>{Esc(pl.Title)}</strong> — {pl.KanjiRows.Count} chữ Kanji.</p>";

    private static string Esc(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");

    private static List<ParsedLesson> ParseVocabDocx(string path) =>
        ParseDocx(path, DocxKind.Vocabulary, stopAtLevel: 4);

    private static List<ParsedLesson> ParseGrammarDocx(string path) =>
        ParseDocx(path, DocxKind.Grammar, stopAtLevel: 4);

    private static List<ParsedLesson> ParseKanjiDocx(string path) =>
        ParseDocx(path, DocxKind.Kanji, stopAtLevel: 4);

    private enum DocxKind { Vocabulary, Grammar, Kanji }

    private sealed class ParsedLesson
    {
        public int Number { get; set; }
        public string Title { get; set; } = "";
        public List<VocabRow> VocabRows { get; } = new();
        public List<GrammarRow> GrammarRows { get; } = new();
        public List<KanjiRow> KanjiRows { get; } = new();
    }

    private sealed class VocabRow
    {
        public string KanjiOrWord { get; set; } = "";
        public string? Hiragana { get; set; }
        public string? Meaning { get; set; }
    }

    private sealed class GrammarRow
    {
        public string Pattern { get; set; } = "";
        public string? Usage { get; set; }
        public string? Meaning { get; set; }
        public string? Example { get; set; }
    }

    private sealed class KanjiRow
    {
        public string Character { get; set; } = "";
        public string? HanViet { get; set; }
        public string? Kun { get; set; }
        public string? On { get; set; }
    }

    private static List<ParsedLesson> ParseDocx(string path, DocxKind kind, int stopAtLevel)
    {
        using var doc = WordprocessingDocument.Open(path, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body == null) return new List<ParsedLesson>();

        var lessons = new List<ParsedLesson>();
        ParsedLesson? current = null;
        var inN5 = kind != DocxKind.Grammar;
        var tableHeaderSeen = false;
        var stopFile = false;

        foreach (var el in body.ChildElements)
        {
            if (stopFile) break;
            if (el is Paragraph p)
            {
                var text = GetParagraphText(p).Trim();
                if (string.IsNullOrWhiteSpace(text)) continue;

                if (IsLevelStop(text, stopAtLevel))
                {
                    if (lessons.Count > 0)
                    {
                        stopFile = true;
                        break;
                    }
                    inN5 = false;
                    continue;
                }

                if (IsN5SectionStart(text))
                    inN5 = true;

                if (!inN5 && !LessonHeaderRx.IsMatch(text)) continue;

                var m = LessonHeaderRx.Match(text);
                if (m.Success)
                {
                    current = new ParsedLesson
                    {
                        Number = int.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture),
                        Title = m.Groups[2].Value.Trim(),
                    };
                    lessons.Add(current);
                    tableHeaderSeen = false;
                    continue;
                }
            }
            else if (el is Table tbl && current != null && inN5)
            {
                foreach (var row in tbl.Elements<TableRow>())
                {
                    var cells = row.Elements<TableCell>().Select(GetCellText).ToList();

                    if (cells.Count < 2) continue;

                    var header = string.Join(" ", cells).ToLowerInvariant();
                    if (header.Contains("stt") && (header.Contains("kanji") || header.Contains("mẫu") || header.Contains("chữ")))
                    {
                        tableHeaderSeen = true;
                        continue;
                    }
                    if (!tableHeaderSeen && cells[0].Trim().Equals("STT", StringComparison.OrdinalIgnoreCase))
                    {
                        tableHeaderSeen = true;
                        continue;
                    }

                    if (!int.TryParse(cells[0].Trim().TrimEnd('.', ')'), out _))
                    {
                        if (!tableHeaderSeen) continue;
                    }

                    switch (kind)
                    {
                        case DocxKind.Vocabulary when cells.Count >= 4:
                            current.VocabRows.Add(new VocabRow
                            {
                                KanjiOrWord = PickWord(cells[1], cells[2]),
                                Hiragana = NullIfEmpty(cells[2]),
                                Meaning = NullIfEmpty(cells[3]),
                            });
                            break;
                        case DocxKind.Grammar when cells.Count >= 5:
                            current.GrammarRows.Add(new GrammarRow
                            {
                                Pattern = cells[1].Trim(),
                                Usage = NullIfEmpty(cells[2]),
                                Meaning = NullIfEmpty(cells[3]),
                                Example = NullIfEmpty(cells[4]),
                            });
                            break;
                        case DocxKind.Kanji when cells.Count >= 5:
                            current.KanjiRows.Add(new KanjiRow
                            {
                                Character = cells[1].Trim(),
                                HanViet = NullIfEmpty(cells[2]),
                                Kun = NullIfEmpty(cells[3]),
                                On = NullIfEmpty(cells[4]),
                            });
                            break;
                    }
                }
            }
        }

        return DedupeLessons(lessons, kind);
    }

    private static List<ParsedLesson> DedupeLessons(List<ParsedLesson> lessons, DocxKind kind)
    {
        int Score(ParsedLesson l) => kind switch
        {
            DocxKind.Vocabulary => l.VocabRows.Count,
            DocxKind.Grammar => l.GrammarRows.Count,
            DocxKind.Kanji => l.KanjiRows.Count,
            _ => 0,
        };

        return lessons
            .GroupBy(l => l.Number)
            .Select(g => g.OrderByDescending(Score).First())
            .OrderBy(l => l.Number)
            .Where(l => Score(l) > 0)
            .ToList();
    }

    private static bool IsN5SectionStart(string text)
    {
        var t = text.ToUpperInvariant();
        return t.Contains("N5") && (t.Contains("TỪ VỰNG") || t.Contains("NGỮ PHÁP") || t.Contains("HÁN TỰ") || t.Contains("KANJI"));
    }

    private static bool IsLevelStop(string text, int stopAtLevel)
    {
        if (stopAtLevel != 4) return false;
        var t = text.ToUpperInvariant();
        var compact = Regex.Replace(t, @"\s+", "");
        if (compact.Contains("NGUPHAPN4") || compact.Contains("TUVUNGN4") || compact.Contains("HANTUN4") || compact.Contains("KANJIN4"))
            return true;
        if (Regex.IsMatch(t, @"\bN4\b") &&
            (t.Contains("NGỮ PHÁP") || t.Contains("TỪ VỰNG") || t.Contains("HÁN TỰ") || t.Contains("KANJI")))
            return true;
        return false;
    }

    private static string PickWord(string kanji, string kana)
    {
        var k = kanji.Trim();
        return string.IsNullOrWhiteSpace(k) ? kana.Trim() : k;
    }

    private static string? NullIfEmpty(string s)
    {
        var t = s?.Trim();
        return string.IsNullOrWhiteSpace(t) ? null : t;
    }

    private static string GetParagraphText(Paragraph p) =>
        string.Concat(p.Descendants<Text>().Select(t => t.Text));

    private static string GetCellText(TableCell cell) =>
        string.Join(" ", cell.Descendants<Text>().Select(t => t.Text)).Trim();

    private static string Slugify(string input)
    {
        var s = input.ToLowerInvariant();
        s = s.Replace('đ', 'd').Replace('Đ', 'd');
        s = Regex.Replace(s, @"[àáạảãâầấậẩẫăằắặẳẵ]", "a");
        s = Regex.Replace(s, @"[èéẹẻẽêềếệểễ]", "e");
        s = Regex.Replace(s, @"[ìíịỉĩ]", "i");
        s = Regex.Replace(s, @"[òóọỏõôồốộổỗơờớợởỡ]", "o");
        s = Regex.Replace(s, @"[ùúụủũưừứựửữ]", "u");
        s = Regex.Replace(s, @"[ỳýỵỷỹ]", "y");
        s = Regex.Replace(s, @"[^a-z0-9\s-]", "");
        s = Regex.Replace(s, @"\s+", "-");
        s = Regex.Replace(s, @"-+", "-").Trim('-');
        return s.Length > 180 ? s[..180].TrimEnd('-') : s;
    }
}
