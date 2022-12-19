"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFromS3 = exports.writeToS3 = void 0;
function writeToS3(S3Client, Key, Body) {
    return new Promise((resolve, reject) => {
        S3Client.upload({ Key, Body, ACL: "public-read" }, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.writeToS3 = writeToS3;
function readFromS3(S3Client, Key) {
    return new Promise((resolve, reject) => {
        S3Client.getObject({ Key }, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Body);
            }
        });
    });
}
exports.readFromS3 = readFromS3;
