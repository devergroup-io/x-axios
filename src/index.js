const axios = require("axios");
require("axios-cookiejar-support").default(axios);
const userAgent = require("random-useragent");
const ToughCookie = require("tough-cookie");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const getCookieFileData = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath).toString();
  if (content.length < 0) return null;
  else return JSON.parse(content);
};
class Client {
  constructor(customOpts = {}) {
    const opts = _.defaultsDeep(customOpts, {
      defaultCookie: undefined,
      storePath: process.cwd() + "/cookieStore.json",
      log: {
        isEnable: false,
        logDir: process.cwd() + "/x-axios-errorlog",
      },
      headers: {
        "User-Agent": userAgent.getRandom((ua) => {
          return ua.osName === "Ubuntu";
        }),
      },
    });
    let { log, storePath, headers } = opts;
    this.storePath = storePath;
    this.cookieStore = new ToughCookie.CookieJar();
    const cookieData = getCookieFileData(storePath);
    if (cookieData) {
      this.cookieStore = ToughCookie.CookieJar.deserializeSync(cookieData);
      headers = _.omit(headers, "cookie");
    }
    console.log(headers);
    const instance = axios.create({
      headers,
    });

    instance.interceptors.request.use((request) => {
      request.jar = this.cookieStore;
      if (cookieData) {
        request.withCredentials = true;
      }
      return request;
    });

    instance.interceptors.response.use(
      (response) => {
        if (log.isEnable) {
          const url = _.get(response, "config.url", "unknown");
          const method = _.get(response, "request.method");
          const statusCode = _.get(response, "status", 0);
          const _html = _.get(
            response,
            "data",
            `<code>Can't get the response html</code>`
          );
          if (!fs.existsSync(log.logDir + "/success")) {
            fs.mkdirSync(log.logDir + "/success", {
              recursive: true,
            });
          }
          fs.writeFileSync(
            path.join(
              log.logDir + "/success",
              `./${moment().format("x")}.html`
            ),
            _html
          );

          console.log(`${statusCode}:${method}-  ${url}`);
        }
        return response;
      },
      (error) => {
        if (!log.isEnable) {
          throw error;
        }
        const url = _.get(error, "response.config.url", "unknown");
        const method = _.get(error, "request.method");
        const statusCode = _.get(error, "response.status", 0);
        const _html = _.get(
          error,
          "response.data",
          `<code>Can't get the response html</code>`
        );
        console.log(`${statusCode}:${method}-  ${url}`);
        if (!fs.existsSync(log.logDir + "/errors")) {
          fs.mkdirSync(log.logDir + "/errors", {
            recursive: true,
          });
        }
        fs.writeFileSync(
          path.join(log.logDir + "/errors", `./${moment().format("x")}.html`),
          _html
        );
        throw error;
      }
    );
    this.instance = instance;
  }
  syncCookie() {
    fs.writeFileSync(
      this.storePath,
      JSON.stringify(this.cookieStore.serializeSync())
    );
  }
  exportCookie() {
    return this.cookieStore.serializeSync();
  }
}

module.exports = Client;
