const modules = import.meta.glob("./cap_*/lesson_*.jsx", { eager: true });

const chaptersMap = {};

for (const [path, m] of Object.entries(modules)) {
  const { chapterId, lessonId, chapterName, name, blocks } = m.default;
  if (!chaptersMap[chapterId]) {
    chaptersMap[chapterId] = {
      id: chapterId,
      chapterName: chapterName || `Capítulo ${chapterId}`,
      lessons: [],
    };
  }
  chaptersMap[chapterId].lessons.push({
    id: lessonId,
    name,
    blocks,
  });
}

Object.values(chaptersMap).forEach((chap) => {
  chap.lessons.sort((a, b) => Number(a.id) - Number(b.id));
});

export const chapters = Object.values(chaptersMap).sort(
  (a, b) => Number(a.id) - Number(b.id)
);
