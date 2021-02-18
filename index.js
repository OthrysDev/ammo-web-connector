async function Connector(event) {
  function extractHeadersValues(headers) {
    const extractedHeaders = {};

    for (const [header, value] of headers) {
      extractedHeaders[header] = value;
    }

    return extractedHeaders;
  }

  function serialize(request) {
    // To be able to read the request as a valid JS object, we need this function to extract everything
    const headers = extractHeadersValues(request.headers.entries());

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

    // TODO Explain this part, maybe link the stackoverflow ?
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

  // Recover the necessary informations from the intercepted request
  const { headers, method, url } = event.request;

  // request and response are the necessary informations we need to send to Ammo
  const request = {
    headers: {},
    body: null,
  };

  const response = {
    headers: {},
    body: null,
    status: null,
  };

  request.headers = extractHeadersValues(headers);

  serialize(event.request).then((serializedRequest) => {
    // For now, we exclude the websocket protocol
    // TODO Handle me differently as a legit url can contain the word socket
    if (!url.includes('socket')) {
      request.body = serializedRequest;

      /*
        We need to execute the intercepted request by ourself to access the response data.
        TODO : Maybe find another way to handle it, and check for performance issue
      */
      fetch(url, {
        method,
        headers: request.headers,
        body: serializedRequest.body,
      })
        .then(async (r) => {
          // Now that the response object is here, fill the object with the necessary informations
          response.headers = extractHeadersValues(r.headers);
          response.status = r.status;

          // If the response say "Alright it's all good", return it as usual
          if (r.ok) {
            return r.json();
          }

          /*
           But sometimes, the body is returned as a Stream. In this case, we need to read it,
           decode the value recovered and finally save the final value into the response object.
           */
          const reader = r.body.getReader();

          const encodedResponse = await reader.read();

          const stringifiedValue = new TextDecoder('utf-8').decode(
            encodedResponse.value
          );

          response.body = stringifiedValue;
        })
        .then((res) => {
          //! Might not be necessary, could do it directly after the r.json() above
          response.body = res;
        })
        .catch((err) => {
          // TODO : Do something with the error
        })
        .finally(() => {
          // Once we recovered everything, we actually build the request and send the data to Ammo
          const data = {
            data: {
              method,
              url,
              request,
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

          // TODO : Maybe put into a .env file nor into a well named variable
          // TODO : Add a .catch to inform the user if something bad happened, aswell as a toggleable log to inform it went well
          fetch('http://localhost:2001', options);
        });
    }
  });
}

self.addEventListener('fetch', (event) => {
  Connector(event);
});

self.addEventListener('image', (event) => {
  Connector(event);
});
