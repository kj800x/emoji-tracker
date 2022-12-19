import path from "path";
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
import { main } from "./handlers/http";
import { AwsEvent } from "./types";

const wrapper = (fn: (event: AwsEvent) => Promise<object>) => {
  return async (event: AwsEvent) => {
    const result = await fn(event);

    if ("error" in result) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    } else {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    }
  };
};

export const handler = wrapper(main);
