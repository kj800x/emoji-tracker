type HTTPMethod = "POST" | "GET" | "HEAD"; // or others...

export interface AppMentionEvent {
  client_msg_id: string;
  type: "app_mention";
  text: string;
  user: string;
  ts: string;
  blocks: unknown;
  team: string;
  channel: string;
  event_ts: string;
}

export interface SlackWebhookRequest<Event> {
  token: string;
  team_id: string;
  enterprise_id: string;
  api_app_id: string;
  event: Event;
  type: "event_callback";
  event_id: string;
  event_time: number;
  authorizations: {
    enterprise_id: string;
    team_id: string;
    user_id: string;
    is_bot: boolean;
    is_enterprise_install: boolean;
  }[];
  is_ext_shared_channel: boolean;
  event_context: string;
}

export interface AwsApiGatewayEvent {
  version: string;
  resource: string;
  path: string;
  httpMethod: HTTPMethod;
  headers: {
    [key: string]: string;
  };
  multiValueHeaders: {
    [key: string]: string[];
  };
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    extendedRequestId: string;
    httpMethod: HTTPMethod;
    identity: {
      sourceIp: string;
      userAgent: string;
    };
    path: string;
    protocol: string;
    requestId: string;
    requestTime: string;
    requestTimeEpoch: number;
    resourceId: string;
    resourcePath: string;
    stage: string;
  };
  body: string;
  isBase64Encoded: boolean;
}
