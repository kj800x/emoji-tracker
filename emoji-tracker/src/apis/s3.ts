import S3, { GetObjectRequest, PutObjectRequest } from "aws-sdk/clients/s3";

export function writeToS3(S3Client: S3, Key: string, Body: string) {
  return new Promise<S3.ManagedUpload.SendData>((resolve, reject) => {
    S3Client.upload(
      { Key, Body, ACL: "public-read" } as PutObjectRequest,
      function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

export function readFromS3(S3Client: S3, Key: string) {
  return new Promise<S3.Body>((resolve, reject) => {
    S3Client.getObject({ Key } as GetObjectRequest, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.Body!);
      }
    });
  });
}
