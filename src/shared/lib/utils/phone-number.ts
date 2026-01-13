import { parsePhoneNumberFromString } from "libphonenumber-js";

const isValidPhoneNumber = (phoneNumber: string) => {
  const phone = parsePhoneNumberFromString(phoneNumber, "PK");
  return phone?.isValid() || false;
};

export { isValidPhoneNumber, parsePhoneNumberFromString };
