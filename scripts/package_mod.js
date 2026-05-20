#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

function usage() {
  console.log(`Usage: package_mod.js --key ../Mod.pem [--root .] [--out-dir dist] [--history-dir history]

Packages the current Mod/ directory into Mod.zip, signs it as CRX3 into
Mod.crx, and copies the release artifact to
dist/Simple-Chat-Hub-<base-version>「YYYY-MM-DD｜HH:MM:SS」.crx.
Before packaging, existing dist/*.crx files are moved into history/.`);
}

function parseArgs(argv) {
  const options = {
    root: ".",
    outDir: "dist",
    historyDir: "history"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (raw === "--help" || raw === "-h") return { help: true };
    if (!raw.startsWith("--")) throw new Error(`Unexpected argument: ${raw}`);

    const equalIndex = raw.indexOf("=");
    const name = equalIndex >= 0 ? raw.slice(0, equalIndex) : raw;
    const inlineValue = equalIndex >= 0 ? raw.slice(equalIndex + 1) : null;
    const value = inlineValue !== null ? inlineValue : argv[++index];
    if (!value) throw new Error(`Missing value for ${name}`);

    if (name === "--root") options.root = value;
    else if (name === "--key") options.key = value;
    else if (name === "--out-dir") options.outDir = value;
    else if (name === "--history-dir") options.historyDir = value;
    else throw new Error(`Unknown option: ${name}`);
  }

  if (!options.key) throw new Error("Expected --key <Mod.pem>");
  return options;
}

function resolveFromRoot(root, value) {
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}

function resolveKeyPath(root, value) {
  if (path.isAbsolute(value)) return value;
  const cwdPath = path.resolve(value);
  if (fs.existsSync(cwdPath)) return cwdPath;
  return path.resolve(root, value);
}

function readManifest(root) {
  const manifestPath = path.join(root, "Mod", "manifest.json");
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function formatModTimestampLabel(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `Mod「${datePart}｜${timePart}」`;
}

function modBaseVersion(manifestVersion) {
  const match = String(manifestVersion).match(/^(\d+\.\d+\.\d+)(?:\.\d+)?$/);
  if (!match) throw new Error(`Unsupported manifest version format: ${manifestVersion}`);
  return match[1];
}

function writeManifestVersionName(root, versionName) {
  const manifestPath = path.join(root, "Mod", "manifest.json");
  const jsonValue = JSON.stringify(versionName);
  let text = fs.readFileSync(manifestPath, "utf8");

  if (/"version_name"\s*:/.test(text)) {
    text = text.replace(/("version_name"\s*:\s*)"[^"]*"/, `$1${jsonValue}`);
  } else if (/"version"\s*:/.test(text)) {
    text = text.replace(/(\n\s*"version"\s*:\s*"[^"]*"),?/, `$1,\n   "version_name": ${jsonValue},`);
  } else {
    throw new Error("Mod/manifest.json is missing version");
  }

  fs.writeFileSync(manifestPath, text);
}

function writeLocaleDescriptions(root, description) {
  const localesDir = path.join(root, "Mod", "_locales");
  if (!fs.existsSync(localesDir)) return [];

  const updated = [];
  for (const locale of fs.readdirSync(localesDir).sort()) {
    const messagesPath = path.join(localesDir, locale, "messages.json");
    if (!fs.existsSync(messagesPath)) continue;

    const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));
    messages.extension_description = messages.extension_description || {};
    messages.extension_description.message = description;
    fs.writeFileSync(messagesPath, `${JSON.stringify(messages, null, 3)}\n`);
    updated.push(locale);
  }
  return updated;
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function uniqueArchivePath(historyDir, filename) {
  const first = path.join(historyDir, filename);
  if (!fs.existsSync(first)) return first;

  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);
  const stamp = timestamp();
  let attempt = path.join(historyDir, `${stem}-${stamp}${ext}`);
  let counter = 2;
  while (fs.existsSync(attempt)) {
    attempt = path.join(historyDir, `${stem}-${stamp}-${counter}${ext}`);
    counter += 1;
  }
  return attempt;
}

function archiveDistCrx(outDir, historyDir) {
  fs.mkdirSync(historyDir, { recursive: true });
  if (!fs.existsSync(outDir)) return [];

  const archived = [];
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".crx") continue;
    const from = path.join(outDir, entry.name);
    const to = uniqueArchivePath(historyDir, entry.name);
    fs.renameSync(from, to);
    archived.push({ from, to });
  }
  return archived;
}

function shouldExclude(rel) {
  const parts = rel.split("/");
  return parts.includes(".DS_Store")
    || parts.includes("__MACOSX")
    || parts.includes("_metadata")
    || parts.includes("META-INF");
}

function collectZipEntries(dir, base = dir) {
  const entries = [];
  const dirents = fs.readdirSync(dir, { withFileTypes: true }).sort((left, right) => {
    return left.name.localeCompare(right.name);
  });

  for (const dirent of dirents) {
    const full = path.join(dir, dirent.name);
    const rel = path.relative(base, full).split(path.sep).join("/");
    if (shouldExclude(rel)) continue;

    if (dirent.isDirectory()) entries.push(...collectZipEntries(full, base));
    else if (dirent.isFile()) entries.push(rel);
  }
  return entries;
}

function buildZip(root) {
  const modDir = path.join(root, "Mod");
  const zipFile = path.join(root, "Mod.zip");
  const entries = collectZipEntries(modDir);
  if (!entries.length) throw new Error(`No files found in ${modDir}`);

  fs.rmSync(zipFile, { force: true });
  execFileSync("zip", ["-q", "-X", zipFile, "-@"], {
    cwd: modDir,
    input: `${entries.join("\n")}\n`
  });

  return { zipFile, entryCount: entries.length };
}

function varint(number) {
  const out = [];
  let n = BigInt(number);
  while (n >= 0x80n) {
    out.push(Number((n & 0x7fn) | 0x80n));
    n >>= 7n;
  }
  out.push(Number(n));
  return Buffer.from(out);
}

function fieldBytes(field, value) {
  return Buffer.concat([varint((BigInt(field) << 3n) | 2n), varint(value.length), value]);
}

function u32le(number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(number, 0);
  return buf;
}

function extensionIdFromHex(hex) {
  return hex.replace(/[0-9a-f]/g, (char) => {
    return String.fromCharCode("a".charCodeAt(0) + parseInt(char, 16));
  });
}

function signCrx3(zipFile, keyFile, outFile) {
  const zip = fs.readFileSync(zipFile);
  const keyPem = fs.readFileSync(keyFile, "utf8");
  const privateKey = crypto.createPrivateKey(keyPem);
  const publicKey = crypto.createPublicKey(privateKey);
  const publicKeyDer = publicKey.export({ type: "spki", format: "der" });
  const crxId = crypto.createHash("sha256").update(publicKeyDer).digest().subarray(0, 16);
  const signedHeaderData = fieldBytes(1, crxId);
  const signatureInput = Buffer.concat([
    Buffer.from("CRX3 SignedData\0"),
    u32le(signedHeaderData.length),
    signedHeaderData,
    zip
  ]);
  const signature = crypto.sign("RSA-SHA256", signatureInput, privateKey);
  const proof = Buffer.concat([fieldBytes(1, publicKeyDer), fieldBytes(2, signature)]);
  const header = Buffer.concat([fieldBytes(2, proof), fieldBytes(10000, signedHeaderData)]);
  const crx = Buffer.concat([Buffer.from("Cr24"), u32le(3), u32le(header.length), header, zip]);

  fs.writeFileSync(outFile, crx);
  const signatureOk = crypto.verify("RSA-SHA256", signatureInput, publicKey, signature);
  const hex = crxId.toString("hex");
  return {
    signatureOk,
    crxIdHex: hex,
    extensionId: extensionIdFromHex(hex),
    zipBytes: zip.length,
    crxBytes: crx.length
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();

  const root = path.resolve(options.root);
  const keyFile = resolveKeyPath(root, options.key);
  const outDir = resolveFromRoot(root, options.outDir);
  const historyDir = resolveFromRoot(root, options.historyDir);
  const modDir = path.join(root, "Mod");
  let manifest = readManifest(root);

  if (!manifest.version) throw new Error("Mod/manifest.json is missing version");
  if (!fs.existsSync(modDir)) throw new Error(`Missing Mod directory: ${modDir}`);
  if (!fs.existsSync(keyFile)) throw new Error(`Missing signing key: ${keyFile}`);

  const baseVersion = modBaseVersion(manifest.version);
  const modVersionName = `${baseVersion} Mod`;
  const modTimestampLabel = formatModTimestampLabel();
  writeManifestVersionName(root, modVersionName);
  const updatedLocales = writeLocaleDescriptions(root, modTimestampLabel);
  manifest = readManifest(root);

  const archived = archiveDistCrx(outDir, historyDir);
  const { zipFile, entryCount } = buildZip(root);
  const crxFile = path.join(root, "Mod.crx");
  fs.rmSync(crxFile, { force: true });
  const signed = signCrx3(zipFile, keyFile, crxFile);
  if (!signed.signatureOk) throw new Error("CRX3 signature verification failed after signing");

  fs.mkdirSync(outDir, { recursive: true });
  const releaseTimestampLabel = modTimestampLabel.replace(/^Mod/, "");
  const releaseCrx = path.join(outDir, `Simple-Chat-Hub-${baseVersion}${releaseTimestampLabel}.crx`);
  fs.copyFileSync(crxFile, releaseCrx);

  console.log(JSON.stringify({
    ok: true,
    version: manifest.version,
    modVersionName: manifest.version_name,
    modTimestampLabel,
    updatedLocales,
    archived,
    zip: zipFile,
    zipEntries: entryCount,
    crx: crxFile,
    releaseCrx,
    crxIdHex: signed.crxIdHex,
    extensionId: signed.extensionId,
    zipBytes: signed.zipBytes,
    crxBytes: signed.crxBytes
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
