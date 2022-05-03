import { customAlphabet } from "nanoid";

/**
 * Unique hash generator
 * @param {number} lgth
 */
// export const guidGenerator = (length = 10) => nanoid(length);
export const guidGenerator = (length = 10) => {
  // const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

  return nanoid(length);
};
