(() => {
  const area = document.querySelector('.celebracao-conteudo');
  const celebracao = document.querySelector('#celebracao');
  const anterior = document.querySelector('#anterior');
  const proxima = document.querySelector('#proxima');
  if (!area || !celebracao || !anterior || !proxima) return;

  let inicioX = 0;
  let inicioY = 0;
  let inicioTempo = 0;

  area.addEventListener('touchstart', evento => {
    if (celebracao.classList.contains('oculto') || evento.touches.length !== 1) return;

    const toque = evento.touches[0];
    inicioX = toque.clientX;
    inicioY = toque.clientY;
    inicioTempo = Date.now();
  }, { passive: true });

  area.addEventListener('touchend', evento => {
    if (celebracao.classList.contains('oculto') || !inicioTempo || evento.changedTouches.length !== 1) return;

    const toque = evento.changedTouches[0];
    const deslocamentoX = toque.clientX - inicioX;
    const deslocamentoY = toque.clientY - inicioY;
    const duracao = Date.now() - inicioTempo;

    inicioTempo = 0;

    const distanciaHorizontal = Math.abs(deslocamentoX);
    const distanciaVertical = Math.abs(deslocamentoY);
    const gestoHorizontal = distanciaHorizontal >= 70 && distanciaHorizontal > distanciaVertical * 1.4;

    if (!gestoHorizontal || duracao > 1200) return;

    if (deslocamentoX < 0 && !proxima.disabled) {
      proxima.click();
    } else if (deslocamentoX > 0 && !anterior.disabled) {
      anterior.click();
    }
  }, { passive: true });

  area.addEventListener('touchcancel', () => {
    inicioTempo = 0;
  }, { passive: true });
})();
