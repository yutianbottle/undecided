import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';

/** 新版本就绪时显示刷新提示，由用户触发页面更新。 */
function showUpdateBar(reg: ServiceWorkerRegistration) {
  if (document.getElementById('sw-update-bar')) return;
  const zh = (document.documentElement.lang || 'zh').startsWith('zh');

  const bar = document.createElement('div');
  bar.id = 'sw-update-bar';
  bar.setAttribute('role', 'status');
  bar.style.cssText = [
    'position:fixed', 'left:16px', 'right:16px', 'bottom:16px', 'z-index:9999',
    'display:flex', 'align-items:center', 'gap:12px', 'justify-content:space-between',
    'padding:12px 16px', 'border-radius:2px',
    'background:#22272F', 'border:1px solid #3A4049',
    'color:#EDEBE6', 'font-size:13px', 'line-height:1.5',
    'box-shadow:0 8px 24px rgba(0,0,0,.45)',
  ].join(';');
  bar.innerHTML = '';

  const text = document.createElement('span');
  text.textContent = zh ? '有新版本。刷新后生效，账本数据不受影响。' : 'A new version is ready. Refresh to load it — your records are untouched.';

  const btn = document.createElement('button');
  btn.textContent = zh ? '刷新' : 'Refresh';
  btn.style.cssText = [
    'flex:none', 'padding:6px 14px', 'border-radius:2px', 'cursor:pointer',
    'background:#D9AE63', 'color:#111318', 'border:0', 'font-size:13px', 'font-weight:500',
  ].join(';');
  btn.onclick = () => {
    btn.disabled = true;
    reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  bar.append(text, btn);
  document.body.appendChild(bar);
}

// 仅在生产构建中注册 Service Worker，避免影响开发环境的热更新。
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`./sw.js?v=${__BUILD_ID__}`)
      .then((reg) => {
        // 页面由旧版本控制且新版本已安装时提示刷新。
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg);

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBar(reg);
            }
          });
        });
      })
      .catch(() => {
        /* 注册失败不影响在线使用。 */
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
