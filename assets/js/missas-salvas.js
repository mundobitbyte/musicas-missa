(() => {
  const CHAVE_MISSA = 'missaAtualV01';
  const CHAVE_DADOS = 'missaDadosV01';
  const CHAVE_TRANSPOSICAO = 'musicasMissaTransposicaoV01';
  const CHAVE_SALVAS = 'musicasMissaSalvasV01';
  const LIMITE = 12;
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

  function lerSalvas() {
    try {
      const valor = JSON.parse(localStorage.getItem(CHAVE_SALVAS));
      return Array.isArray(valor) ? valor.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function gravarSalvas(lista) {
    if (lista.length) localStorage.setItem(CHAVE_SALVAS, JSON.stringify(lista.slice(0, LIMITE)));
    else localStorage.removeItem(CHAVE_SALVAS);
  }

  function normalizarAtual() {
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
      data: /^\d{4}-\d{2}-\d{2}$/.test(dadosOriginais.data || '') ? dadosOriginais.data : '',
      horario: /^\d{2}:\d{2}$/.test(dadosOriginais.horario || '') ? dadosOriginais.horario : ''
    };

    return { dados, escolhas, transposicoes };
  }

  function assinatura(item) {
    return JSON.stringify({ d: item.dados, e: item.escolhas, t: item.transposicoes });
  }

  function salvarAtual() {
    const atual = normalizarAtual();
    if (!Object.keys(atual.escolhas).length) return { salvo: false };

    const agora = new Date().toISOString();
    const lista = lerSalvas();
    const igual = lista.find(item => assinatura(item) === assinatura(atual));

    if (igual) {
      igual.salvoEm = agora;
      gravarSalvas([igual, ...lista.filter(item => item !== igual)]);
      return { salvo: true, atualizado: true };
    }

    const registro = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      salvoEm: agora,
      ...atual
    };

    gravarSalvas([registro, ...lista]);
    return { salvo: true, atualizado: false };
  }

  function formatarData(data) {
    if (!data) return '';
    const partes = data.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
  }

  function formatarInstante(valor) {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(data);
  }

  function configurarBotaoSalvar() {
    const botao = document.querySelector('#salvarMissa');
    const roteiro = document.querySelector('#roteiro');
    const status = document.querySelector('#statusCompartilhamento');
    if (!botao || !roteiro || !status) return;

    function atualizar() {
      botao.disabled = !roteiro.querySelector('.roteiro-item');
    }

    new MutationObserver(atualizar).observe(roteiro, { childList: true, subtree: true });
    atualizar();

    botao.addEventListener('click', () => {
      const resultado = salvarAtual();
      if (!resultado.salvo) return;
      status.textContent = resultado.atualizado
        ? 'Esta Missa já estava salva. A cópia foi atualizada.'
        : 'Missa salva neste aparelho.';
    });
  }

  async function restaurar(item) {
    let catalogo;
    try {
      const resposta = await fetch('data/musicas.json');
      if (!resposta.ok) throw new Error();
      catalogo = await resposta.json();
    } catch {
      window.alert('Não foi possível conferir o repertório agora. Tente novamente.');
      return;
    }

    const porId = new Map(catalogo.map(musica => [String(musica.id), musica]));
    const escolhas = {};
    let ignoradas = 0;

    momentos.forEach(momento => {
      const id = item.escolhas?.[momento];
      const musica = typeof id === 'string' ? porId.get(id) : null;
      if (musica && Array.isArray(musica.momentos) && musica.momentos.includes(momento)) {
        escolhas[momento] = id;
      } else if (id) {
        ignoradas++;
      }
    });

    if (!Object.keys(escolhas).length) {
      window.alert('As músicas desta preparação não estão mais disponíveis no repertório atual.');
      return;
    }

    const atual = lerObjeto(CHAVE_MISSA);
    const dadosAtuais = lerObjeto(CHAVE_DADOS);
    const possuiAtual = Object.keys(atual).length > 0 || Boolean(dadosAtuais.nome || dadosAtuais.data || dadosAtuais.horario);

    if (possuiAtual) {
      const confirmar = window.confirm('Usar esta Missa substituirá a preparação atual deste aparelho. Deseja continuar?');
      if (!confirmar) return;
    }

    localStorage.setItem(CHAVE_MISSA, JSON.stringify(escolhas));

    const dados = item.dados || {};
    if (dados.nome || dados.data || dados.horario) localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
    else localStorage.removeItem(CHAVE_DADOS);

    const mapa = lerObjeto(CHAVE_TRANSPOSICAO);
    const ids = new Set(Object.values(escolhas));
    ids.forEach(id => { delete mapa[id]; });

    ids.forEach(id => {
      const valor = Number.parseInt(item.transposicoes?.[id], 10);
      if (Number.isInteger(valor) && valor >= -6 && valor <= 6 && valor !== 0) mapa[id] = valor;
    });

    if (Object.keys(mapa).length) localStorage.setItem(CHAVE_TRANSPOSICAO, JSON.stringify(mapa));
    else localStorage.removeItem(CHAVE_TRANSPOSICAO);

    if (ignoradas) window.alert(`${ignoradas} ${ignoradas === 1 ? 'música não estava mais disponível e foi ignorada' : 'músicas não estavam mais disponíveis e foram ignoradas'}.`);
    location.href = 'roteiro.html';
  }

  function criarCard(item, indice) {
    const card = document.createElement('section');
    card.className = 'roteiro-item';

    const numero = document.createElement('span');
    numero.className = 'roteiro-numero';
    numero.textContent = String(indice + 1).padStart(2, '0');
    numero.setAttribute('aria-hidden', 'true');

    const conteudo = document.createElement('div');
    conteudo.className = 'roteiro-conteudo';

    const sobrelinha = document.createElement('p');
    sobrelinha.className = 'sobrelinha';
    sobrelinha.textContent = item.dados?.data ? formatarData(item.dados.data) : 'Missa salva';

    const titulo = document.createElement('h2');
    titulo.textContent = item.dados?.nome || 'Missa sem título';

    const quantidade = Object.keys(item.escolhas || {}).length;
    const partes = [];
    if (item.dados?.horario) partes.push(item.dados.horario);
    partes.push(`${quantidade} ${quantidade === 1 ? 'música' : 'músicas'}`);
    const salvoEm = formatarInstante(item.salvoEm);
    if (salvoEm) partes.push(`salva em ${salvoEm}`);

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = partes.join(' · ');

    const acoes = document.createElement('div');
    acoes.className = 'acoes';

    const usar = document.createElement('button');
    usar.className = 'botao primario';
    usar.type = 'button';
    usar.textContent = 'Usar esta Missa';
    usar.addEventListener('click', () => restaurar(item));

    const excluir = document.createElement('button');
    excluir.className = 'botao';
    excluir.type = 'button';
    excluir.textContent = 'Excluir';
    excluir.addEventListener('click', () => {
      const nome = item.dados?.nome || 'esta Missa';
      if (!window.confirm(`Excluir “${nome}” das Missas salvas neste aparelho?`)) return;
      gravarSalvas(lerSalvas().filter(registro => registro.id !== item.id));
      renderizarSalvas();
    });

    acoes.append(usar, excluir);
    conteudo.append(sobrelinha, titulo, meta, acoes);
    card.append(numero, conteudo);
    return card;
  }

  function renderizarSalvas() {
    const area = document.querySelector('#listaMissasSalvas');
    const contador = document.querySelector('#contadorMissasSalvas');
    if (!area) return;

    const lista = lerSalvas().sort((a, b) => String(b.salvoEm || '').localeCompare(String(a.salvoEm || '')));
    area.innerHTML = '';

    if (contador) {
      contador.textContent = `${lista.length} de ${LIMITE} ${lista.length === 1 ? 'Missa salva' : 'Missas salvas'} neste aparelho.`;
    }

    if (!lista.length) {
      const vazio = document.createElement('div');
      vazio.className = 'estado-vazio';
      vazio.append('Nenhuma Missa salva ainda. Prepare uma Missa e, no roteiro, use “Salvar Missa”.');
      area.appendChild(vazio);
      return;
    }

    lista.forEach((item, indice) => area.appendChild(criarCard(item, indice)));
  }

  configurarBotaoSalvar();
  renderizarSalvas();
})();
