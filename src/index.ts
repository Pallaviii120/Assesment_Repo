import nodeFetch from "node-fetch";
import fetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";
import { JSDOM } from "jsdom";
import fs from "fs";
import { URLSearchParams } from "url";

const jar = new CookieJar();
const fetch = fetchCookie(nodeFetch, jar);

async function getNonce(): Promise<string> {
  const res = await fetch("https://challenge.sunvoy.com/login");
  const html = await res.text();
  const dom = new JSDOM(html);
  const nonce = dom.window.document
    .querySelector('input[name="nonce"]')
    ?.getAttribute("value");
  if (!nonce) throw new Error("Nonce not found in login page");
  return nonce;
}

async function login(nonce: string) {
  const formData = new URLSearchParams();
  formData.append("nonce", nonce);
  formData.append("username", "demo@example.org");
  formData.append("password", "test");

  const loginRes = await fetch("https://challenge.sunvoy.com/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // "User-Agent": "Mozilla/5.0",
      // Referer: "https://challenge.sunvoy.com/login",
    },
    body: formData,
  });

  const responseText = await loginRes.text();

  if (!loginRes.ok || responseText.includes("Invalid")) {
    throw new Error("Login failed: Invalid credentials or session rejected");
  }

  console.log("Login successful");
}

async function fetchUserData() {
  const usersRes = await fetch("https://challenge.sunvoy.com/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({}),
  });

  const users = await usersRes.json();

  fs.writeFileSync("users.json", JSON.stringify({ users }, null, 2));
  console.log("Data written to users.json");
}

async function main() {
  try {
    const nonce = await getNonce();
    await login(nonce);
    await fetchUserData();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
