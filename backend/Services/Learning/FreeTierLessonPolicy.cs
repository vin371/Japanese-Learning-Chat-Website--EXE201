namespace backend.Services.Learning;

/// <summary>Giới hạn bài học gói Miễn phí — Premium mở khóa toàn bộ.</summary>
public static class FreeTierLessonPolicy
{
    /// <summary>Số bài tối đa (theo SortOrder) mỗi phần được học miễn phí theo LevelId.</summary>
    public static int MaxFreeSortOrder(int levelId) => levelId switch
    {
        1 => 5, // N5 — bài 01–05 mỗi phần
        2 => 3, // N4 — học thử
        _ => 0, // N3 trở lên — cần Premium
    };

    public static bool RequiresPremiumAccess(int levelId, int sortOrder, bool lessonIsPremium, bool categoryIsPremium, bool userIsPremium)
    {
        if (userIsPremium) return false;
        if (lessonIsPremium || categoryIsPremium) return true;
        var maxFree = MaxFreeSortOrder(levelId);
        if (maxFree < 1) return true;
        return sortOrder > maxFree;
    }
}
