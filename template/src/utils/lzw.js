// src/utils/lzw.js

const LZW = {
  compress(uncompressed) {
    const dictionary = {};
    const data = (uncompressed + "").split("");
    const result = [];
    let dictSize = 256;
    let w = "";

    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const wc = w + c;
      if (Object.prototype.hasOwnProperty.call(dictionary, wc)) {
        w = wc;
      } else {
        result.push(w.length ? dictionary[w] : w.charCodeAt(0));
        dictionary[wc] = dictSize++;
        w = c;
      }
    }

    if (w !== "") {
      result.push(w.length ? dictionary[w] : w.charCodeAt(0));
    }

    return result.map((n) => String.fromCharCode(n)).join("");
  },

  decompress(compressed) {
    const dictionary = {};
    const data = compressed.split("").map((c) => c.charCodeAt(0));
    let dictSize = 256;
    let w = String.fromCharCode(data[0]);
    let result = w;

    for (let i = 1; i < data.length; i++) {
      const k = data[i];
      let entry = null;
      if (k < 256) {
        entry = String.fromCharCode(k);
      } else if (dictionary[k]) {
        entry = dictionary[k];
      } else if (k === dictSize) {
        entry = w + w[0];
      }

      if (!entry) return null;

      result += entry;
      dictionary[dictSize++] = w + entry[0];
      w = entry;
    }

    return result;
  },
};

export default LZW;
