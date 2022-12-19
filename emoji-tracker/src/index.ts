import path from "path";
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
import { main } from "./handlers/http";

const wrapper = (fn: (...args: any[]) => Promise<any>) => {
  return async (...args: any[]) => {
    const result = await fn(...args);

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
