async function Connector(event) {
  serialize(event.request).then((serializedRequest) => {
    if (!url.includes('socket')) {
      fetch(url, {
        method,
        headers: reqHeaders,
        body: serializedRequest.body,
      })
        .then(async (r) => {
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
        })
        .catch((err) => {
          console.error(
            'An error happened while trying to execute the fetch request : ',
            err
          );
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

          fetch('http://localhost:3001', options);
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
  