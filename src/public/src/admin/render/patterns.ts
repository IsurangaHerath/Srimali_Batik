import type { Pattern } from '../../shared/types.js';
import { dataManager } from '../../shared/dataManager.js';
import { toast } from '../../shared/toast.js';
import { getFallbackImage, escapeHtml, generateId } from '../../shared/utils.js';

export function renderPatternsList(container: HTMLElement): void {
    const patterns = dataManager.getPatterns();
    const colors = dataManager.getColors();

    if (patterns.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎨</div>
                <h3 class="empty-state-title">No patterns yet</h3>
                <p class="empty-state-desc">Click "Add Pattern" to create your first design.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = patterns.map(pattern => {
        const colorNames = (pattern.colors || [])
            .map(cid => { const c = colors.find(x => x.id === cid); return c ? c.name : null; })
            .filter(Boolean).join(', ') || 'All colors';

        return `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <div class="admin-list-item-preview">
                        <img src="${escapeHtml(pattern.image || getFallbackImage())}" alt="${escapeHtml(pattern.name)}" onerror="this.src='${getFallbackImage()}'">
                    </div>
                    <div class="admin-list-item-text">
                        <h4>${escapeHtml(pattern.name)}</h4>
                        <p>${escapeHtml(pattern.description || 'No description')}</p>
                        <p class="text-muted">Colors: ${escapeHtml(colorNames)}</p>
                    </div>
                </div>
                <div class="admin-list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.adminActions.editPattern('${escapeHtml(pattern.id)}')" aria-label="Edit ${escapeHtml(pattern.name)}">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="window.adminActions.deletePattern('${escapeHtml(pattern.id)}')" aria-label="Delete ${escapeHtml(pattern.name)}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

export function openPatternModal(patternId: string | null): void {
    const modal = document.getElementById('patternModal');
    const title = document.getElementById('patternModalTitle');
    const form = document.getElementById('patternForm') as HTMLFormElement;
    const preview = document.getElementById('patternImagePreview') as HTMLElement;

    if (!modal || !title || !form || !preview) return;

    form.reset();
    preview.innerHTML = '';
    preview.classList.remove('visible');

    if (patternId) {
        const p = dataManager.getPatternById(patternId);
        if (!p) return;

        title.textContent = 'Edit Pattern';
        (document.getElementById('patternId') as HTMLInputElement).value = p.id;
        (document.getElementById('patternName') as HTMLInputElement).value = p.name;
        (document.getElementById('patternDescription') as HTMLTextAreaElement).value = p.description;
        (document.getElementById('patternImage') as HTMLInputElement).value = p.image;
        previewImage(p.image, preview);
        populateColorCheckboxes('patternColorsContainer', p.colors || []);
    } else {
        title.textContent = 'Add Pattern';
        (document.getElementById('patternId') as HTMLInputElement).value = '';
        populateColorCheckboxes('patternColorsContainer', []);
    }

    modal.classList.add('active');
    const firstInput = modal.querySelector('input:not([type=hidden]), textarea') as HTMLElement;
    firstInput?.focus();
}

export function previewImage(url: string, preview: HTMLElement): void {
    if (!preview) return;
    if (url) {
        preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Preview" onerror="this.parentElement.innerHTML='<p class=\\'form-error\\'>Failed to load image</p>'">`;
        preview.classList.add('visible');
    } else {
        preview.innerHTML = '';
        preview.classList.remove('visible');
    }
}

export function populateColorCheckboxes(containerId: string, selectedIds: string[]): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = dataManager.getColors();
    if (colors.length === 0) {
        container.innerHTML = '<p class="form-hint">No colors available. Add colors first.</p>';
        return;
    }

    container.innerHTML = colors.map(color => `
        <label class="color-checkbox-item ${selectedIds.includes(color.id) ? 'selected' : ''}" data-color-id="${escapeHtml(color.id)}">
            <input type="checkbox" name="${containerId.replace('Container', '')}" value="${escapeHtml(color.id)}" ${selectedIds.includes(color.id) ? 'checked' : ''}>
            <div class="color-chip" style="background-color: ${escapeHtml(color.hex)};"></div>
            <span class="color-label">${escapeHtml(color.name)}</span>
        </label>
    `).join('');

    container.querySelectorAll('.color-checkbox-item').forEach((item: Element) => {
        item.addEventListener('click', function (this: HTMLElement, e: Event) {
            if ((e.target as HTMLElement).tagName !== 'INPUT') {
                const cb = this.querySelector('input') as HTMLInputElement;
                cb.checked = !cb.checked;
            }
            this.classList.toggle('selected', ((this.querySelector('input') as HTMLInputElement).checked));
        });
    });
}

export function getSelectedColors(containerId: string): string[] {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return [...container.querySelectorAll('input:checked')].map(i => (i as HTMLInputElement).value);
}

export async function savePattern(formData: FormData): Promise<void> {
    const id = formData.get('patternId') as string;
    const name = (formData.get('patternName') as string).trim();
    const description = (formData.get('patternDescription') as string).trim();
    const image = (formData.get('patternImage') as string).trim();
    const colors = getSelectedColors('patternColorsContainer');

    if (!name) {
        toast.error('Pattern name is required');
        return;
    }

    try {
        if (id) {
            await dataManager.updatePattern(id, { name, description, image, colors });
            toast.success('Pattern updated successfully!');
        } else {
            // Check duplicate name
            const dup = dataManager.getPatterns().find(p => p.name.toLowerCase() === name.toLowerCase());
            if (dup) {
                toast.error('A pattern with this name already exists');
                return;
            }
            await dataManager.createPattern({ id: generateId('p'), name, description, image, colors });
            toast.success('Pattern created successfully!');
        }
        closeModal('patternModal');
    } catch (error) {
        toast.error((error as Error).message || 'Failed to save pattern');
    }
}

export async function deletePattern(id: string): Promise<void> {
    const p = dataManager.getPatternById(id);
    if (!p) return;

    if (!confirm(`Delete pattern "${p.name}"?\n\nThis will also delete all products under this pattern.`)) return;

    try {
        await dataManager.deletePattern(id);
        toast.success('Pattern deleted');
    } catch (error) {
        toast.error((error as Error).message || 'Failed to delete pattern');
    }
}

export function closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}
