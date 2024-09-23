type CustomizedOptions = {
  /**
   * The number of decimal places to show in the formatted output.
   * @default 2
   */
  decimalsInOutput: number;
  /**
   * The character to use as the thousands separator.
   * @default ','
   */
  thousandsSeparator: "," | ".";
  /**
   * The number of decimal places in the input price.
   * Set to 0 if the price is in whole numbers.
   */
  decimalPlacesInInput: number;
};

type PredefinedOptions = {
  /**
   * Predefined formatting mode.
   * 'CLP' for Chilean Peso (no decimals, dot as thousands separator).
   * 'USD' for US Dollar (2 decimals, comma as thousands separator).
   */
  mode: "CLP" | "USD";
};

type FormatPriceOptions = CustomizedOptions | PredefinedOptions;

const USD_DEFAULT_CONFIG: CustomizedOptions = {
  decimalsInOutput: 2,
  thousandsSeparator: ",",
  decimalPlacesInInput: 2,
};

/**
 * Formats a numeric price into a string representation.
 *
 * @param price - The price to format. Expected to be in the smallest currency unit (e.g., cents for USD).
 * @param options - Configuration options for formatting.
 * @returns A formatted string representation of the price.
 *
 * @example
 * // Returns "76,000.00"
 * formatPrice(7600000);
 *
 * @example
 * // Returns "76.000"
 * formatPrice(76000, { mode: 'CLP' });
 */
export const formatPrice = (
  price: number,
  options: FormatPriceOptions,
): string => {
  const config: CustomizedOptions =
    "mode" in options
      ? getConfigForMode(options.mode)
      : { ...USD_DEFAULT_CONFIG, ...options };

  const mainUnitPrice = price / Math.pow(10, config.decimalPlacesInInput);

  const formattedPrice = mainUnitPrice.toFixed(config.decimalsInOutput);

  const [integerPart, decimalPart] = formattedPrice.split(".");

  const formattedIntegerPart = addThousandsSeparators(
    integerPart,
    config.thousandsSeparator,
  );

  return decimalPart
    ? `${formattedIntegerPart}.${decimalPart}`
    : formattedIntegerPart;
};

/**
 * Retrieves the configuration for a specific formatting mode.
 */
const getConfigForMode = (mode: "CLP" | "USD"): CustomizedOptions => {
  switch (mode) {
    case "USD":
      return USD_DEFAULT_CONFIG;
    case "CLP":
      return {
        decimalsInOutput: 0,
        thousandsSeparator: ".",
        decimalPlacesInInput: 0,
      };
  }
};

/**
 * Adds thousands separators to a numeric string.
 */
const addThousandsSeparators = (
  numStr: string,
  separator: "," | ".",
): string => {
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};
