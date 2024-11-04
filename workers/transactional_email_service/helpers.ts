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

export const defaultInfo = {
  community: {
    from: {
      name: "CommunityOS",
      email: "contacto@communityos.io",
    }
  },
  nuevopuntocinco: {
    from: {
      name: "9punto5",
      email: "tickets@updates.9punto5.cl",
    },
    replyTo: "tickets@9punto5.cl",
  },
  jscl: {
    from: {
      name: "JSConf Chile",
      email: "contacto@jsconf.cl",
    }
  }
}