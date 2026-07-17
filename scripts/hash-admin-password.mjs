#!/usr/bin/env node
/**
 * Generates the bcrypt hash for ADMIN_LOGIN_PASSWORD_HASH.
 *
 * The password is typed at a hidden (no-echo) prompt in a real terminal, and
 * is never written to disk, never passed as a CLI argument (which would land
 * in shell history), and never sent anywhere — this script only prints the
 * resulting hash, which you paste into `.env.local` and Vercel yourself.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs
 */
import bcrypt from "bcryptjs";
import readline from "node:readline";

/** Masked prompt for a real terminal (each keystroke echoed as `*`). */
function promptPasswordTty(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    let input = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (char) => {
      if (char === "") {
        // Ctrl+C
        process.stdout.write("\n");
        process.exit(130);
      }
      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === "" || char === "\b") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      input += char;
      process.stdout.write("*");
    };

    process.stdin.on("data", onData);
  });
}

/**
 * Plain (visible) prompt for non-TTY stdin — piped input during local
 * testing, where raw-mode keypress capture isn't available. Uses the
 * readline interface as an async iterator of lines rather than two
 * sequential `question()` calls: when a whole multi-line chunk arrives on a
 * pipe before either call runs, `question()`'s one-shot `'line'` listener
 * can miss the second line entirely (it's emitted and gone before the
 * second listener attaches, immediately after the first `await` yields to
 * the event loop). The async iterator queues lines instead of dropping them.
 */
async function promptTwoLinesNonTty(question1, question2) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const lines = rl[Symbol.asyncIterator]();
  process.stdout.write(question1);
  const first = (await lines.next()).value ?? "";
  process.stdout.write(question2);
  const second = (await lines.next()).value ?? "";
  rl.close();
  return [first, second];
}

async function main() {
  const [password, confirm] = process.stdin.isTTY
    ? [await promptPasswordTty("Admin password: "), await promptPasswordTty("Confirm password: ")]
    : await promptTwoLinesNonTty("Admin password: ", "Confirm password: ");

  if (!password) {
    console.error("Password cannot be empty.");
    process.exitCode = 1;
    return;
  }
  if (password !== confirm) {
    console.error("Passwords did not match. Nothing was generated.");
    process.exitCode = 1;
    return;
  }
  if (password.length > 200) {
    console.error("Password is too long (max 200 characters).");
    process.exitCode = 1;
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const escapedForDotenv = hash.replace(/\$/g, "\\$");

  console.log("\nADMIN_LOGIN_PASSWORD_HASH generated.\n");
  console.log("In Vercel (Project Settings -> Environment Variables), paste as-is:");
  console.log(hash);
  console.log(
    "\nIn .env.local, every $ must be escaped as \\$ — Next's env loader treats an " +
      "unescaped $word as a reference to another variable and silently deletes it, " +
      "which breaks login with no error at build or boot time. Paste this line instead:",
  );
  console.log(`ADMIN_LOGIN_PASSWORD_HASH=${escapedForDotenv}`);
  console.log(
    "\nThis hash is safe to store — it cannot be reversed back into the password. " +
      "The password itself was never written to disk or logged.",
  );
}

main();
