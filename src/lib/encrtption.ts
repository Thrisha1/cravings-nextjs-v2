import CryptoJS from "crypto-js";

export function encryptText(text : string) {
    return CryptoJS.AES.encrypt(text, process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string).toString();
}

export function decryptText(cipherText : string) {
    const bytes = CryptoJS.AES.decrypt(cipherText, process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string);
    return bytes.toString(CryptoJS.enc.Utf8);
}