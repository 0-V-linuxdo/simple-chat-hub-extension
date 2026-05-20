#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

function usage() {
  console.log(`Usage: verify_mod.js <repo-root>

Verifies Mod/, Mod.zip, Mod.crx, and the
dist/Simple-Chat-Hub-<base-version>「YYYY-MM-DD｜HH:MM:SS」.crx
release artifact for the Simple Chat Hub Mod package.`);
}

function readVarint(buf, offset) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (pos < buf.length) {
    const byte = buf[pos++];
    result |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) break;
    shift += 7n;
  }
  return [Number(result), pos];
}

function readFields(buf) {
  const fields = [];
  let pos = 0;
  while (pos < buf.length) {
    const [tag, afterTag] = readVarint(buf, pos);
    pos = afterTag;
    const field = tag >> 3;
    const wire = tag & 7;
    if (wire !== 2) throw new Error(`Unsupported protobuf wire type: ${wire}`);
    const [length, afterLength] = readVarint(buf, pos);
    pos = afterLength;
    fields.push({ field, value: buf.subarray(pos, pos + length) });
    pos += length;
  }
  return fields;
}

function parseCrx3(file) {
  const crx = fs.readFileSync(file);
  const magic = crx.subarray(0, 4).toString();
  const version = crx.readUInt32LE(4);
  if (magic !== "Cr24" || version !== 3) throw new Error(`${file} is not CRX3`);
  const headerSize = crx.readUInt32LE(8);
  const header = crx.subarray(12, 12 + headerSize);
  const zip = crx.subarray(12 + headerSize);
  const fields = readFields(header);
  const proofField = fields.find((field) => field.field === 2);
  const signedHeaderField = fields.find((field) => field.field === 10000);
  if (!proofField || !signedHeaderField) throw new Error("CRX3 header is missing proof or signed header data");
  const proof = readFields(proofField.value);
  const publicKey = proof.find((field) => field.field === 1)?.value;
  const signature = proof.find((field) => field.field === 2)?.value;
  if (!publicKey || !signature) throw new Error("CRX3 proof is missing public key or signature");
  const signedHeaderSize = Buffer.alloc(4);
  signedHeaderSize.writeUInt32LE(signedHeaderField.value.length, 0);
  const signatureOk = crypto.verify(
    "RSA-SHA256",
    Buffer.concat([Buffer.from("CRX3 SignedData\0"), signedHeaderSize, signedHeaderField.value, zip]),
    crypto.createPublicKey({ key: publicKey, type: "spki", format: "der" }),
    signature
  );
  return {
    magic,
    version,
    headerSize,
    zip,
    signatureOk,
    crxIdHex: crypto.createHash("sha256").update(publicKey).digest().subarray(0, 16).toString("hex")
  };
}

function collectJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectJsFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function zipEntries(file) {
  return execFileSync("unzip", ["-Z1", file], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter(Boolean);
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function modBaseVersion(manifestVersion) {
  const match = String(manifestVersion).match(/^(\d+\.\d+\.\d+)(?:\.\d+)?$/);
  if (!match) throw new Error(`Unsupported manifest version format: ${manifestVersion}`);
  return match[1];
}

function verifyZipEntries(entries) {
  assert(entries.includes("manifest.json"), "Mod.zip does not contain manifest.json at the zip root");

  for (const entry of entries) {
    const normalized = entry.replace(/^\.\//, "");
    assert(!normalized.startsWith("Mod/"), `Mod.zip contains a Mod/ prefix: ${entry}`);
    const parts = normalized.split("/");
    for (const forbidden of [".DS_Store", "__MACOSX", "_metadata", "META-INF"]) {
      assert(!parts.includes(forbidden), `Mod.zip contains excluded path: ${entry}`);
    }
  }
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) return usage();
  const repo = path.resolve(process.argv[2] || ".");
  const modDir = path.join(repo, "Mod");
  const assetsDir = path.join(modDir, "assets");
  const zipFile = path.join(repo, "Mod.zip");
  const crxFile = path.join(repo, "Mod.crx");
  const manifest = JSON.parse(fs.readFileSync(path.join(modDir, "manifest.json"), "utf8"));
  const baseVersion = modBaseVersion(manifest.version);

  assert(manifest.manifest_version === 3, "manifest is not MV3");
  assert(manifest.version, "manifest version is missing");
  assert(
    manifest.version_name === `${baseVersion} Mod`,
    "manifest version_name must be <base version> Mod"
  );
  assert(manifest.background?.service_worker, "manifest background.service_worker is missing");

  const timestampPattern = /^Mod「\d{4}-\d{2}-\d{2}｜\d{2}:\d{2}:\d{2}」$/;
  const localesDir = path.join(modDir, "_locales");
  const englishMessages = JSON.parse(fs.readFileSync(path.join(localesDir, "en", "messages.json"), "utf8"));
  const modDescription = englishMessages.extension_description?.message || "";
  assert(timestampPattern.test(modDescription), "en extension_description must be Mod「YYYY-MM-DD｜HH:MM:SS」");

  for (const locale of fs.readdirSync(localesDir)) {
    const messagesPath = path.join(localesDir, locale, "messages.json");
    if (!fs.existsSync(messagesPath)) continue;
    if (!fs.statSync(messagesPath).isFile()) continue;
    const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));
    const description = messages.extension_description?.message || "";
    assert(
      description === modDescription && timestampPattern.test(description),
      `${locale} extension_description must match Mod「YYYY-MM-DD｜HH:MM:SS」`
    );
  }
  const releaseTimestampLabel = modDescription.replace(/^Mod/, "");
  const releaseCrx = path.join(repo, "dist", `Simple-Chat-Hub-${baseVersion}${releaseTimestampLabel}.crx`);

  const assetsText = collectJsFiles(assetsDir).map((file) => fs.readFileSync(file, "utf8")).join("\n");
  for (const forbidden of [
    "google-analytics",
    "measurement_id",
    "api_secret",
    "G-57PNGJTWHX",
    "Google Analytics request failed"
  ]) {
    assert(!assetsText.includes(forbidden), `forbidden GA marker remains: ${forbidden}`);
  }

  for (const required of [
    "optimizeEndpoint",
    "optimizeApiKey",
    "menu.exportConfig",
    "menu.importConfig",
    "shortcutConfig"
  ]) {
    assert(assetsText.includes(required), `required Mod marker missing: ${required}`);
  }

  execFileSync("unzip", ["-t", zipFile], { stdio: "ignore" });
  verifyZipEntries(zipEntries(zipFile));

  const crx = parseCrx3(crxFile);
  assert(crx.signatureOk, "CRX3 signature verification failed");
  const zipHash = hashFile(zipFile);
  const payloadHash = crypto.createHash("sha256").update(crx.zip).digest("hex");
  assert(zipHash === payloadHash, "Mod.crx payload does not match Mod.zip");

  assert(fs.existsSync(releaseCrx), `release CRX is missing: ${releaseCrx}`);
  assert(hashFile(releaseCrx) === hashFile(crxFile), "release CRX does not match Mod.crx");

  console.log(JSON.stringify({
    ok: true,
    manifestVersion: manifest.version,
    modVersionName: manifest.version_name,
    modDescription,
    releaseCrx,
    serviceWorker: manifest.background.service_worker,
    crxIdHex: crx.crxIdHex,
    payloadMatchesModZip: true,
    releaseCrxMatchesModCrx: true
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
