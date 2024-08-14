export const createTags = (name: string, ...tagTuples: [string, string][]) => {
  const tags = [
    {
      name: "type",
      value: name,
    },
  ];

  tagTuples.forEach(([name, value]) => {
    tags.push({ name, value });
  });

  return tags;
};
