(() => {
  const CHAVE_MISSA = 'missaAtualV01';
  const CHAVE_DADOS = 'missaDadosV01';
  const CHAVE_TRANSPOSICAO = 'musicasMissaTransposicaoV01';
  const PARAMETRO = 'missa';
  const momentos = [
    'Entrada', 'Perdão', 'Glória', 'Salmo', 'Aclamação',
    'Oferendas', 'Santo', 'Cordeiro', 'Comunhão', 'Pós-Comunhão', 'Final'
  ];

  function lerObjeto(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || {};
    } catch {
      return {};
    }
  }

  function codificar(objeto) {
    const bytes = new TextEncoder().encode(JSON.stringify(objeto));
    let binario = '';
    bytes.forEach(byte => { binario += String.fromCharCode(byte); });
    return btoa(binario)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function decodificar(texto) {
    const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
    const complemento = '='.repeat((4 - base64.length % 4) % 4);
    const binario = atob(base64 + complemento);
    const bytes = Uint8Array.from(binario, caractere => caractere.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function criarPacote() {
    const escolhasOriginais = lerObjeto(CHAVE_MISSA);
    const dadosOriginais = lerObjeto(CHAVE_DADOS);
    const transposicoesOriginais = lerObjeto(CHAVE_TRANSPOSICAO);

    const escolhas = {};
    momentos.forEach(momento => {
      const id = escolhasOriginais[momento];
      if (typeof id === 'string' && id) escolhas[momento] = id;
    });

    const ids = new Set(Object.values(escolhas));
    const transposicoes = {};
    ids.forEach(id => {
      const valor = Number.parseInt(transposicoesOriginais[id], 10);
      if (Number.isInteger(valor) && valor >= -6 && valor <= 6 && valor !== 0) {
        transposicoes[id] = valor;
      }
    });

    const dados = {
      nome: typeof dadosOriginais.nome === 'string' ? dadosOriginais.nome.slice(0, 80) : '',
      data: typeof dadosOriginais.data === 'string' ? dadosOriginais.data : '',
      horario: typeof dadosOriginais.horario === 'string' ? dadosOriginais.horario : ''
    };

    return { v: 1, d: dados, e: escolhas, t: transposicoes };
  }

  async function copiarTexto(texto) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return;
    }

    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    document.execCommand('copy');
    campo.remove();
  }

  function configurarCompartilhamento() {
    const botao = document.querySelector('#compartilharPreparacao');
    const roteiro = document.querySelector('#roteiro');
    const status = document.querySelector('#statusCompartilhamento');
    if (!botao || !roteiro || !status) return;

    function atualizarDisponibilidade() {
      botao.disabled = !roteiro.querySelector('.roteiro-item');
    }

    new MutationObserver(atualizarDisponibilidade)
      .observe(roteiro, { childList: true, subtree: true });
    atualizarDisponibilidade();

    botao.addEventListener('click', async () => {
      if (!roteiro.querySelector('.roteiro-item')) return;

      const pacote = criarPacote();
      const url = new URL('roteiro.html', location.href);
      url.searchParams.set(PARAMETRO, codificar(pacote));
      const link = url.toString();
      const texto = 'Abra este link para receber a preparação desta Missa no seu aparelho.';

      status.textContent = '';

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Preparação da Missa',
            text: texto,
            url: link
          });
          status.textContent = 'Preparação compartilhada.';
          return;
        } catch (erro) {
          if (erro?.name === 'AbortError') return;
        }
      }

      try {
        await copiarTexto(link);
        status.textContent = 'Link da preparação copiado. Agora é só enviar para o outro aparelho.';
      } catch {
        status.textContent = 'Não foi possível compartilhar ou copiar o link neste navegador.';
      }
    });
  }

  function limparParametro() {
    const url = new URL(location.href);
    url.searchParams.delete(PARAMETRO);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  async function importarSeNecessario() {
    const parametros = new URLSearchParams(location.search);
    const recebido = parametros.get(PARAMETRO);
    const status = document.querySelector('#statusCompartilhamento');

    if (!recebido) {
      if (parametros.get('importado') === '1' && status) {
        status.textContent = 'Preparação recebida neste aparelho.';
        const url = new URL(location.href);
        url.searchParams.delete('importado');
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      }
      return;
    }

    let pacote;
    try {
      pacote = decodificar(recebido);
      if (!pacote || pacote.v !== 1 || typeof pacote.e !== 'object' || pacote.e === null) {
        throw new Error('Formato inválido');
      }
    } catch {
      if (status) status.textContent = 'Este link de preparação é inválido ou está incompleto.';
      limparParametro();
      return;
    }

    try {
      const resposta = await fetch('data/musicas.json');
      if (!resposta.ok) throw new Error('Repertório indisponível');
      const catalogo = await resposta.json();
      const porId = new Map(catalogo.map(musica => [String(musica.id), musica]));

      const escolhas = {};
      momentos.forEach(momento => {
        const id = pacote.e[momento];
        const musica = typeof id === 'string' ? porId.get(id) : null;
        if (musica && Array.isArray(musica.momentos) && musica.momentos.includes(momento)) {
          escolhas[momento] = id;
        }
      });

      const idsSelecionados = new Set(Object.values(escolhas));
      if (!idsSelecionados.size) throw new Error('Nenhuma música válida');

      const dadosRecebidos = pacote.d && typeof pacote.d === 'object' ? pacote.d : {};
      const dados = {
        nome: typeof dadosRecebidos.nome === 'string' ? dadosRecebidos.nome.slice(0, 80) : '',
        data: /^\d{4}-\d{2}-\d{2}$/.test(dadosRecebidos.data || '') ? dadosRecebidos.data : '',
        horario: /^\d{2}:\d{2}$/.test(dadosRecebidos.horario || '') ? dadosRecebidos.horario : ''
      };

      const atual = lerObjeto(CHAVE_MISSA);
      const dadosAtuais = lerObjeto(CHAVE_DADOS);
      const possuiAtual = Object.keys(atual).length > 0 || Boolean(dadosAtuais.nome || dadosAtuais.data || dadosAtuais.horario);
      const quantidade = Object.keys(escolhas).length;

      const mensagem = possuiAtual
        ? `Este link contém ${quantidade} ${quantidade === 1 ? 'música' : 'músicas'}. Importar esta preparação substituirá a Missa atualmente salva neste aparelho. Deseja continuar?`
        : `Este link contém ${quantidade} ${quantidade === 1 ? 'música' : 'músicas'}. Deseja importar esta preparação para este aparelho?`;

      if (!window.confirm(mensagem)) {
        limparParametro();
        return;
      }

      localStorage.setItem(CHAVE_MISSA, JSON.stringify(escolhas));

      if (dados.nome || dados.data || dados.horario) {
        localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
      } else {
        localStorage.removeItem(CHAVE_DADOS);
      }

      const mapaTransposicoes = lerObjeto(CHAVE_TRANSPOSICAO);
      idsSelecionados.forEach(id => { delete mapaTransposicoes[id]; });

      const recebidas = pacote.t && typeof pacote.t === 'object' ? pacote.t : {};
      idsSelecionados.forEach(id => {
        const valor = Number.parseInt(recebidas[id], 10);
        if (Number.isInteger(valor) && valor >= -6 && valor <= 6 && valor !== 0) {
          mapaTransposicoes[id] = valor;
        }
      });

      if (Object.keys(mapaTransposicoes).length) {
        localStorage.setItem(CHAVE_TRANSPOSICAO, JSON.stringify(mapaTransposicoes));
      } else {
        localStorage.removeItem(CHAVE_TRANSPOSICAO);
      }

      location.replace('roteiro.html?importado=1');
    } catch {
      if (status) status.textContent = 'Não foi possível importar esta preparação. Verifique o link e tente novamente.';
      limparParametro();
    }
  }

  importarSeNecessario();
  configurarCompartilhamento();
})();
