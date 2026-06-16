const JP =
  /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\uff66-\uff9f]/;

/**
 * Tách câu ví dụ lẫn tiếng Nhật + tiếng Việt (import DOCX).
 * @param {string} text
 * @returns {{ jp: string, vi: string }}
 */
export function splitJpViLine(text) {
  const raw = String(text || '').trim();
  if (!raw) return { jp: '', vi: '' };

  const parts = raw.split(/\s{2,}|\t/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2 && JP.test(parts[0]) && !JP.test(parts[parts.length - 1])) {
    return { jp: parts[0], vi: parts.slice(1).join(' ') };
  }

  const m = raw.match(
    /^([\u3000-\u9faf\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\s。、！？「」『』・〜～ー（）()\[\]0-9A-Za-z]+?)(?:\.\s+|\s{2,}|[|｜]\s*|\s+)(.+)$/u,
  );
  if (m) {
    return { jp: m[1].trim(), vi: m[2].trim() };
  }

  if (JP.test(raw)) {
    const viIdx = raw.search(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/);
    if (viIdx > 0) {
      return { jp: raw.slice(0, viIdx).trim(), vi: raw.slice(viIdx).trim() };
    }
    return { jp: raw, vi: '' };
  }

  return { jp: '', vi: raw };
}

/**
 * @param {string} text
 * @returns {{ jp: string, vi: string }[]}
 */
export function parseExampleLines(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  return raw
    .split(/\|/)
    .map((s) => splitJpViLine(s))
    .filter((x) => x.jp || x.vi);
}
