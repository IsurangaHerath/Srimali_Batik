export function initTheme(): void {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
  updateToggleButtons();
}

export function toggleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  updateToggleButtons();
  localStorage.setItem('theme', next);
}

function applyTheme(theme: string): void {
  document.documentElement.setAttribute('data-theme', theme);
}

function updateToggleButtons(): void {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  document.querySelectorAll<HTMLElement>('.theme-toggle').forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  });
}
