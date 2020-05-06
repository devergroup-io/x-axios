const axios = require("axios");
require("axios-cookiejar-support").default(axios);
const userAgent = require("random-useragent");
const ToughCookie = require("tough-cookie");

class Client {
  constructor(defaultCookie = undefined) {
    this.cookieStore = new ToughCookie.CookieJar();
    if (defaultCookie) {
      this.cookieStore = ToughCookie.CookieJar.deserializeSync(defaultCookie);
    }

    let headers = {};
    headers["User-Agent"] = userAgent.getRandom(
      (ua) => ua.userAgent.indexOf("linux") !== -1
    );
    const instance = axios.create({
      headers,
    });

    instance.interceptors.request.use((request) => {
      request.jar = this.cookieStore;
      request.withCredentials = true;
      return request;
    });
    this.instance = instance;
  }
  exportCookie() {
    return this.cookieStore.serializeSync();
  }
}

module.exports = Client;
