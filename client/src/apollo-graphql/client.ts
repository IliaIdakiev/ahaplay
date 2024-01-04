import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "http://localhost/graphql",
});

const authLink = setContext((_, { headers }) => {
  return new Promise((res) => {
    function handler(event: any) {
      const token = event.detail.token;
      res({
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
        },
      });
      window.removeEventListener("sendToken", handler);
    }
    window.addEventListener("sendToken", handler);
    window.dispatchEvent(new CustomEvent("getToken"));
  });
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
