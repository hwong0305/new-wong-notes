import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import morgan from "morgan";
import simpleGit from "simple-git";
import util from "util";
import { v4 as uuidv4 } from "uuid";

//  Promisify link
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Environment Port
const SERVER_PORT = process.env.PORT || 5501;

// Git Options
const gitOptions = {
  baseDir: "./notes",
};

const NOTES_DIR = path.join(__dirname, "..", "notes");

const app = express();
app.use(express.json());
app.use(express.static("dist"));
app.use(morgan("dev"));
app.use(cors());

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeNote = (rawNote = {}, fallbackId = "") => {
  const id = rawNote.id || fallbackId;
  const title =
    typeof rawNote.title === "string"
      ? rawNote.title
      : typeof rawNote.name === "string"
        ? rawNote.name
        : "Untitled Note";
  const content =
    typeof rawNote.content === "string"
      ? rawNote.content
      : typeof rawNote.body === "string"
        ? rawNote.body
        : "";
  const createdAtValue = toNumber(rawNote.createdAt);
  const updatedAtValue = toNumber(rawNote.updatedAt);
  const createdAt = createdAtValue ?? updatedAtValue ?? Date.now();
  const updatedAt = updatedAtValue ?? createdAt;
  const normalized = { id, title, content, createdAt, updatedAt };
  const changed =
    rawNote.id !== normalized.id ||
    rawNote.title !== normalized.title ||
    rawNote.content !== normalized.content ||
    toNumber(rawNote.createdAt) !== normalized.createdAt ||
    toNumber(rawNote.updatedAt) !== normalized.updatedAt;
  return { normalized, changed };
};

app.get("/api/notes", async (_req, res) => {
  try {
    const data = await readdir(NOTES_DIR);
    const response = [];
    for (let note of data) {
      if (note === ".git" || note === ".gitkeep") continue;
      const noteId = note.endsWith(".md") ? note.slice(0, -3) : note;
      const buff = await readFile(path.join(NOTES_DIR, note));
      const raw = JSON.parse(buff.toString("utf8"));
      const { normalized, changed } = normalizeNote(raw, raw.id || noteId);
      if (changed) {
        await writeFile(
          path.join(NOTES_DIR, `${normalized.id}.md`),
          JSON.stringify(normalized),
        );
      }
      response.push(normalized);
    }
    const jData = await Promise.all(response);
    const getSortValue = (note) => note.updatedAt ?? note.createdAt ?? 0;
    jData.sort((a, b) => getSortValue(b) - getSortValue(a));
    res.json(jData || []);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error reading files");
  }
});

app.get("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const buff = await readFile(path.join(NOTES_DIR, `${id}.md`));
    const raw = JSON.parse(buff.toString("utf8"));
    const { normalized, changed } = normalizeNote(raw, id);
    if (changed) {
      await writeFile(
        path.join(NOTES_DIR, `${normalized.id}.md`),
        JSON.stringify(normalized),
      );
    }
    res.json(normalized);
  } catch (err) {
    console.log(err);
    res.status(500).send("The file does not exist");
  }
});

app.post("/api/notes", async (req, res) => {
  const { name, body, title, content } = req.body;
  const id = uuidv4();
  const git = simpleGit(gitOptions);
  try {
    const note = normalizeNote({
      id,
      title: title ?? name,
      content: content ?? body,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).normalized;
    await writeFile(path.join(NOTES_DIR, `${id}.md`), JSON.stringify(note));
    await git.add(`./${id}.md`);
    await git.commit(`initial commit ${id}`);
    res.status(201).json(note);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Error writing to the file" });
  }
});

app.put("/api/notes/:id", async (req, res) => {
  const { name, body, title, content, commit } = req.body;
  const { id } = req.params;
  const git = simpleGit(gitOptions);
  try {
    let existing = null;
    try {
      const buff = await readFile(path.join(NOTES_DIR, `${id}.md`));
      existing = JSON.parse(buff.toString("utf8"));
    } catch (_err) {
      existing = null;
    }
    const { normalized: existingNote } = normalizeNote(existing || {}, id);
    const note = normalizeNote({
      id,
      title: title ?? name ?? existingNote.title,
      content: content ?? body ?? existingNote.content,
      createdAt: existingNote.createdAt,
      updatedAt: Date.now(),
    }).normalized;
    await writeFile(path.join(NOTES_DIR, `${id}.md`), JSON.stringify(note));
    await git.add(`./${id}.md`);
    await git.commit(commit || "unknown edit");
    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Error writing to file",
    });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  const git = simpleGit(gitOptions);
  try {
    git.rm(`./${id}.md`);
    git.commit(`Removed file ${id}`);
    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Error deleting file",
    });
  }
});

app.get("/api/notes/:id/logs", async (req, res) => {
  const { id } = req.params;
  const git = simpleGit(gitOptions);
  try {
    const logs = await git.log({ file: `./${id}.md` });
    const buff = await readFile(path.join(NOTES_DIR, `${id}.md`));
    const raw = JSON.parse(buff.toString("utf8"));
    const { normalized, changed } = normalizeNote(raw, id);
    if (changed) {
      await writeFile(
        path.join(NOTES_DIR, `${id}.md`),
        JSON.stringify(normalized),
      );
    }
    res.json({ data: normalized, logs });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Error finding logs",
    });
  }
});

app.get("/api/notes/:id/logs/:commit", async (req, res) => {
  const { id, commit } = req.params;
  const git = simpleGit(gitOptions);
  try {
    await git.checkout(commit); // Revert files to commit
    const buff = await readFile(path.join(NOTES_DIR, `${id}.md`));
    const raw = JSON.parse(buff.toString("utf8"));
    const { normalized } = normalizeNote(raw, id);
    await git.checkout("master"); // Revert to master
    res.json(normalized);
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Error finding commit",
    });
  }
});

app.get(/.*/, function (req, res) {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

app.listen(SERVER_PORT, () => {
  console.log(`now listening on port ${SERVER_PORT}`);
});
