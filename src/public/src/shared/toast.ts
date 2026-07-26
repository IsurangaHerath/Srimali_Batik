import type { ToastType } from './types.js';

class ToastManager {
    private container: HTMLElement | null = null;

    private getContainer(): HTMLElement {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    show(message: string, type: ToastType = 'info', duration = 3000): void {
        const container = this.getContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const iconMap: Record<ToastType, string> = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
        };

        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${iconMap[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 250);
        }, duration);
    }

    success(message: string): void { this.show(message, 'success'); }
    error(message: string): void { this.show(message, 'error'); }
    info(message: string): void { this.show(message, 'info'); }
}

export const toast = new ToastManager();
