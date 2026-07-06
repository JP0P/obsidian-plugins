'use strict';

/*
 * Drift Inline — Cursor-style inline diffs for external edits.
 *
 * Combines Drift's external-change DETECTION engine with a from-scratch
 * INLINE decoration renderer (CodeMirror 6). Works for any tool that writes
 * markdown to disk — Claudian, Claude Sidebar, sync, scripts, etc.
 *
 * v0.2.0 — per-hunk Accept/Reject.
 *
 * The change is ALREADY applied to the file (that's how we detect it). We model
 * the file as a sequence of segments: unchanged CONTEXT runs and changed HUNKS
 * (each with oldLines/newLines and a status: pending|accepted|rejected).
 *
 * INVARIANT: the editor document always equals computeDocContent(segments),
 * where a hunk contributes newLines while pending/accepted and oldLines while
 * rejected. Resolving a hunk updates its status, re-syncs the document, and
 * re-renders. When no hunk is pending, the overlay clears and state finalizes.
 */

const obsidian = require('obsidian');
const { Plugin, MarkdownView, TFile, Notice, PluginSettingTab, Setting } = obsidian;

const cmView = require('@codemirror/view');
const { EditorView, Decoration, WidgetType } = cmView;

const cmState = require('@codemirror/state');
const { StateField, StateEffect, Annotation, Transaction } = cmState;

let PLUGIN = null;

const DEFAULT_SETTINGS = {
	enabled: true,
	notifyBackgroundFiles: true,
};

// Marks transactions we dispatch ourselves so the detector ignores them.
const diffInternal = Annotation.define();
// Carries the segment model (or null to clear).
const setDiffEffect = StateEffect.define();

// ---------------------------------------------------------------------------
// Line-level diff (LCS) -> ops {type:'equal'|'add'|'del', text}.
// ---------------------------------------------------------------------------
function lineDiff(oldText, newText) {
	const a = oldText.split('\n');
	const b = newText.split('\n');
	const n = a.length;
	const m = b.length;

	if (n * m > 4000000) {
		const ops = [];
		for (let i = 0; i < n; i++) ops.push({ type: 'del', text: a[i] });
		for (let j = 0; j < m; j++) ops.push({ type: 'add', text: b[j] });
		return ops;
	}

	const dp = [];
	for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] = a[i] === b[j]
				? dp[i + 1][j + 1] + 1
				: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	const ops = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (a[i] === b[j]) { ops.push({ type: 'equal', text: b[j] }); i++; j++; }
		else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'del', text: a[i] }); i++; }
		else { ops.push({ type: 'add', text: b[j] }); j++; }
	}
	while (i < n) { ops.push({ type: 'del', text: a[i] }); i++; }
	while (j < m) { ops.push({ type: 'add', text: b[j] }); j++; }
	return ops;
}

// Group ops into segments: context runs and change hunks.
function opsToSegments(ops) {
	const segments = [];
	let cur = null;
	let nextId = 0;
	for (const op of ops) {
		if (op.type === 'equal') {
			if (!cur || cur.type !== 'context') { if (cur) segments.push(cur); cur = { type: 'context', lines: [] }; }
			cur.lines.push(op.text);
		} else {
			if (!cur || cur.type !== 'hunk') { if (cur) segments.push(cur); cur = { type: 'hunk', id: nextId++, oldLines: [], newLines: [], status: 'pending' }; }
			if (op.type === 'del') cur.oldLines.push(op.text);
			else cur.newLines.push(op.text);
		}
	}
	if (cur) segments.push(cur);
	return segments;
}

// The lines a segment currently contributes to the document.
function segLines(seg) {
	if (seg.type === 'context') return seg.lines;
	if (seg.status === 'rejected') return seg.oldLines;
	return seg.newLines; // pending or accepted
}

function computeDocContent(segments) {
	const lines = [];
	for (const s of segments) for (const l of segLines(s)) lines.push(l);
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Widgets.
// ---------------------------------------------------------------------------
class DeletedLineWidget extends WidgetType {
	constructor(text) { super(); this.text = text; }
	eq(o) { return o instanceof DeletedLineWidget && o.text === this.text; }
	toDOM() {
		const el = document.createElement('div');
		el.className = 'di-deleted-line';
		el.textContent = this.text.length ? this.text : ' ';
		return el;
	}
	ignoreEvent() { return true; }
}

class HunkControlsWidget extends WidgetType {
	constructor(path, hunkId, adds, dels) { super(); this.path = path; this.hunkId = hunkId; this.adds = adds; this.dels = dels; }
	eq(o) { return o instanceof HunkControlsWidget && o.path === this.path && o.hunkId === this.hunkId && o.adds === this.adds && o.dels === this.dels; }
	toDOM() {
		const bar = document.createElement('div');
		bar.className = 'di-controls di-hunk-controls';
		// Inline layout styles (robust against cached styles.css).
		bar.style.display = 'flex';
		bar.style.alignItems = 'center';
		bar.style.width = '100%';
		bar.style.boxSizing = 'border-box';

		const label = document.createElement('span');
		label.className = 'di-controls-label';
		label.textContent = `change · +${this.adds} −${this.dels}`;
		bar.appendChild(label);

		const group = document.createElement('div');
		group.className = 'di-btn-group';
		group.style.marginLeft = 'auto'; // push buttons to the right
		group.style.display = 'inline-flex';
		group.style.gap = '8px';

		const accept = document.createElement('button');
		accept.className = 'di-btn di-accept';
		accept.textContent = 'Accept ✓';
		accept.onclick = (e) => { e.preventDefault(); if (PLUGIN) PLUGIN.acceptHunk(this.path, this.hunkId); };
		group.appendChild(accept);

		const reject = document.createElement('button');
		reject.className = 'di-btn di-reject';
		reject.textContent = 'Reject ✗';
		reject.onclick = (e) => { e.preventDefault(); if (PLUGIN) PLUGIN.rejectHunk(this.path, this.hunkId); };
		group.appendChild(reject);

		bar.appendChild(group);
		return bar;
	}
	ignoreEvent() { return false; }
}

class GlobalControlsWidget extends WidgetType {
	constructor(path, adds, dels, hunks) { super(); this.path = path; this.adds = adds; this.dels = dels; this.hunks = hunks; }
	eq(o) { return o instanceof GlobalControlsWidget && o.path === this.path && o.adds === this.adds && o.dels === this.dels && o.hunks === this.hunks; }
	toDOM() {
		const bar = document.createElement('div');
		bar.className = 'di-controls di-global-controls';
		// Inline layout styles (robust against cached styles.css).
		bar.style.display = 'flex';
		bar.style.alignItems = 'center';
		bar.style.width = '100%';
		bar.style.boxSizing = 'border-box';

		const label = document.createElement('span');
		label.className = 'di-controls-label';
		label.textContent = `Drift Inline · ${this.hunks} change${this.hunks === 1 ? '' : 's'} · +${this.adds} −${this.dels}`;
		bar.appendChild(label);

		const group = document.createElement('div');
		group.className = 'di-btn-group';
		group.style.marginLeft = 'auto'; // push buttons to the right
		group.style.display = 'inline-flex';
		group.style.gap = '8px';

		const accept = document.createElement('button');
		accept.className = 'di-btn di-accept';
		accept.textContent = 'Accept all ✓';
		accept.onclick = (e) => { e.preventDefault(); if (PLUGIN) PLUGIN.acceptAll(this.path); };
		group.appendChild(accept);

		const reject = document.createElement('button');
		reject.className = 'di-btn di-reject';
		reject.textContent = 'Reject all ✗';
		reject.onclick = (e) => { e.preventDefault(); if (PLUGIN) PLUGIN.rejectAll(this.path); };
		group.appendChild(reject);

		bar.appendChild(group);
		return bar;
	}
	ignoreEvent() { return false; }
}

// ---------------------------------------------------------------------------
// Decoration builder — walks segments, mapping to offsets in the live doc.
// Ordering by `side`: global(-4) < hunk controls(-3) < deleted widgets(-2).
// ---------------------------------------------------------------------------
function buildDecorations(model, docText) {
	if (!model || !model.segments) return Decoration.none;
	const segments = model.segments;
	const path = model.path;

	// Reconstruct the document line array and each segment's starting line.
	const docLines = [];
	const segStartLine = [];
	for (const s of segments) { segStartLine.push(docLines.length); for (const l of segLines(s)) docLines.push(l); }

	const lineStart = new Array(docLines.length);
	let acc = 0;
	for (let i = 0; i < docLines.length; i++) { lineStart[i] = acc; acc += docLines[i].length + 1; }
	const docLen = docText.length;
	const offAt = (li) => (li >= docLines.length ? docLen : Math.min(lineStart[li], docLen));

	const ranges = [];
	let totalAdds = 0;
	let totalDels = 0;
	let pendingHunks = 0;

	segments.forEach((s, si) => {
		if (s.type !== 'hunk' || s.status !== 'pending') return;
		pendingHunks++;
		const startLine = segStartLine[si];
		const hunkPos = offAt(startLine);

		// Per-hunk controls (top of the hunk).
		ranges.push(Decoration.widget({
			widget: new HunkControlsWidget(path, s.id, s.newLines.length, s.oldLines.length),
			block: true, side: -3,
		}).range(hunkPos));

		// Removed (old) lines as strikethrough widgets.
		for (const ol of s.oldLines) {
			ranges.push(Decoration.widget({ widget: new DeletedLineWidget(ol), block: true, side: -2 }).range(hunkPos));
			totalDels++;
		}

		// Added (new) lines — highlighted (they exist in the doc).
		for (let k = 0; k < s.newLines.length; k++) {
			const li = startLine + k;
			const start = offAt(li);
			const end = Math.min(start + docLines[li].length, docLen);
			if (end > start) ranges.push(Decoration.mark({ class: 'di-added' }).range(start, end));
			ranges.push(Decoration.line({ class: 'di-added-line' }).range(start));
			totalAdds++;
		}
	});

	if (pendingHunks === 0) return Decoration.none;

	// Global bar at the very top of the document.
	ranges.push(Decoration.widget({
		widget: new GlobalControlsWidget(path, totalAdds, totalDels, pendingHunks),
		block: true, side: -4,
	}).range(0));

	return Decoration.set(ranges, true);
}

const diffField = StateField.define({
	create() { return Decoration.none; },
	update(deco, tr) {
		for (const e of tr.effects) {
			if (e.is(setDiffEffect)) return buildDecorations(e.value, tr.state.doc.toString());
		}
		return deco.map(tr.changes);
	},
	provide: (f) => EditorView.decorations.from(f),
});

// ---------------------------------------------------------------------------
function getCmEditor(mdView) {
	const editor = mdView && mdView.editor;
	if (editor && typeof editor === 'object') {
		const cm = editor.cm;
		if (cm instanceof EditorView) return cm;
	}
	return undefined;
}

// ---------------------------------------------------------------------------
class DriftInlinePlugin extends Plugin {
	async onload() {
		PLUGIN = this;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) || {});

		this.baselines = new Map();  // path -> last-known content
		this.selfModify = new Set(); // paths we write via vault.modify
		this.models = new Map();     // path -> { oldContent, newContent, segments, path }

		this.registerEditorExtension([
			diffField,
			EditorView.updateListener.of((u) => this.onEditorUpdate(u)),
		]);

		this.registerEvent(this.app.vault.on('modify', (f) => this.onVaultModify(f)));
		this.registerEvent(this.app.vault.on('create', async (f) => {
			if (f instanceof TFile && f.extension === 'md') this.baselines.set(f.path, await this.app.vault.read(f));
		}));
		this.registerEvent(this.app.vault.on('delete', (f) => {
			if (f instanceof TFile) { this.baselines.delete(f.path); this.models.delete(f.path); }
		}));
		this.registerEvent(this.app.vault.on('rename', (f, oldPath) => {
			if (!(f instanceof TFile)) return;
			const c = this.baselines.get(oldPath);
			if (c !== undefined) { this.baselines.delete(oldPath); this.baselines.set(f.path, c); }
			const m = this.models.get(oldPath);
			if (m !== undefined) { m.path = f.path; this.models.delete(oldPath); this.models.set(f.path, m); }
		}));

		this.registerEvent(this.app.workspace.on('file-open', (f) => {
			if (f instanceof TFile && this.models.has(f.path)) window.setTimeout(() => this.renderDiff(f.path), 0);
		}));

		this.addCommand({ id: 'accept-all-changes', name: 'Accept all changes (current file)', callback: () => { const p = this.activePath(); if (p && this.models.has(p)) this.acceptAll(p); } });
		this.addCommand({ id: 'reject-all-changes', name: 'Reject all changes (current file)', callback: () => { const p = this.activePath(); if (p && this.models.has(p)) this.rejectAll(p); } });
		this.addCommand({ id: 'toggle-detection', name: 'Toggle external change detection', callback: () => { this.settings.enabled = !this.settings.enabled; void this.saveData(this.settings); new Notice(`Drift Inline detection ${this.settings.enabled ? 'ON' : 'OFF'}`); } });

		this.addSettingTab(new DriftInlineSettingTab(this.app, this));
		this.app.workspace.onLayoutReady(() => this.initBaselines());

		const enabled = this.app.plugins && this.app.plugins.enabledPlugins;
		if (enabled && enabled.has && enabled.has('drift')) {
			new Notice('Drift Inline: the "Drift" plugin is also enabled and will conflict. Consider disabling Drift.', 8000);
		}
	}

	onunload() { PLUGIN = null; }

	async initBaselines() {
		const files = this.app.vault.getMarkdownFiles();
		await Promise.all(files.map(async (f) => this.baselines.set(f.path, await this.app.vault.read(f))));
	}

	activePath() {
		const v = this.app.workspace.getActiveViewOfType(MarkdownView);
		return v && v.file ? v.file.path : null;
	}

	getCmForPath(path) {
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			const v = leaf.view;
			if (v && v.file && v.file.path === path) { const cm = getCmEditor(v); if (cm) return cm; }
		}
		return null;
	}

	pathForEditorView(view) {
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			const v = leaf.view;
			if (getCmEditor(v) === view) return v.file ? v.file.path : null;
		}
		return null;
	}

	// ----- detection: open editors -----
	onEditorUpdate(update) {
		// Ignore our own programmatic edits.
		if (update.transactions.some((tr) => tr.annotation(diffInternal))) return;
		if (!update.docChanged) return;
		if (!this.settings.enabled) return;

		const path = this.pathForEditorView(update.view);
		if (!path) return;

		if (this.selfModify.has(path)) {
			this.selfModify.delete(path);
			this.baselines.set(path, update.state.doc.toString());
			return;
		}

		const isExternalSync = update.transactions.some((tr) => tr.annotation(Transaction.userEvent) === 'set');
		if (isExternalSync) {
			const newContent = update.state.doc.toString();
			const oldContent = this.baselines.get(path);
			if (oldContent !== undefined && oldContent !== newContent) {
				this.models.set(path, { oldContent, newContent, path, segments: opsToSegments(lineDiff(oldContent, newContent)) });
				window.setTimeout(() => this.renderDiff(path), 0);
			}
			return;
		}

		// Genuine user edit: treat as acceptance of whatever is pending.
		if (this.models.has(path)) {
			this.models.delete(path);
			this.baselines.set(path, update.state.doc.toString());
			window.setTimeout(() => this.clearDiff(path), 0);
		} else {
			this.baselines.set(path, update.state.doc.toString());
		}
	}

	// ----- detection: files not open -----
	async onVaultModify(file) {
		if (!(file instanceof TFile) || file.extension !== 'md') return;
		if (!this.settings.enabled) return;
		if (this.getCmForPath(file.path)) return; // open files handled by CM listener

		const newContent = await this.app.vault.read(file);
		const oldContent = this.baselines.get(file.path);
		if (oldContent === undefined) { this.baselines.set(file.path, newContent); return; }
		if (oldContent === newContent) return;
		if (this.selfModify.has(file.path)) { this.selfModify.delete(file.path); this.baselines.set(file.path, newContent); return; }

		this.models.set(file.path, { oldContent, newContent, path: file.path, segments: opsToSegments(lineDiff(oldContent, newContent)) });
		if (this.settings.notifyBackgroundFiles) new Notice(`Drift Inline: changes to "${file.name}" — open it to review.`, 6000);
	}

	// ----- rendering -----
	renderDiff(path) {
		const m = this.models.get(path);
		if (!m) return;
		const cm = this.getCmForPath(path);
		if (!cm) return;
		cm.dispatch({ effects: setDiffEffect.of({ segments: m.segments, path }), annotations: diffInternal.of(true) });
	}

	clearDiff(path) {
		const cm = this.getCmForPath(path);
		if (cm) cm.dispatch({ effects: setDiffEffect.of(null), annotations: diffInternal.of(true) });
	}

	// ----- resolution -----
	setHunkStatus(path, hunkId, status) {
		const m = this.models.get(path);
		if (!m) return;
		const s = m.segments.find((x) => x.type === 'hunk' && x.id === hunkId);
		if (s) s.status = status;
		this.afterChange(path);
	}
	acceptHunk(path, hunkId) { this.setHunkStatus(path, hunkId, 'accepted'); }
	rejectHunk(path, hunkId) { this.setHunkStatus(path, hunkId, 'rejected'); }

	// Bulk actions only affect hunks that are still PENDING — a hunk you
	// already accepted or rejected individually keeps that decision. This
	// matches Cursor / VS Code: resolving a hunk removes it from the set that
	// "Accept all" / "Reject all" acts on.
	setAll(path, status) {
		const m = this.models.get(path);
		if (!m) return;
		for (const s of m.segments) if (s.type === 'hunk' && s.status === 'pending') s.status = status;
		this.afterChange(path);
	}
	acceptAll(path) { this.setAll(path, 'accepted'); }
	rejectAll(path) { this.setAll(path, 'rejected'); }

	// Re-sync the document to the resolved content and re-render (or finalize).
	afterChange(path) {
		const m = this.models.get(path);
		if (!m) return;
		const anyPending = m.segments.some((s) => s.type === 'hunk' && s.status === 'pending');
		const desired = computeDocContent(m.segments);
		const cm = this.getCmForPath(path);

		if (cm) {
			const cur = cm.state.doc.toString();
			const changes = cur !== desired ? { from: 0, to: cm.state.doc.length, insert: desired } : undefined;
			cm.dispatch({ changes, effects: setDiffEffect.of(anyPending ? { segments: m.segments, path } : null), annotations: diffInternal.of(true) });
		}

		if (!anyPending) {
			this.baselines.set(path, desired);
			this.models.delete(path);
			if (!cm) {
				const f = this.app.vault.getAbstractFileByPath(path);
				if (f instanceof TFile) { this.selfModify.add(path); void this.app.vault.modify(f, desired); }
			}
			new Notice('Drift Inline: all changes resolved.');
		}
	}
}

class DriftInlineSettingTab extends PluginSettingTab {
	constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
	display() {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName('Enable detection')
			.setDesc('Watch for external edits (Claudian, Claude Sidebar, sync, scripts) and show inline diffs.')
			.addToggle((t) => t.setValue(this.plugin.settings.enabled).onChange(async (v) => { this.plugin.settings.enabled = v; await this.plugin.saveData(this.plugin.settings); }));
		new Setting(containerEl)
			.setName('Notify for background files')
			.setDesc('Show a notice when a file that is not currently open is changed, so you can open it to review.')
			.addToggle((t) => t.setValue(this.plugin.settings.notifyBackgroundFiles).onChange(async (v) => { this.plugin.settings.notifyBackgroundFiles = v; await this.plugin.saveData(this.plugin.settings); }));
		const info = containerEl.createEl('p', { cls: 'setting-item-description' });
		info.setText('Each change shows its own Accept ✓ / Reject ✗ buttons; the top bar accepts or rejects everything. Assign hotkeys to "Accept/Reject all changes" under Settings → Hotkeys. Detection is source-agnostic — it triggers on any tool that writes markdown to disk.');
	}
}

module.exports = DriftInlinePlugin;
