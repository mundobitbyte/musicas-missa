(() => {
  const celebracao = document.querySelector('#celebracao');
  const abrir = document.querySelector('#modoCelebracao');
  const sair = document.querySelector('#sairCelebracao');
  const status = document.querySelector('#statusTelaAtiva');

  if (!celebracao || !abrir || !sair) return;

  let bloqueio = null;
  let manterAtiva = false;

  function mostrarStatus(ativo) {
    if (!status) return;
    status.hidden = !ativo;
    status.textContent = ativo ? 'Tela ativa' : '';
  }

  async function solicitarBloqueio() {
    if (!manterAtiva || document.visibilityState !== 'visible') return;
    if (!('wakeLock' in navigator) || bloqueio) return;

    try {
      bloqueio = await navigator.wakeLock.request('screen');
      mostrarStatus(true);

      bloqueio.addEventListener('release', () => {
        bloqueio = null;
        mostrarStatus(false);
      });
    } catch {
      bloqueio = null;
      mostrarStatus(false);
    }
  }

  async function liberarBloqueio() {
    manterAtiva = false;
    mostrarStatus(false);

    if (!bloqueio) return;

    const atual = bloqueio;
    bloqueio = null;

    try {
      await atual.release();
    } catch {
      // O navegador pode já ter liberado o bloqueio automaticamente.
    }
  }

  abrir.addEventListener('click', () => {
    manterAtiva = true;
    solicitarBloqueio();
  });

  sair.addEventListener('click', liberarBloqueio);

  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !celebracao.classList.contains('oculto')) {
      liberarBloqueio();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && manterAtiva && !celebracao.classList.contains('oculto')) {
      solicitarBloqueio();
    }
  });

  window.addEventListener('pagehide', liberarBloqueio);
})();
