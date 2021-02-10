async function Connector(event) {

    function serialize(request) {
      const headers = {};
      for (const entry of request.headers.entries()) {
        headers[entry[0]] = entry[1];
      }
  
      const serialized = {
        url: request.url,
        headers,
        method: request.method,
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache,
        redirect: request.redirect,
        referrer: request.referrer,
      };
      if (request.method !== "GET" && request.method !== "HEAD") {
        return request
          .clone()
          .text()
          .then((body) => {
            serialized.body = body;
            return Promise.resolve(serialized);
          });
      }
      return Promise.resolve(serialized);
    }
  
    const { headers, method, url } = event.request;
  
    const reqHeaders = {};
    const resHeaders = {};
  
    const response = {
      headers: resHeaders,
    };
  
    for (const [header, value] of headers) {
      reqHeaders[header] = value;
    }
  
    const serializedRequest = await serialize(event.request);
  
    if (!url.includes("socket")) {
      let res;
  
      const r = await fetch(url, {
        method,
        headers: reqHeaders,
        body: serializedRequest.body,
      });
  
      for (const [header, value] of r.headers) {
        resHeaders[header] = value;
      }
  
      response.status = r.status;
  
      if (r.ok) {
        res = r.json();
      } else {
        const reader = r.body.getReader();
  
        const encodedResponse = await reader.read();
  
        const stringifiedValue = new TextDecoder("utf-8").decode(encodedResponse.value);
  
        response.body = stringifiedValue;
      }
  
      response.body = res;
  
      const data = {
        data: {
          method,
          url,
          request: {
            headers: reqHeaders,
            body: serializedRequest.body,
          },
          response,
        },
      };
  
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
      };
  
      fetch("http://localhost:3001", options);
    }
  }
  
  self.addEventListener("fetch", (event) => {
    Connector(event);
  });
  
  self.addEventListener("image", async (event) => {
    Connector(event);
  });
  
  
  
  
  
  
  
  
  
  
  
  
  // eslint-disable-next-line no-restricted-globals
  self.addEventListener('fetch', (event) => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      function serialize(request) {
          const headers = {};
          // eslint-disable-next-line no-restricted-syntax
          for (const entry of request.headers.entries()) {
              // eslint-disable-next-line prefer-destructuring
              headers[entry[0]] = entry[1];
          }
  
          const serialized = {
              url: request.url,
              headers,
              method: request.method,
              mode: request.mode,
              credentials: request.credentials,
              cache: request.cache,
              redirect: request.redirect,
              referrer: request.referrer,
          };
          if (request.method !== 'GET' && request.method !== 'HEAD') {
              return request
                  .clone()
                  .text()
                  .then((body) => {
                      serialized.body = body;
                      return Promise.resolve(serialized);
                  });
          }
          return Promise.resolve(serialized);
      }
  
      const { headers, method, url } = event.request;
  
      const reqHeaders = {};
      const resHeaders = {};
  
      const response = {
          headers: resHeaders,
      };
  
      // eslint-disable-next-line no-restricted-syntax
      for (const [header, value] of headers) {
          reqHeaders[header] = value;
      }
  
      if (event.request.url.includes('pokemon')) {
          console.log('sw.js line 4 ----> event', event.request);
          console.log('sw.js line 8 ----> reqHeaders', reqHeaders);
      }
  
      serialize(event.request).then((serializedRequest) => {
          if (event.request.url.includes('pokemon')) {
              console.log('sw.js line 47 ----> url', url);
          }
  
          if (!url.includes('socket')) {
              fetch(url, {
                  method,
                  headers: reqHeaders,
                  body: serializedRequest.body,
              })
                  .then(async (r) => {
                      if (event.request.url.includes('pokemon')) {
                          console.log('sw.js line 55 ----> r', r);
                      }
  
                      // eslint-disable-next-line no-restricted-syntax
                      for (const [header, value] of r.headers) {
                          resHeaders[header] = value;
                      }
  
                      response.status = r.status;
  
                      if (r.ok) {
                          return r.json();
                      }
  
                      const reader = r.body.getReader();
  
                      const encodedResponse = await reader.read();
  
                      const stringifiedValue = new TextDecoder('utf-8').decode(
                          encodedResponse.value
                      );
                      response.body = stringifiedValue;
                  })
                  .then((res) => {
                      response.body = res;
                      console.log('sw.js line 64 ----> Went well', res);
                  })
                  .catch((err) => {
                      if (event.request.url.includes('pokemon')) {
                          console.log('sw.js line 89 ----> Went bad', err);
                      }
                  })
                  .finally(() => {
                      const data = {
                          data: {
                              method,
                              url,
                              request: {
                                  headers: reqHeaders,
                                  body: serializedRequest.body,
                              },
                              response,
                          },
                      };
  
                      const options = {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(data), // body data type must match "Content-Type" header
                      };
  
                      fetch('http://localhost:3001', options)
                          .then((r) => r.json())
                          .then((resp) => {
                              if (event.request.url.includes('pokemon')) {
                                  console.log(
                                      'sw.js line 84 ----> Back end answered',
                                      resp
                                  );
                              }
                          });
                  });
          }
      });
  });
  