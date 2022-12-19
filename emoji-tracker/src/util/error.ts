export function error(message: string) {
  console.log(message);
  return {
    error: message,
  };
}
