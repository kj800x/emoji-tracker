"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const path_1 = __importDefault(require("path"));
require("dotenv").config({ path: path_1.default.join(__dirname, "..", ".env") });
const http_1 = require("./handlers/http");
const wrapper = (fn) => {
    return async (...args) => {
        const result = await fn(...args);
        if ("error" in result) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result),
            };
        }
        else {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result),
            };
        }
    };
};
exports.handler = wrapper(http_1.main);
