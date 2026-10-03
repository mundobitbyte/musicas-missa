const parametrosFluxo = new URLSearchParams(location.search);
const destinoMissa = parametrosFluxo.get('destino') || '';

function adicionarLinksAoMontarMissa() {
  const area = document.querySelector('#momentosMissa');
  if (!area) return;

  function atualizar() {
    area.querySelectorAll('.momento-card').forEach(card => {
      if (card.querySelector('.escolher-repertorio')) return;

      const select = card.querySelector('select[data-momento]');
      if (!select) return;

      const momento = select.dataset.momento;
      const link = document.createElement('a');
      link.className = 'voltar escolher-repertorio';
      link.href = `repertorio.html?momento=${encodeURIComponent(momento)}&destino=${encodeURIComponent(momento)}`;
      link.textContent = 'Escolher no repertório';
      card.querySelector('.momento-escolha')?.appendChild(link);
    });
  }

  atualizar();
  new MutationObserver(atualizar).observe(area, { childList: true, subtree: true });
}

function configurarRepertorioComDestino() {
  if (!destinoMissa) return;

  const painel = document.querySelector('.painel-repertorio');
  const lista = document.querySelector('#listaMusicas');
  if (!painel || !lista) return;

  const filtros = document.querySelector('#filtrosRapidos');
  if (filtros) filtros.hidden = true;

  if (!document.querySelector('#contextoEscolhaMissa')) {
    const contexto = document.createElement('div');
    contexto.id = 'contextoEscolhaMissa';
    contexto.className = 'identificacao-roteiro';

    const texto = document.createElement('span');
    texto.textContent = `Escolhendo música para ${destinoMissa}`;

    const separador = document.createTextNode(' · ');
    const voltar = document.createElement('a');
    voltar.className = 'voltar';
    voltar.href = 'montar-missa.html';
    voltar.textContent = 'Voltar à montagem';

    contexto.append(texto, separador, voltar);
    painel.parentNode.insertBefore(contexto, painel);
  }

  function preservarDestinoNosLinks() {
    lista.querySelectorAll('a.linha-musica').forEach(link => {
      const url = new URL(link.href, location.href);
      url.searchParams.set('destino', destinoMissa);
      link.href = `${url.pathname.split('/').pop()}?${url.searchParams.toString()}`;
    });
  }

  preservarDestinoNosLinks();
  new MutationObserver(preservarDestinoNosLinks).observe(lista, { childList: true, subtree: true });
}

function destacarDestinoNaMusica() {
  if (!destinoMissa) return;

  const area = document.querySelector('#detalheMusica');
  if (!area) return;

  const voltarRepertorio = document.querySelector('main > a.voltar');
  if (voltarRepertorio) {
    voltarRepertorio.href = `repertorio.html?momento=${encodeURIComponent(destinoMissa)}&destino=${encodeURIComponent(destinoMissa)}`;
  }

  function atualizar() {
    const secoes = [...area.querySelectorAll('section.dados-celebracao')];
    const secao = secoes.find(item => item.querySelector('h2')?.textContent.trim() === 'Usar nesta Missa');
    if (!secao) return;

    const explicacao = secao.querySelector('.momento-meta');
    if (explicacao) {
      explicacao.textContent = `Você veio escolher uma música para ${destinoMissa}. Confirme abaixo.`;
    }

    const acoes = secao.querySelector('.acoes');
    if (acoes) {
      const botaoDestino = [...acoes.querySelectorAll('button')].find(botao =>
        botao.textContent.includes(destinoMissa)
      );
      if (botaoDestino && acoes.firstElementChild !== botaoDestino) {
        acoes.prepend(botaoDestino);
      }
    }
  }

  atualizar();
  new MutationObserver(atualizar).observe(area, { childList: true, subtree: true });
}

adicionarLinksAoMontarMissa();
configurarRepertorioComDestino();
destacarDestinoNaMusica();
