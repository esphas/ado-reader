import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (
  text,
  from,
  to,
  axios,
  config
) => {
  if (config.url === "") {
    throw new Error("Error happened");
  }
  let transUrl = config.url || "http://127.0.0.1:5000/translate";
  let headers = {
    "Content-Type": "application/json",
  };
  let transRes = await axios.post(
    transUrl,
    JSON.stringify({
      q: text,
      source: from,
      target: to,
      api_key: config.apiKey || "",
    }),
    {
      headers,
    }
  );
  if (transRes.status === 200) {
    return transRes.data.translatedText;
  } else {
    throw new Error("Error happened");
  }
};
