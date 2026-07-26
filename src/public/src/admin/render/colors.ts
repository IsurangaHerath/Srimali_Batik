import type { Color } from '../../shared/types.js';
import { dataManager } from '../../shared/dataManager.js';
import { toast } from '../../shared/toast.js';
import { escapeHtml } from '../../shared/utils.js';
import { closeModal } from './patterns.js';

export function renderColorsList(container: HTMLElement): void {
    const colors = dataManager.getColors();

    // Deduplicate by ID
    const seen = new Set();
    const uniqueColors = colors.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
    });

    if (uniqueColors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎨</div>
                <h3 class="empty-state-title">No colors yet</h3>
                <p class="empty-state-desc">Click "Add Color" to create your first color.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = uniqueColors.map(color => `
        <div class="admin-list-item">
            <div class="admin-list-item-info">
                <div class="color-chip" style="background:${escapeHtml(color.hex)}; width:48px; height:48px; border-radius:8px; flex-shrink:0;"></div>
                <div class="admin-list-item-text">
                    <h4>${escapeHtml(color.name)}</h4>
                    <p>Hex: <code>${escapeHtml(color.hex)}</code> &nbsp;|&nbsp; Dark: <code>${escapeHtml(color.darkHex)}</code></p>
                </div>
            </div>
            <div class="admin-list-item-actions">
                <button class="btn btn-secondary btn-sm" onclick="window.adminActions.editColor('${escapeHtml(color.id)}')" aria-label="Edit ${escapeHtml(color.name)}">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="window.adminActions.deleteColor('${escapeHtml(color.id)}')" aria-label="Delete ${escapeHtml(color.name)}">Delete</button>
            </div>
        </div>
    `).join('');
}

export function openColorModal(colorId: string | null): void {
    const modal = document.getElementById('colorModal');
    const title = document.getElementById('colorModalTitle');
    const form = document.getElementById('colorForm') as HTMLFormElement;

    if (!modal || !title || !form) return;

    form.reset();

    if (colorId) {
        const c = dataManager.getColorById(colorId);
        if (!c) return;

        title.textContent = 'Edit Color';
        (document.getElementById('colorId') as HTMLInputElement).value = c.id;
        (document.getElementById('colorName') as HTMLInputElement).value = c.name;
        (document.getElementById('colorHex') as HTMLInputElement).value = c.hex;
        (document.getElementById('colorDarkHex') as HTMLInputElement).value = c.darkHex || c.hex;
    } else {
        title.textContent = 'Add Color';
        (document.getElementById('colorId') as HTMLInputElement).value = '';
    }

    modal.classList.add('active');
    (document.getElementById('colorName') as HTMLInputElement)?.focus();
}

export async function saveColor(formData: FormData): Promise<void> {
    const id = formData.get('colorId') as string;
    const name = (formData.get('colorName') as string).trim();
    const hex = formData.get('colorHex') as string;
    const darkHex = formData.get('colorDarkHex') as string;

    if (!name) { toast.error('Color name is required'); return; }

    try {
        if (id) {
            await dataManager.updateColor(id, { name, hex, darkHex });
            toast.success('Color updated successfully!');
        } else {
            const newId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            await dataManager.createColor({ id: newId, name, hex, darkHex, image: '' });
            toast.success('Color created successfully!');
        }
        closeModal('colorModal');
    } catch (error) {
        toast.error((error as Error).message || 'Failed to save color');
    }
}

export async function deleteColor(id: string): Promise<void> {
    const c = dataManager.getColorById(id);
    if (!c) return;
    if (!confirm(`Delete color "${c.name}"?`)) return;

    try {
        await dataManager.deleteColor(id);
        toast.success('Color deleted');
    } catch (error) {
        toast.error((error as Error).message || 'Failed to delete color');
    }
}
