/* prettier-ignore */
const sustantivos_femeninos = [
  "gatita", "leoncita", "elefantita", "tigresa", "vacita", "cabrita", "cerdita", "lobita",
  "osita", "ratita", "tortuguita", "abejita", "mariposita", "aranita", "hormiguita", "delfinita",
  "ballenita", "serpientita", "hipopotamita", "jirafita", "llamita", "alpacita", "ciervita", "corderita",
  "mofeta", "liebrecita", "focita", "quokkita", "capibarita", "viscachita", "jerbita", "lemurita", "wombatita",
];

/* prettier-ignore */
const sustantivos_masculinos = [
  "gatito", "leoncito", "elefantito", "tigrecito", "torito", "cabrito", "cerdito", "lobito", "osito",
  "ratoncito", "tortuguito", "abejorro", "mariposito", "arañito", "hormiguito", "delfincito", "ballenito",
  "serpentito", "hipopotamito", "jirafito", "llamito", "alpacito", "ciervito", "corderito", "zorrillo",
  "liebrecito", "focito", "quokkito", "capibarito", "viscachito", "jerbito", "lemurito", "wombatito",
];

/* prettier-ignore */
const adjetivos_femeninos = [
  "alegre", "audaz", "autentica", "bendita", "brillante", "calmada", "carismatica", "cautivadora",
  "creativa", "decidida", "delicada", "dinamica", "divertida", "eficiente", "elegante", "encantadora",
  "energetica", "esplendida", "estupenda", "extraordinaria", "fabulosa", "fiel", "fuerte", "generosa",
  "graciosa", "grandiosa", "heroica", "honesta", "increible", "ingeniosa", "inspiradora", "inteligente",
  "intrepida", "invicta", "justa", "leal", "luminosa", "magnifica", "maravillosa", "noble", "optimista",
  "poderosa", "positiva", "preciosa", "prodigiosa", "radiante", "resiliente", "respetuosa", "sabia",
  "serena", "sincera", "soñadora", "sorprendente", "sublime", "talentosa", "tranquila", "valiente", "valiosa",
  "vencedora", "versatil", "visionaria", "vivaz", "zalamera", "admirable", "apasionada", "asombrosa",
  "beneficiosa", "competente", "comprometida", "confiable", "considerada", "cooperativa", "curiosa", "deslumbrante",
  "determinada", "devota", "disciplinada", "encomiable", "entusiasta", "exquisita", "ferviente", "gallarda",
  "gloriosa", "integra", "juguetona", "libre", "nobleza", "ocurrente", "proactiva", "receptiva", "renovadora", "unica",
];

/* prettier-ignore */
const adjetivos_masculinos = [
  "alegre", "audaz", "autentico", "bendito", "brillante", "calmado", "carismatico", "cautivador", "creativo",
  "decidido", "delicado", "dinamico", "divertido", "eficiente", "elegante", "encantador", "energetico", "esplendido",
  "estupendo", "extraordinario", "fabuloso", "fiel", "fuerte", "generoso", "gracioso", "grandioso", "heroico", "honesto",
  "increible", "ingenioso", "inspirador", "inteligente", "intrepido", "invicto", "justo", "leal", "luminoso", "magnifico",
  "maravilloso", "noble", "optimista", "poderoso", "positivo", "precioso", "prodigioso", "radiante", "resiliente",
  "respetuoso", "sabio", "sereno", "sincero", "soñador", "sorprendente", "sublime", "talentoso", "tranquilo", "valiente",
  "valioso", "vencedor", "versatil", "visionario", "vivaz", "zalamero", "admirable", "apasionado", "asombroso", "beneficioso",
  "competente", "comprometido", "confiable", "considerado", "cooperativo", "curioso", "deslumbrante", "determinado", "devoto",
  "disciplinado", "encomiable", "entusiasta", "exquisito", "ferviente", "gallardo", "glorioso", "integro", "jugueton", "libre",
  "nobleza", "ocurrente", "proactivo", "receptivo", "renovador", "unico",
];

const genderDecision = ["masculino", "femenino"] as const;

const randomArrayItem = (array: string[] | readonly string[]) => {
  const indiceAleatorio = Math.floor(Math.random() * array.length);
  return array[indiceAleatorio];
};

export const getUsername = () => {
  if (randomArrayItem(genderDecision) === "masculino") {
    return `${randomArrayItem(adjetivos_masculinos)}-${randomArrayItem(
      sustantivos_masculinos,
    )}-${Date.now()}`;
  } else {
    return `${randomArrayItem(adjetivos_femeninos)}-${randomArrayItem(
      sustantivos_femeninos,
    )}-${Date.now()}`;
  }
};
