const unMinutoEnMilisegundos = 60000;

export const someMinutesIntoTheFuture = (minutes: number) => {
  return new Date(Date.now() + minutes * unMinutoEnMilisegundos);
};
