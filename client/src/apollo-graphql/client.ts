import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const httpLink = createHttpLink({
  uri: "http://localhost/graphql",
});

function getAuthToken() {
  return new Promise((res, rej) => {
    const timeoutId = setTimeout(
      () => rej(new Error("get token timeout!")),
      3000
    );

    function handler(event: any) {
      clearTimeout(timeoutId);
      const token = event.detail.token;
      res(token);
      window.removeEventListener("sendToken", handler);
    }
    window.addEventListener("sendToken", handler);
    window.dispatchEvent(new CustomEvent("getToken"));
  });
}

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost/graphql",
    connectionParams: () => {
      return getAuthToken().then((token) => ({
        Authorization: `Bearer ${token}`,
      }));
    },
  })
);

const authLink = setContext((_, { headers }) => {
  return getAuthToken().then((token) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }));
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
