import { navigate } from '../../router';
import { getState, updateState } from '../../shared/storage';
import { addPoints, recordWritingActivity, recordCorrection, awardZeroFault } from '../../shared/gamification';
import { showNotification } from '../../shared/animations';
import { playAchievement } from '../../shared/audio';
import { renderMascot } from '../../shared/mascot';
import { t } from '../../shared/i18n';
import { isTtsEnabled, toggleTts, hasTtsSupport } from '../../shared/tts';
import {
  initEditor,
  getEditorText,
  setOnErrorClick,
  setOnErrorsUpdated,
  replaceError,
  triggerCheck,
  cleanupEditor,
} from './editor';
import type { GrammarError } from './grammar-checker';
import { getRandomPrompt } from './prompts';
import type { Story } from '../../types';
import './writing.css';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderStoryList(container: HTMLElement): void {
  const state = getState();
  const stories = state.writing.stories;

  container.innerHTML = `
    <div class="writing-page fade-in">
      <button class="back-btn" id="btn-back-writing">← ${t.writing.back}</button>
      <h1>✍️ ${t.writing.title}</h1>

      <button class="new-story-btn" id="btn-new-story">
        ✨ ${t.writing.newStory}
      </button>

      <div class="story-list">
        ${stories.length === 0 ? '<p style="color:var(--text-muted);text-align:center;margin-top:2rem;">Pas encore d\'histoire. Écris ta première !</p>' : ''}
        ${stories.map((s) => `
          <button class="story-card" data-story-id="${s.id}">
            <div class="story-card-info">
              <h3>${s.title || 'Sans titre'}</h3>
              <p>${formatDate(s.updatedAt)}</p>
            </div>
            <span class="story-card-words">${s.wordCount} ${t.writing.words}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-back-writing')?.addEventListener('click', () => navigate(''));

  document.getElementById('btn-new-story')?.addEventListener('click', () => {
    const newStory: Story = {
      id: generateId(),
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
    };

    updateState((s) => {
      s.writing.stories.unshift(newStory);
      s.writing.currentStoryId = newStory.id;
    });

    navigate(`writing/${newStory.id}`);
  });

  container.querySelectorAll('.story-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-story-id')!;
      navigate(`writing/${id}`);
    });
  });
}

function renderEditorView(container: HTMLElement, storyId: string): () => void {
  const state = getState();
  const story = state.writing.stories.find((s) => s.id === storyId);

  if (!story) {
    renderStoryList(container);
    return () => {};
  }

  const prompt = getRandomPrompt();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastWordCount = story.wordCount;
  let ttsEnabled = isTtsEnabled();

  const ttsIcon = ttsEnabled ? '🔊' : '🔇';
  const ttsTitle = ttsEnabled ? t.writing.ttsOn : t.writing.ttsOff;

  container.innerHTML = `
    <div class="writing-page fade-in">
      <button class="back-btn" id="btn-back-editor">← ${t.writing.back}</button>

      <div class="prompt-banner">
        <span>💡</span>
        <span class="prompt-text" id="prompt-text">${prompt}</span>
        <button id="btn-new-prompt" title="Nouvelle idée">🔄</button>
      </div>

      <div class="editor-container">
        <div class="editor-toolbar">
          <div class="editor-toolbar-left">
            <span class="word-count" id="word-count">${story.wordCount} ${t.writing.words}</span>
            <span class="error-count" id="error-count"></span>
          </div>
          <div class="editor-toolbar-right">
            ${hasTtsSupport() ? `<button class="tts-toggle" id="btn-tts" title="${ttsTitle}">${ttsIcon}</button>` : ''}
            <span class="save-indicator" id="save-indicator">${t.writing.saved}</span>
            <button class="delete-story-btn" id="btn-delete">🗑️ ${t.writing.delete}</button>
          </div>
        </div>

        <div class="editor-area" id="editor" data-placeholder="${t.writing.placeholder}"></div>
      </div>

      <div id="suggestion-popup-container"></div>
    </div>
  `;

  const editorEl = document.getElementById('editor')!;
  const wordCountEl = document.getElementById('word-count')!;
  const errorCountEl = document.getElementById('error-count')!;
  const saveIndicatorEl = document.getElementById('save-indicator')!;

  // Set initial content
  if (story.content) {
    editorEl.innerText = story.content;
  }

  // Init editor with grammar checking
  initEditor(editorEl);

  // Trigger initial check after a short delay
  setTimeout(() => triggerCheck(editorEl), 500);

  // Update error count display
  setOnErrorsUpdated((errors) => {
    const spelling = errors.filter((e) => !e.isGrammar).length;
    const grammar = errors.filter((e) => e.isGrammar).length;

    if (errors.length === 0) {
      const text = getEditorText(editorEl);
      if (text.trim().length > 10) {
        errorCountEl.innerHTML = `<span class="no-errors">✅ ${t.writing.noErrors}</span>`;
        // Award zero fault achievement
        awardZeroFault();
        addPoints(10);
      } else {
        errorCountEl.innerHTML = '';
      }
    } else {
      const parts: string[] = [];
      if (spelling > 0) parts.push(`<span class="error-badge error-badge-spell">${spelling} ortho</span>`);
      if (grammar > 0) parts.push(`<span class="error-badge error-badge-grammar">${grammar} gram</span>`);
      errorCountEl.innerHTML = parts.join(' ');
    }
  });

  // Suggestion popup on error click
  setOnErrorClick((error: GrammarError, rect: DOMRect) => {
    const popupContainer = document.getElementById('suggestion-popup-container')!;
    popupContainer.innerHTML = '';

    const errorTypeLabel = error.isGrammar ? t.writing.grammarError : t.writing.spellingError;
    const mascotPose = error.isGrammar ? 'thinking' : 'encouraging';
    const errorClass = error.isGrammar ? 'popup-grammar' : 'popup-spelling';

    const popupTop = Math.min(rect.bottom + 8, window.innerHeight - 200);
    const popupLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 300));

    popupContainer.innerHTML = `
      <div class="suggestion-popup ${errorClass}" style="top:${popupTop}px;left:${popupLeft}px;">
        <div class="suggestion-popup-header">
          ${renderMascot(mascotPose, 36)}
          <div>
            <span class="error-type-label">${errorTypeLabel}</span>
            <p class="error-message">${error.message}</p>
          </div>
        </div>
        ${error.replacements.length > 0 ? `
          <div class="suggestion-label">${t.writing.spellSuggestions}</div>
          <div class="suggestion-list">
            ${error.replacements.map((s) => `<button class="suggestion-btn" data-suggestion="${s}">${s}</button>`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    popupContainer.querySelectorAll('.suggestion-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const suggestion = btn.getAttribute('data-suggestion')!;
        replaceError(editorEl, error, suggestion);

        // Record correction
        recordCorrection(error.isGrammar);
        const { newAchievements } = addPoints(5);
        for (const ach of newAchievements) {
          playAchievement();
          showNotification(ach.name, ach.icon);
        }

        popupContainer.innerHTML = '';
        save();

        // Re-check after correction
        setTimeout(() => triggerCheck(editorEl), 300);
      });
    });

    // Close popup when clicking outside
    const closePopup = (e: Event) => {
      if (!(e.target as HTMLElement).closest('.suggestion-popup')) {
        popupContainer.innerHTML = '';
        document.removeEventListener('click', closePopup);
      }
    };
    setTimeout(() => document.addEventListener('click', closePopup), 100);
  });

  // TTS toggle
  document.getElementById('btn-tts')?.addEventListener('click', () => {
    ttsEnabled = toggleTts();
    const btn = document.getElementById('btn-tts')!;
    btn.textContent = ttsEnabled ? '🔊' : '🔇';
    btn.title = ttsEnabled ? t.writing.ttsOn : t.writing.ttsOff;
    showNotification(ttsEnabled ? t.writing.ttsOn : t.writing.ttsOff, ttsEnabled ? '🔊' : '🔇');
  });

  // Auto-save function
  function save(): void {
    const text = getEditorText(editorEl);
    const words = countWords(text);

    updateState((s) => {
      const idx = s.writing.stories.findIndex((st) => st.id === storyId);
      if (idx >= 0) {
        s.writing.stories[idx]!.content = text;
        s.writing.stories[idx]!.wordCount = words;
        s.writing.stories[idx]!.updatedAt = new Date().toISOString();
        if (!s.writing.stories[idx]!.title) {
          const firstLine = text.split('\n')[0]?.trim().slice(0, 40);
          if (firstLine) s.writing.stories[idx]!.title = firstLine;
        }
      }
    });

    wordCountEl.textContent = `${words} ${t.writing.words}`;

    if (words > lastWordCount) {
      const newWords = words - lastWordCount;
      const points = Math.floor(newWords / 10);
      if (points > 0) {
        const { newAchievements } = addPoints(points);
        for (const ach of newAchievements) {
          playAchievement();
          showNotification(ach.name, ach.icon);
        }
      }
      recordWritingActivity(newWords);
      lastWordCount = words;
    }

    saveIndicatorEl.classList.add('visible');
    setTimeout(() => saveIndicatorEl.classList.remove('visible'), 1500);
  }

  // Debounced auto-save on input
  editorEl.addEventListener('input', () => {
    const text = getEditorText(editorEl);
    const words = countWords(text);
    wordCountEl.textContent = `${words} ${t.writing.words}`;

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 2000);
  });

  // New prompt
  document.getElementById('btn-new-prompt')?.addEventListener('click', () => {
    const newPrompt = getRandomPrompt();
    document.getElementById('prompt-text')!.textContent = newPrompt;
  });

  // Delete story
  document.getElementById('btn-delete')?.addEventListener('click', () => {
    if (confirm('Supprimer cette histoire ?')) {
      updateState((s) => {
        s.writing.stories = s.writing.stories.filter((st) => st.id !== storyId);
      });
      navigate('writing');
    }
  });

  // Back button
  document.getElementById('btn-back-editor')?.addEventListener('click', () => {
    save();
    navigate('writing');
  });

  return () => {
    save();
    cleanupEditor();
    if (saveTimer) clearTimeout(saveTimer);
  };
}

export function renderWriting(container: HTMLElement, params?: string): void | (() => void) {
  if (params) {
    return renderEditorView(container, params);
  }
  renderStoryList(container);
}
