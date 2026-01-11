import * as glide from "./glide";
import { Cache } from "./cache";

const cache = new Cache();
//trigger a deploy
export default glide.column({
  name: "GitHub Profile",
  description: "Gets a GitHub Profile for a given username.",
  author: "David Siegel <david@glideapps.com>",
  params: {
    username: {
      displayName: "Username",
      type: "string",
    },
  },
  result: { type: "string" },

  async run(username) {
    if (username.value === undefined) {
      return undefined;
    }
    const profile = await cache.fetch(
      `https://api.github.com/users/${username.value}`
    );
    return JSON.stringify(profile);
  },
});
