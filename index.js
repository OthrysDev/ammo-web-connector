/* eslint-disable no-restricted-syntax */
async function connector(event) {
  const AMMO_ADDRESS = 'http://localhost:2001';

  function extractHeadersValues(headers) {
    // The request's headers are not a valid JS object, we need to apply a special treatment to recover the values.
    const extractedHeaders = {};

    // A for.. of method is the only one available. Hearders is not an array, therefore can't use array iteration methods.
    for (const [header, value] of headers) {
      extractedHeaders[header] = value;
    }

    return extractedHeaders;
  }

  function serialize(request) {
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

    /* 
          https://stackoverflow.com/questions/43813770/how-to-intercept-all-http-requests-including-form-submits/43815800
          To be able to read the potential body from a request, we need to clone the request itself.
  
          In addition, a GET or HEAD request is not supposed to have any body, but it can still happen. We simply check if there's a body,
          no matter what kind of requests this is.
      */
    return request
      .clone()
      .text()
      .then((body) => {
        if (body) serialized.body = body;

        return Promise.resolve(serialized);
      });
  }

  // Recover the necessary informations from the intercepted request
  const { headers, method, url } = event.request;

  // request and response are the necessary objects we need to send to Ammo
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
    request.body = serializedRequest;

    fetch(url, {
      method,
      headers: request.headers,
      body: serializedRequest.body,
    })
      .then(async (r) => {
        // Now that the response object is available, fill the object with the necessary informations
        response.headers = extractHeadersValues(r.headers);
        response.status = r.status;

        // If the response say "Alright it's all good", stop the treatment
        if (r.ok) {
          response.body = await r.json();
          return;
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
      .catch((err) => {
        console.error(
          `An unexpected error happened while executing the actual request, error : ${err.message}`
        );
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

        //TODO Check the payload too large error on ammo be
        fetch(AMMO_ADDRESS, options).catch((err) =>
          console.error(
            `An error happened while trying to send the data to Ammo, error : ${err.message}`
          )
        );
      });
  });
}

self.addEventListener('fetch', (event) => connector(event));
