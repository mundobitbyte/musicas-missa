(() => {
  const CHAVE_TRANSPOSICAO = 'musicasMissaTransposicaoV01';
  const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const INDICES = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
    E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
    Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
  };

  let catalogoPromise = null;

  function carregarCatalogo() {
    if (!catalogoPromise) {
      catalogoPromise = fetch('data/musicas.json')
        .then(resposta => {
          if (!resposta.ok) throw new Error('Não foi possível carregar o repertório.');
          return resposta.json();
        });
    }
    return catalogoPromise;
  }

  function lerMapa() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_TRANSPOSICAO)) || {};
    } catch {
      return {};
    }
  }

  function obterDeslocamento(id) {
    const valor = Number.parseInt(lerMapa()[id], 10);
    return Number.isInteger(valor) ? Math.max(-6, Math.min(6, valor)) : 0;
  }

  function salvarDeslocamento(id, valor) {
    const mapa = lerMapa();
    const ajustado = Math.max(-6, Math.min(6, valor));

    if (ajustado === 0) delete mapa[id];
    else mapa[id] = ajustado;

    if (Object.keys(mapa).length) {
      localStorage.setItem(CHAVE_TRANSPOSICAO, JSON.stringify(mapa));
    } else {
      localStorage.removeItem(CHAVE_TRANSPOSICAO);
    }

    return ajustado;
  }

  function transporNota(nota, semitons) {
    const indice = INDICES[nota];
    if (indice === undefined) return nota;
    return NOTAS[(indice + semitons + 120) % 12];
  }

  function transporTom(tom, semitons) {
    if (!tom || !semitons) return tom || '';
    const resultado = String(tom).trim().match(/^([A-G])([#b]?)(.*)$/);
    if (!resultado) return tom;
    return `${transporNota(`${resultado[1]}${resultado[2]}`, semitons)}${resultado[3]}`;
  }

  function separarToken(token) {
    const resultado = token.match(/^([\[({|,:;]*)(.*?)([\])}|,:;.]*?)$/);
    return resultado ? { antes: resultado[1], centro: resultado[2], depois: resultado[3] } : { antes: '', centro: token, depois: '' };
  }

  function ehAcorde(token) {
    const { centro } = separarToken(token);
    return /^([A-G])([#b]?)(?:(?:m|maj|min|dim|aug|sus|add)?(?:2|4|5|6|7|9|11|13)?(?:M|\+|-)?(?:\([#b]?\d+[+-]?\))?)?(?:\/([A-G])([#b]?))?$/.test(centro);
  }

  function transporAcorde(token, semitons) {
    const partes = separarToken(token);
    const resultado = partes.centro.match(/^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/);
    if (!resultado) return token;

    const raiz = transporNota(`${resultado[1]}${resultado[2]}`, semitons);
    const baixo = resultado[4]
      ? `/${transporNota(`${resultado[4]}${resultado[5] || ''}`, semitons)}`
      : '';

    return `${partes.antes}${raiz}${resultado[3] || ''}${baixo}${partes.depois}`;
  }

  function linhaPareceCifra(linha) {
    const tokens = linha.trim().split(/\s+/).filter(Boolean);
    const relevantes = tokens.filter(token => !/^[|:]+$/.test(token));
    if (!relevantes.length) return false;

    const acordes = relevantes.filter(ehAcorde).length;
    return acordes >= 1 && acordes / relevantes.length >= 0.6;
  }

  function transporCifra(cifra, semitons) {
    if (!cifra || !semitons) return cifra || '';

    return cifra.split('\n').map(linha => {
      if (!linhaPareceCifra(linha)) return linha;
      return linha.split(/(\s+)/).map(parte => {
        if (/^\s+$/.test(parte) || !ehAcorde(parte)) return parte;
        return transporAcorde(parte, semitons);
      }).join('');
    }).join('\n');
  }

  function textoMeta(musica, deslocamento) {
    const partes = [];
    if (musica.autor) partes.push(musica.autor);
    if (musica.tom) {
      const atual = transporTom(musica.tom, deslocamento);
      partes.push(`Tom ${atual}`);
    }
    return partes.join(' · ');
  }

  function criarBotoesTom(musica, aoAlterar) {
    const grupo = document.createElement('div');
    grupo.className = 'controle-fonte controle-transposicao';
    grupo.setAttribute('aria-label', 'Transposição da cifra');

    const descer = document.createElement('button');
    descer.type = 'button';
    descer.textContent = '−1';
    descer.setAttribute('aria-label', 'Descer meio tom');

    const original = document.createElement('button');
    original.type = 'button';
    original.setAttribute('aria-label', 'Voltar ao tom original');

    const subir = document.createElement('button');
    subir.type = 'button';
    subir.textContent = '+1';
    subir.setAttribute('aria-label', 'Subir meio tom');

    function atualizar() {
      const deslocamento = obterDeslocamento(musica.id);
      original.textContent = musica.tom ? `Tom ${transporTom(musica.tom, deslocamento)}` : 'Original';
      original.title = deslocamento
        ? `Voltar ao tom original${musica.tom ? ` (${musica.tom})` : ''}`
        : 'Tom original';
      descer.disabled = deslocamento <= -6;
      subir.disabled = deslocamento >= 6;
      aoAlterar(deslocamento);
    }

    descer.addEventListener('click', () => {
      salvarDeslocamento(musica.id, obterDeslocamento(musica.id) - 1);
      atualizar();
    });

    original.addEventListener('click', () => {
      salvarDeslocamento(musica.id, 0);
      atualizar();
    });

    subir.addEventListener('click', () => {
      salvarDeslocamento(musica.id, obterDeslocamento(musica.id) + 1);
      atualizar();
    });

    grupo.append(descer, original, subir);
    return { grupo, atualizar };
  }

  async function prepararPaginaMusica() {
    const area = document.querySelector('#detalheMusica');
    if (!area || area.dataset.transposicaoPreparada === '1') return;

    const cifra = area.querySelector('section[data-modo="cifra"] .texto-musica');
    if (!cifra) return;

    const id = new URLSearchParams(location.search).get('id');
    if (!id) return;

    const catalogo = await carregarCatalogo();
    const musica = catalogo.find(item => item.id === id);
    if (!musica || !musica.cifra) return;

    const meta = area.querySelector('p.meta');
    const barra = document.createElement('div');
    barra.className = 'controles-musica controle-tom-musica';

    const titulo = document.createElement('strong');
    titulo.textContent = 'Transpor cifra';

    const controles = criarBotoesTom(musica, deslocamento => {
      cifra.textContent = transporCifra(musica.cifra, deslocamento);
      if (meta) {
        meta.textContent = `Autor: ${musica.autor || '—'} · Tom: ${transporTom(musica.tom, deslocamento) || '—'}`;
        meta.title = deslocamento && musica.tom ? `Tom original: ${musica.tom}` : '';
      }
    });

    barra.append(titulo, controles.grupo);
    const controlesLeitura = area.querySelector('.controles-musica');
    if (controlesLeitura) area.insertBefore(barra, controlesLeitura);
    else area.appendChild(barra);

    area.dataset.transposicaoPreparada = '1';
    controles.atualizar();
  }

  async function atualizarMetasRoteiro() {
    const roteiro = document.querySelector('#roteiro');
    if (!roteiro) return;

    const catalogo = await carregarCatalogo();
    roteiro.querySelectorAll('.roteiro-item').forEach(item => {
      const link = item.querySelector('a[href*="musica.html?id="]');
      const meta = item.querySelector('.meta');
      if (!link || !meta) return;

      const url = new URL(link.href, location.href);
      const id = url.searchParams.get('id');
      const musica = catalogo.find(registro => registro.id === id);
      if (!musica) return;

      const deslocamento = obterDeslocamento(id);
      meta.textContent = textoMeta(musica, deslocamento);
      meta.title = deslocamento && musica.tom ? `Tom original: ${musica.tom}` : '';
    });
  }

  async function prepararCelebracao() {
    const celebracao = document.querySelector('#celebracao');
    const controlesArea = celebracao?.querySelector('.celebracao-controles');
    if (!celebracao || !controlesArea || celebracao.dataset.transposicaoPreparada === '1') return;

    const catalogo = await carregarCatalogo();
    const titulo = document.querySelector('#celebracaoTitulo');
    const momento = document.querySelector('#celebracaoMomento');
    const meta = document.querySelector('#celebracaoMeta');
    const texto = document.querySelector('#celebracaoTexto');
    const botaoCifra = document.querySelector('#celebracaoCifra');

    const grupo = document.createElement('div');
    grupo.className = 'controle-fonte controle-celebracao-tom';
    grupo.setAttribute('aria-label', 'Tom da música');

    const descer = document.createElement('button');
    descer.type = 'button';
    descer.textContent = '−1';
    descer.setAttribute('aria-label', 'Descer meio tom');

    const original = document.createElement('button');
    original.type = 'button';
    original.textContent = 'Tom';
    original.setAttribute('aria-label', 'Voltar ao tom original');

    const subir = document.createElement('button');
    subir.type = 'button';
    subir.textContent = '+1';
    subir.setAttribute('aria-label', 'Subir meio tom');

    grupo.append(descer, original, subir);
    const fonte = controlesArea.querySelector('.controle-celebracao-fonte');
    if (fonte) controlesArea.insertBefore(grupo, fonte);
    else controlesArea.appendChild(grupo);

    function musicaAtual() {
      const nome = titulo?.textContent.trim();
      const momentoAtual = momento?.textContent.trim();
      return catalogo.find(item =>
        item.titulo === nome && (!momentoAtual || item.momentos.includes(momentoAtual))
      );
    }

    function aplicar() {
      const musica = musicaAtual();
      if (!musica) {
        descer.disabled = true;
        original.disabled = true;
        subir.disabled = true;
        original.textContent = 'Tom';
        return;
      }

      const deslocamento = obterDeslocamento(musica.id);
      const temCifra = Boolean(musica.cifra);
      descer.disabled = !temCifra || deslocamento <= -6;
      original.disabled = !temCifra;
      subir.disabled = !temCifra || deslocamento >= 6;
      original.textContent = musica.tom ? `Tom ${transporTom(musica.tom, deslocamento)}` : 'Original';
      original.title = deslocamento && musica.tom ? `Voltar ao tom original (${musica.tom})` : 'Tom original';

      if (meta) {
        meta.textContent = textoMeta(musica, deslocamento);
        meta.title = deslocamento && musica.tom ? `Tom original: ${musica.tom}` : '';
      }

      if (texto) {
        const cifraAtiva = botaoCifra?.classList.contains('ativo') && temCifra;
        texto.textContent = cifraAtiva
          ? transporCifra(musica.cifra, deslocamento)
          : (musica.letra || musica.cifra || 'Sem letra/cifra cadastrada.');
      }
    }

    function alterar(delta) {
      const musica = musicaAtual();
      if (!musica?.cifra) return;
      salvarDeslocamento(musica.id, obterDeslocamento(musica.id) + delta);
      aplicar();
      atualizarMetasRoteiro();
    }

    descer.addEventListener('click', () => alterar(-1));
    subir.addEventListener('click', () => alterar(1));
    original.addEventListener('click', () => {
      const musica = musicaAtual();
      if (!musica?.cifra) return;
      salvarDeslocamento(musica.id, 0);
      aplicar();
      atualizarMetasRoteiro();
    });

    [
      '#modoCelebracao', '#celebracaoCifra', '#celebracaoLetra',
      '#anterior', '#proxima'
    ].forEach(seletor => {
      document.querySelector(seletor)?.addEventListener('click', () => setTimeout(aplicar, 0));
    });

    if (titulo) {
      new MutationObserver(() => setTimeout(aplicar, 0))
        .observe(titulo, { childList: true, subtree: true, characterData: true });
    }

    if (momento) {
      new MutationObserver(() => setTimeout(aplicar, 0))
        .observe(momento, { childList: true, subtree: true, characterData: true });
    }

    celebracao.dataset.transposicaoPreparada = '1';
    aplicar();
  }

  function observarPaginaMusica() {
    const area = document.querySelector('#detalheMusica');
    if (!area) return;
    prepararPaginaMusica();
    new MutationObserver(prepararPaginaMusica).observe(area, { childList: true, subtree: true });
  }

  function observarRoteiro() {
    const roteiro = document.querySelector('#roteiro');
    if (!roteiro) return;
    atualizarMetasRoteiro();
    new MutationObserver(atualizarMetasRoteiro).observe(roteiro, { childList: true, subtree: true });
    prepararCelebracao();
  }

  observarPaginaMusica();
  observarRoteiro();

  window.MusicasMissaTransposicao = {
    transporTom,
    transporCifra,
    obterDeslocamento
  };
})();