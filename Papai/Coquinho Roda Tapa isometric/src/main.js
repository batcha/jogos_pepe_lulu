import { GAME_VERSION } from './version.js';

window.onload = function() {
  const versionDiv = document.createElement('div');
  versionDiv.style.position = 'absolute';
  versionDiv.style.top = '10px';
  versionDiv.style.right = '10px';
  versionDiv.style.background = 'rgba(0,0,0,0.7)';
  versionDiv.style.color = '#fff';
  versionDiv.style.padding = '6px 12px';
  versionDiv.style.borderRadius = '8px';
  versionDiv.style.fontFamily = 'monospace';
  versionDiv.innerText = `Versão do jogo: ${GAME_VERSION}`;
  document.body.appendChild(versionDiv);
};
