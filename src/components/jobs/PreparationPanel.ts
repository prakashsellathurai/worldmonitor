
import { Panel } from '../Panel';

export class PreparationPanel extends Panel {
    constructor() {
        super({
            id: 'prep-dashboard',
            title: 'Interview Prep',
            showCount: false,
        });
        this.render();
    }

    private render() {
        const tasks = [
            { id: 1, text: 'LeetCode Daily (Medium)', done: true },
            { id: 2, text: 'System Design: Rate Limiter', done: false },
            { id: 3, text: 'Behavioral: "Tell me about a conflict"', done: false },
            { id: 4, text: 'Mock Interview (P2P)', done: false },
        ];

        // Simple render
        const taskRows = tasks.map(t => `
      <div class="task-row">
        <input type="checkbox" ${t.done ? 'checked' : ''} disabled />
        <span class="${t.done ? 'done' : ''}">${t.text}</span>
      </div>
    `).join('');

        this.setContent(`
      <div class="prep-list">
        ${taskRows}
        <button class="add-task">+ Add Task</button>
      </div>
      <style>
        .prep-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .task-row { display: flex; align-items: center; gap: 8px; padding: 6px; border-bottom: 1px solid var(--border-subtle); }
        .task-row input { accent-color: var(--blue); }
        .task-row span.done { text-decoration: line-through; color: var(--text-muted); }
        .add-task { margin-top: 8px; font-size: 11px; color: var(--text-dim); cursor: pointer; background: transparent; border: 1px dashed var(--border); padding: 4px; text-align: center; }
        .add-task:hover { color: var(--accent); border-color: var(--accent); }
      </style>
    `);
    }
}
