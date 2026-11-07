"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

const STORAGE_KEY = "little-notes";

function createNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    updatedAt: Date.now(),
  };
}

function readNotes(): Note[] {
  try {
    const savedNotes: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

    if (!Array.isArray(savedNotes)) {
      return [];
    }

    return savedNotes.filter(
      (note): note is Note =>
        typeof note?.id === "string" &&
        typeof note?.title === "string" &&
        typeof note?.content === "string" &&
        typeof note?.updatedAt === "number",
    );
  } catch {
    return [];
  }
}

export default function Notepad() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedNotes = readNotes();
    const initialNotes = savedNotes.length > 0 ? savedNotes : [createNote()];
    setNotes(initialNotes);
    setActiveId(initialNotes[0].id);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch {
        // Keep editing available when browser storage is unavailable.
      }
    }
  }, [notes, ready]);

  const activeNote = notes.find((note) => note.id === activeId);
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return notes;
    }

    return notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query));
  }, [notes, search]);

  const addNote = useCallback(() => {
    const note = createNote();
    setNotes((currentNotes) => [note, ...currentNotes]);
    setActiveId(note.id);
    setSearch("");
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        addNote();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [addNote]);

  function updateActiveNote(changes: Partial<Pick<Note, "title" | "content">>) {
    if (!activeId) {
      return;
    }

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === activeId ? { ...note, ...changes, updatedAt: Date.now() } : note,
      ),
    );
  }

  function deleteActiveNote() {
    if (!activeNote) {
      return;
    }

    const remainingNotes = notes.filter((note) => note.id !== activeNote.id);
    const nextNotes = remainingNotes.length > 0 ? remainingNotes : [createNote()];
    setNotes(nextNotes);
    setActiveId(nextNotes[0].id);
  }

  const wordCount = activeNote?.content.trim().split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <main className="notepad">
      <aside className="sidebar" aria-label="Notes">
        <a className="brand" href="/" aria-label="Little Note home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>little note</span>
        </a>

        <div className="sidebar-heading">
          <span>Your notes</span>
          <span className="note-count">{notes.length}</span>
        </div>

        <label className="search-field">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.7" cy="8.7" r="5.7" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search notes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search notes"
          />
          <kbd>⌘ K</kbd>
        </label>

        <button className="new-note-button" type="button" onClick={addNote}>
          <span aria-hidden="true">+</span>
          New note
          <kbd>⌘ N</kbd>
        </button>

        <div className="note-list" aria-live="polite">
          {filteredNotes.map((note) => (
            <button
              className={`note-card${note.id === activeId ? " is-active" : ""}`}
              key={note.id}
              type="button"
              onClick={() => setActiveId(note.id)}
              aria-current={note.id === activeId ? "page" : undefined}
            >
              <span className="note-card-title">{note.title.trim() || "Untitled note"}</span>
              <span className="note-card-preview">
                {note.content.trim() || "A blank page, ready for you"}
              </span>
              <span className="note-card-date">
                {new Date(note.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
          ))}
          {filteredNotes.length === 0 && <p className="empty-search">No notes found.</p>}
        </div>

        <div className="sidebar-footer">
          <span className="privacy-dot" aria-hidden="true" />
          <span>Your notes stay on this device</span>
        </div>
      </aside>

      <section className="editor-area" aria-label="Note editor">
        <header className="editor-topbar">
          <div className="breadcrumb">
            <span>My space</span>
            <span className="breadcrumb-divider">/</span>
            <span>{activeNote?.title.trim() || "Untitled note"}</span>
          </div>
          <div className="save-status">
            <span className="save-check" aria-hidden="true">
              ✓
            </span>
            Saved on this device
          </div>
        </header>

        {activeNote && (
          <article className="editor">
            <div className="editor-date">
              <span className="sun-icon" aria-hidden="true">
                ✳
              </span>
              A quiet place to think
            </div>
            <input
              className="note-title"
              aria-label="Note title"
              placeholder="Untitled note"
              value={activeNote.title}
              onChange={(event) => updateActiveNote({ title: event.target.value })}
              maxLength={120}
            />
            <textarea
              className="note-content"
              aria-label="Note content"
              placeholder="Start with a thought, a list, or anything you want to remember..."
              value={activeNote.content}
              onChange={(event) => updateActiveNote({ content: event.target.value })}
              spellCheck
            />
            <footer className="editor-footer">
              <span>
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <button className="delete-button" type="button" onClick={deleteActiveNote}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4.5 6h11M8 6V4h4v2m2 0-.7 10H6.7L6 6m2.5 2v5m3-5v5" />
                </svg>
                Delete note
              </button>
            </footer>
          </article>
        )}
      </section>
    </main>
  );
}
