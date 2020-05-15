# WebSub-Socket

Allows WebSocket clients to subscribe to WebSub topics, and then
proxies all updates that come via the WebSub WebHook subscription
to the relevant WebSocket clients.

Behaves as WebSub **Subscriber** and manages WebSub **Subscriptions**
on behalf of WebSocket clients.

Per the specification for subscribers, a conforming subscriber:

* MUST support each discovery mechanism in the specified order to discover the topic and hub URLs as described in [Discovery](https://www.w3.org/TR/websub/#discovery).
* MUST send a subscription request as described in [Subscriber Sends Subscription Request](https://www.w3.org/TR/websub/#subscriber-sends-subscription-request).
* MAY request a specific lease duration
* MAY include a secret in the subscription request, and if it does, then MUST use the secret to verify the signature in the [content distribution request](https://www.w3.org/TR/websub/#authenticated-content-distribution).
* MUST acknowledge a content distribution request with an HTTP 2xx status code.
* MAY request that a subscription is deactivated using the "unsubscribe" mechanism.

This WebSub Proxy only implements the first *4. Discovery* mechanism, described as:

* Link Headers [[RFC5988](https://tools.ietf.org/html/rfc5988)]: the publisher SHOULD include at least one Link Header [RFC5988] with `rel=hub` (a hub link header) as well as exactly one Link Header [RFC5988] with `rel=self` (the self link header)

And it does not implement **ALL** the required 3 mechanisms described in section 4 of the specification.

### Reference:

* https://www.w3.org/TR/websub
