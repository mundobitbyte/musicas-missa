(() => {
  const CHAVE_RASCUNHO = 'musicasMissaCadastroRascunhoV01';
  const MOMENTOS = [
    'Entrada', 'Perdão', 'Glória', 'Salmo', 'Aclamação',
    'Oferendas', 'Santo', 'Cordeiro', 'Comunhão', 'Pós-Comunhão', 'Final'
  ];

  const form = document.querySelector('#formCadastroMusica');
  if (!form) return;

  const campos = {
    id: document.querySelector('#musicaId'),
    titulo: document.querySelector('#musicaTitulo'),
    autor: document.querySelector('#musicaAutor'),
    tom: document.querySelector('#musicaTom'),
    youtube: document.querySelector('#musicaYoutube'),
    fonte: document.querySelector('#musicaFonte'),
    fonteUrl: document.querySelector('#musicaFonteUrl'),
    direitos: document.querySelector('#musicaDireitos'),
    letra: document.querySelector('#musicaLetra'),
    cifra: document.querySelector('#musicaCifra'),
    observacoes: document.querySelector('#musicaObservacoes')
  };

  const areaMomentos = document.querySelector('#momentosCadastro');
  const statusRascunho = document.querySelector('#statusRascunho');
  const avisoDireitos = document.querySelector('#avisoDireitos');
  const contadorLetra = document.querySelector('#contadorLetra');
  const resultado = document.querySelector('#resultadoCadastro');
  const resumoValidacao = document.querySelector('#resumoValidacao');
  const saidaJson = document.querySelector('#saidaJson');
  const statusSaida = document.querySelector('#statusSaida');

  let catalogo = [];
  let temporizadorSalvamento = null;

  function criarMomentos() {
    MOMENTOS.forEach(momento => {
      const label = document.createElement('label');
      label.className = 'cadastro-momento-opcao';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'momentos';
      input.value = momento;

      const texto = document.createElement('span');
      texto.textContent = momento;

      label.append(input, texto);
      areaMomentos.appendChild(label);
    });
  }

  function momentosSelecionados() {
    return [...form.querySelectorAll('input[name="momentos"]:checked')]
      .map(input => input.value);
  }

  function definirMomentos(momentos) {
    const conjunto = new Set(Array.isArray(momentos) ? momentos : []);
    form.querySelectorAll('input[name="momentos"]').forEach(input => {
      input.checked = conjunto.has(input.value);
    });
  }

  function dadosDoFormulario() {
    return {
      id: campos.id.value.trim(),
      titulo: campos.titulo.value.trim(),
      autor: campos.autor.value.trim(),
      momentos: momentosSelecionados(),
      tom: campos.tom.value.trim(),
      letra: campos.letra.value.replace(/\r\n/g, '\n').trim(),
      cifra: campos.cifra.value.replace(/\r\n/g, '\n').trim(),
      youtube: campos.youtube.value.trim(),
      fonte: campos.fonte.value.trim(),
      fonteUrl: campos.fonteUrl.value.trim(),
      direitos: campos.direitos.value,
      observacoes: campos.observacoes.value.trim()
    };
  }

  function preencherFormulario(dados) {
    if (!dados || typeof dados !== 'object') return;

    Object.entries(campos).forEach(([chave, campo]) => {
      if (chave in dados && typeof dados[chave] === 'string') {
        campo.value = dados[chave];
      }
    });

    definirMomentos(dados.momentos);
    atualizarContadorLetra();
    atualizarAvisoDireitos();
  }

  function atualizarStatusRascunho(texto) {
    if (!statusRascunho) return;
    statusRascunho.textContent = texto;
  }

  function salvarRascunho(mostrarStatus = true) {
    const dados = dadosDoFormulario();
    const temConteudo = Object.entries(dados).some(([chave, valor]) =>
      chave === 'momentos' ? valor.length > 0 : Boolean(valor)
    );

    if (temConteudo) {
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(dados));
      if (mostrarStatus) atualizarStatusRascunho('Rascunho salvo');
    } else {
      localStorage.removeItem(CHAVE_RASCUNHO);
      if (mostrarStatus) atualizarStatusRascunho('Rascunho vazio');
    }
  }

  function agendarSalvamento() {
    clearTimeout(temporizadorSalvamento);
    atualizarStatusRascunho('Salvando…');
    temporizadorSalvamento = setTimeout(() => salvarRascunho(true), 500);
  }

  function restaurarRascunho() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO));
      if (!dados) return false;
      preencherFormulario(dados);
      atualizarStatusRascunho('Rascunho recuperado');
      return true;
    } catch {
      return false;
    }
  }

  function proximoId() {
    const numeros = catalogo
      .map(item => Number.parseInt(item.id, 10))
      .filter(Number.isInteger);
    const proximo = numeros.length ? Math.max(...numeros) + 1 : 1;
    return String(proximo).padStart(3, '0');
  }

  async function carregarCatalogo() {
    try {
      const resposta = await fetch('data/musicas.json');
      if (!resposta.ok) return;
      const dados = await resposta.json();
      catalogo = Array.isArray(dados) ? dados : [];
      if (!campos.id.value.trim()) campos.id.value = proximoId();
    } catch {
      catalogo = [];
    }
  }

  function atualizarContadorLetra() {
    if (!contadorLetra) return;
    const quantidade = campos.letra.value.length;
    contadorLetra.textContent = `${quantidade} caractere${quantidade === 1 ? '' : 's'}`;
  }

  function atualizarAvisoDireitos() {
    if (!avisoDireitos) return;

    const mensagens = {
      '': 'Defina a situação dos direitos antes de gerar o cadastro.',
      'proprio-autorizado': 'A letra e a cifra poderão entrar no cadastro gerado, desde que a autorização realmente cubra a republicação.',
      'dominio-publico': 'A letra e a cifra poderão entrar no cadastro gerado. Confirme se a obra realmente está em domínio público.',
      'verificar-autorizacao': 'O rascunho pode ser preparado aqui, mas o JSON gerado não levará letra nem cifra até a autorização ser confirmada.',
      'somente-link': 'O JSON gerado manterá apenas os dados da música e a fonte. Letra e cifra não serão levadas para publicação.'
    };

    avisoDireitos.textContent = mensagens[campos.direitos.value] || mensagens[''];
  }

  function conteudoPodeSerPublicado(direitos) {
    return direitos === 'proprio-autorizado' || direitos === 'dominio-publico';
  }

  function rotuloDireitos(valor) {
    const rotulos = {
      'proprio-autorizado': 'próprio ou autorizado',
      'dominio-publico': 'domínio público',
      'verificar-autorizacao': 'autorização a verificar',
      'somente-link': 'somente link — não republicar letra/cifra'
    };
    return rotulos[valor] || valor;
  }

  function validar() {
    if (!form.checkValidity()) {
      form.reportValidity();
      return { ok: false, mensagem: 'Preencha os campos obrigatórios indicados.' };
    }

    const dados = dadosDoFormulario();

    if (!dados.momentos.length) {
      areaMomentos.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return { ok: false, mensagem: 'Escolha pelo menos um momento da Missa.' };
    }

    const idDuplicado = catalogo.some(item => String(item.id) === dados.id);
    if (idDuplicado) {
      campos.id.focus();
      return { ok: false, mensagem: `O ID ${dados.id} já existe no repertório. Escolha outro.` };
    }

    return { ok: true, dados };
  }

  function montarRegistro(dados) {
    const publicarConteudo = conteudoPodeSerPublicado(dados.direitos);

    return {
      id: dados.id,
      titulo: dados.titulo,
      autor: dados.autor,
      momentos: dados.momentos,
      tom: dados.tom,
      letra: publicarConteudo ? dados.letra : '',
      cifra: publicarConteudo ? dados.cifra : '',
      youtube: dados.youtube,
      audio: '',
      fonte: dados.fonte,
      fonteUrl: dados.fonteUrl,
      direitos: rotuloDireitos(dados.direitos),
      observacoes: dados.observacoes
    };
  }

  function gerarCadastro() {
    const validacao = validar();
    if (!validacao.ok) {
      resultado.hidden = false;
      resumoValidacao.innerHTML = '';
      const forte = document.createElement('strong');
      forte.textContent = 'Cadastro ainda não pode ser gerado.';
      const texto = document.createElement('span');
      texto.textContent = validacao.mensagem;
      resumoValidacao.append(forte, texto);
      saidaJson.textContent = '';
      resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const registro = montarRegistro(validacao.dados);
    const conteudoRetido = !conteudoPodeSerPublicado(validacao.dados.direitos) &&
      Boolean(validacao.dados.letra || validacao.dados.cifra);

    saidaJson.textContent = JSON.stringify(registro, null, 2);
    resumoValidacao.innerHTML = '';

    const forte = document.createElement('strong');
    forte.textContent = conteudoRetido ? 'Cadastro gerado com proteção de conteúdo.' : 'Cadastro gerado.';

    const texto = document.createElement('span');
    texto.textContent = conteudoRetido
      ? 'A letra e a cifra continuam no rascunho deste aparelho, mas foram retiradas do JSON porque os direitos ainda não permitem republicação.'
      : 'Revise o resultado antes de incorporar a música ao repertório.';

    resumoValidacao.append(forte, texto);
    resultado.hidden = false;
    statusSaida.textContent = '';
    salvarRascunho(false);
    resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copiarJson() {
    const texto = saidaJson.textContent;
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
      statusSaida.textContent = 'JSON copiado para a área de transferência.';
    } catch {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const sucesso = document.execCommand('copy');
      area.remove();
      statusSaida.textContent = sucesso
        ? 'JSON copiado para a área de transferência.'
        : 'Não foi possível copiar automaticamente. Selecione o JSON acima e copie manualmente.';
    }
  }

  function nomeArquivo() {
    const dados = dadosDoFormulario();
    const base = (dados.titulo || `musica-${dados.id || 'cadastro'}`)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'cadastro-musica';
    return `${base}.json`;
  }

  function baixarJson() {
    const texto = saidaJson.textContent;
    if (!texto) return;

    const blob = new Blob([`${texto}\n`], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    statusSaida.textContent = 'Arquivo JSON preparado.';
  }

  function novoCadastro() {
    const dados = dadosDoFormulario();
    const temConteudo = Object.entries(dados).some(([chave, valor]) =>
      chave === 'momentos' ? valor.length > 0 : Boolean(valor)
    );

    if (temConteudo && !window.confirm('Começar um novo cadastro? O rascunho atual deste aparelho será apagado.')) {
      return;
    }

    form.reset();
    definirMomentos([]);
    localStorage.removeItem(CHAVE_RASCUNHO);
    resultado.hidden = true;
    saidaJson.textContent = '';
    statusSaida.textContent = '';
    campos.id.value = proximoId();
    atualizarContadorLetra();
    atualizarAvisoDireitos();
    atualizarStatusRascunho('Novo rascunho');
    campos.titulo.focus();
  }

  function usarLetraNaCifra() {
    const letra = campos.letra.value.trim();
    if (!letra) {
      campos.letra.focus();
      return;
    }

    if (campos.cifra.value.trim() && !window.confirm('A cifra já contém texto. Substituir pelo conteúdo atual da letra?')) {
      return;
    }

    campos.cifra.value = campos.letra.value;
    campos.cifra.focus();
    agendarSalvamento();
  }

  criarMomentos();
  const restaurado = restaurarRascunho();
  carregarCatalogo().then(() => {
    if (!restaurado && !campos.id.value.trim()) campos.id.value = proximoId();
  });

  form.addEventListener('input', evento => {
    if (evento.target === campos.letra) atualizarContadorLetra();
    if (evento.target === campos.direitos) atualizarAvisoDireitos();
    agendarSalvamento();
  });
  form.addEventListener('change', evento => {
    if (evento.target === campos.direitos) atualizarAvisoDireitos();
    agendarSalvamento();
  });

  document.querySelector('#usarLetraNaCifra').addEventListener('click', usarLetraNaCifra);
  document.querySelector('#salvarRascunho').addEventListener('click', () => salvarRascunho(true));
  document.querySelector('#novoCadastro').addEventListener('click', novoCadastro);
  document.querySelector('#gerarCadastro').addEventListener('click', gerarCadastro);
  document.querySelector('#copiarJson').addEventListener('click', copiarJson);
  document.querySelector('#baixarJson').addEventListener('click', baixarJson);

  atualizarContadorLetra();
  atualizarAvisoDireitos();
})();
