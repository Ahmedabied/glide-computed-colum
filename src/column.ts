import * as glide from "./glide";

export default glide.column({
  name: "Echo Text",
  description: "Returns the exact text that is passed to it.",
  author: "Glide User",
  params: {
    text: {
      displayName: "Text",
      type: "string",
    },
  },
  result: { type: "string" },

  async run(text) {
    if (text.value === undefined) {
      return undefined;
    }
    return text.value;
  },
});
