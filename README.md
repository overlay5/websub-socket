# WebSub-Socket

Implements a callback URL for [WebSub][^1] subscribers, which proxies all
incoming webhook notifications to the WebSocket client subscriber.

WebSub-Socket does not initiate **Subscribe** calls, it does support hub
verifications by acknowledging challenge requests.

> The hub verifies a subscription request by sending an HTTP (or HTTPS) GET request to the subscriber's callback URL as given in the subscription request.

### Example flow:

* WebSocket client connects using a websocket connection to the Proxy
    ```
    wss://proxy-url.example.com/socket/name-of-endpoint
    ```
* WebSocket client sends a websocket message to the Proxy notifying it of a pendnig subscription
    ```
    {"hub.mode":"subscribe","hub.topic":"whatever","hub.secret":"thesecret"}
    ```
* WebSocket client sends HTTP(s) request to a WebSub HUB, subscribing to a topic
    ```
    POST https://hub.somewhere-on-the-internet.com
    {"hub.callback":"http://proxy-url.example.com/hook/name-of-endpoint","hub.mode":"subscribe",...}
    ```
* HUB sends a challenge verification request to the Proxy
    ```
    GET https://proxy-url.example.com/hook/name-of-endpoint?hub.mode=subscribe&hub.challenge=difficult-challenge-token
    ```
* The proxy acknowledges the challenge, and responds with the provided challenge token
    ```
    difficult-challenge-token
    ```
* HUB starts sending notification messages to the callback URL whenever the topic is updated
* Proxy re-sends these messages to any WebSocket clients registered using a matching endpoint

### Reference
* [WebSub][^1] W3C Recommendation - formerly known as PubSubHubbub

[^1]: https://www.w3.org/TR/websub "WebSub"
