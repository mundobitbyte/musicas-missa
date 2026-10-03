(() => {
  const celebracao = document.querySelector('#celebracao');
  const abrir = document.querySelector('#abrirListaCelebracao');
  const fechar = document.querySelector('#fecharListaCelebracao');
  const lista = document.querySelector('#listaCelebracao');
  const itensArea = document.querySelector('#itensListaCelebracao');
  const roteiro = document.querySelector('#roteiro');
  const posicao = document.querySelector('#posicaoCelebracao');
  const anterior = document.querySelector('#anterior');
  const proxima = document.querySelector('#proxima');
  const conteudo = document.querySelector('.celebracao-conteudo');

  if (!celebracao || !abrir || !fechar || !lista || !itensArea || !roteiro || !posicao || !anterior || !proxima || !conteudo) return;

  let aberto = false;
  let focoAnterior = null;

  function indiceAtual() {
    const primeiro = posicao.textContent.trim().split('/')[0];
    const numero = Number.parseInt(primeiro, 10);
    return Number.isInteger(numero) && numero > 0 ? numero - 1 : 0;
  }

  function voltarAoTopo() {
    conteudo.scrollTop = 0;
  }

  anterior.addEventListener('click', voltarAoTopo);
  proxima.addEventListener('click', voltarAoTopo);

  function irPara(indiceDestino) {
    let atual = indiceAtual();

    while (atual < indiceDestino && !proxima.disabled) {
      proxima.click();
      atual++;
    }

    while (atual > indiceDestino && !anterior.disabled) {
      anterior.click();
      atual--;
    }

    voltarAoTopo();
  }

  function desenhar() {
    const itensRoteiro = [...roteiro.querySelectorAll('.roteiro-item')];
    const atual = indiceAtual();
    itensArea.innerHTML = '';

    itensRoteiro.forEach((item, indice) => {
      const momento = item.querySelector('.sobrelinha')?.textContent.trim() || `Momento ${indice + 1}`;
      const titulo = item.querySelector('h2')?.textContent.trim() || 'Música';

      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'celebracao-lista-item';
      botao.dataset.indice = String(indice);

      const cabecalho = document.createElement('strong');
      cabecalho.textContent = `${String(indice + 1).padStart(2, '0')} · ${momento}`;

      const nome = document.createElement('span');
      nome.textContent = titulo;

      botao.append(cabecalho, nome);

      if (indice === atual) {
        botao.classList.add('ativo');
        botao.setAttribute('aria-current', 'true');
      }

      botao.addEventListener('click', () => {
        irPara(indice);
        fecharLista();
      });

      itensArea.appendChild(botao);
    });
  }

  function abrirLista() {
    if (celebracao.classList.contains('oculto')) return;

    focoAnterior = document.activeElement;
    desenhar();
    aberto = true;
    lista.classList.remove('oculto');
    lista.setAttribute('aria-hidden', 'false');
    abrir.setAttribute('aria-expanded', 'true');

    const atual = itensArea.querySelector('[aria-current="true"]');
    (atual || itensArea.querySelector('button') || fechar).focus();
  }

  function fecharLista() {
    if (!aberto) return;

    aberto = false;
    lista.classList.add('oculto');
    lista.setAttribute('aria-hidden', 'true');
    abrir.setAttribute('aria-expanded', 'false');

    if (focoAnterior instanceof HTMLElement && document.contains(focoAnterior)) {
      focoAnterior.focus();
    } else {
      abrir.focus();
    }
  }

  abrir.addEventListener('click', abrirLista);
  fechar.addEventListener('click', fecharLista);

  lista.addEventListener('click', evento => {
    if (evento.target === lista) fecharLista();
  });

  document.addEventListener('keydown', evento => {
    if (!aberto) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      fecharLista();
      return;
    }

    if (evento.key !== 'Tab') return;

    const focaveis = [...lista.querySelectorAll('button:not(:disabled)')];
    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }, true);
})();
