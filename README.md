[![npm](https://img.shields.io/npm/v/@egomobile/api-client.svg)](https://www.npmjs.com/package/@egomobile/api-client)
[![last build](https://img.shields.io/github/workflow/status/egomobile/api-client/Publish)](https://github.com/egomobile/api-client/actions?query=workflow%3APublish)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/api-client/pulls)

# @egomobile/api-client

> A generic REST client, designed for use in Kubernetes environment e.g.

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egomobile/api-client
```

## Usage

```typescript
import ApiClient from "@egomobile/api-client";

async function main() {
  const apiClient = new ApiClient({
    // do a client_credentials oAuth flow
    auth: {
      clientId: "my-client-id",
      clientSecret: "my-client-secret",
    },
    baseURL: "https://api.example.com/",
  });

  // do a GET request on https://api.example.com/my-service1/v1/foo
  const getResponse = await apiClient.withClient(async (client) => {
    return await client.get("/my-service1/v1/foo");
  });

  // do a POST request on https://api.example.com/my-service2/v2/bar
  const postResponse = await apiClient.withClient(async (client) => {
    return await client.post("/my-service2/v2/bar", {
      baz: 42,
    });
  });

  // do a DELETE request on https://api.example.com/my-service3/beta/baz-resource/42
  const deleteResponse = await apiClient.withClient(async (client) => {
    return await client.delete("/my-service3/beta/baz-resource/42");
  });
}

main().catch(console.error);
```

## Documentation

The API documentation can be found [here](https://egomobile.github.io/api-client/).
