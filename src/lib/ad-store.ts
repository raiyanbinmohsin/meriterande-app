// Hand-off of an ad's text from another page (e.g. /find) to the decoder.
let pending = "";
export const setPendingAd = (t: string) => { pending = t; };
export const takePendingAd = () => { const t = pending; pending = ""; return t; };
