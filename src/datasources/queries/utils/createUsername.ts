import slugify from "slugify";

export const getUsername = (email: string) => {
  const emailToUserName = slugify(email.split("@")[0], {
    lower: true,
    trim: true,
  });

  // Random from 000 to 1000
  const number = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  const emailWithRandomNumberBasedOnDomain = `${emailToUserName}-${number}`;

  return emailWithRandomNumberBasedOnDomain;
};
