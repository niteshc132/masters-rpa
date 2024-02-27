import { createInterface } from "readline";

export async function getUserCredentials() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter your email: ", (email) => {
      rl.question("Enter your password: ", (password) => {
        resolve({ email, password });
        rl.close();
      });
    });
  });
}
