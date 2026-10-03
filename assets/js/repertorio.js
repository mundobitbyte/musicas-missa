let musicas = [];
let momentoAtivo = '';
let somenteFavoritas = false;

async function carregarMusicas() {
  const resposta = await fetch('data/musicas.json');
  if (!resposta.ok) throw new Error('Não foi possível carregar o repertório.');
  return resposta.json();
}

function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function musicaFavorita(id) {
  return Boolean(window.MusicasMissaFavoritos?.tem(id));
}

function criarFiltros() {
  const area = document.querySelector('#filtrosRapidos');
  const momentos = [...new Set(musicas.flatMap(m => m.momentos))];

  const ordem = [
    'Entrada','Perdão','Glória','Salmo','Aclamação',
    'Oferendas','Santo','Cordeiro','Comunhão','Pós-Comunhão','Final'
  ];

  momentos.sort((a,b) => {
    const ia = ordem.indexOf(a);
    const ib = ordem.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const opcoes = [
    { rotulo: 'Todas', valor: '', tipo: 'momento' },
    { rotulo: '★ Favoritas', valor: '', tipo: 'favoritas' },
    ...momentos.map(momento => ({ rotulo: momento, valor: momento, tipo: 'momento' }))
  ];

  opcoes.forEach(opcao => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'filtro-chip';
    botao.textContent = opcao.rotulo;

    const ativo = opcao.tipo === 'favoritas'
      ? somenteFavoritas
      : !somenteFavoritas && opcao.valor === momentoAtivo;
    if (ativo) botao.classList.add('ativo');

    botao.addEventListener('click', () => {
      somenteFavoritas = opcao.tipo === 'favoritas';
      momentoAtivo = somenteFavoritas ? '' : opcao.valor;

      document.querySelectorAll('.filtro-chip').forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      desenhar();
    });

    area.appendChild(botao);
  });
}

function desenhar() {
  const termo = normalizar(document.querySelector('#pesquisa').value);

  const filtradas = musicas.filter(musica => {
    const texto = normalizar([
      musica.titulo,
      musica.autor,
      musica.momentos.join(' ')
    ].join(' '));

    return (!termo || texto.includes(termo)) &&
           (!momentoAtivo || musica.momentos.includes(momentoAtivo)) &&
           (!somenteFavoritas || musicaFavorita(musica.id));
  });

  const lista = document.querySelector('#listaMusicas');
  const contador = document.querySelector('#contador');

  contador.textContent = `${filtradas.length} música${filtradas.length === 1 ? '' : 's'}`;
  lista.innerHTML = '';

  if (!filtradas.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio';
    vazio.textContent = somenteFavoritas
      ? 'Nenhuma música foi marcada como favorita ainda.'
      : 'Nenhuma música encontrada.';
    lista.appendChild(vazio);
    return;
  }

  filtradas.forEach(musica => {
    const link = document.createElement('a');
    link.className = 'linha-musica';
    link.href = `musica.html?id=${encodeURIComponent(musica.id)}`;

    const principal = document.createElement('div');
    principal.className = 'linha-musica-principal';

    const titulo = document.createElement('strong');
    titulo.className = 'linha-musica-titulo';
    titulo.textContent = musicaFavorita(musica.id)
      ? `★ ${musica.titulo}`
      : musica.titulo;

    const autor = document.createElement('span');
    autor.className = 'linha-musica-autor';
    autor.textContent = musica.autor || 'Autor não informado';

    principal.append(titulo, autor);

    const momentos = document.createElement('div');
    momentos.className = 'linha-musica-momentos';
    momentos.textContent = musica.momentos.join(' · ');

    const tom = document.createElement('div');
    tom.className = 'linha-musica-tom';
    tom.textContent = musica.tom ? `Tom: ${musica.tom}` : 'Tom: —';

    const seta = document.createElement('span');
    seta.className = 'linha-musica-seta';
    seta.setAttribute('aria-hidden', 'true');
    seta.textContent = '›';

    link.append(principal, momentos, tom, seta);
    lista.appendChild(link);
  });
}

async function iniciar() {
  musicas = await carregarMusicas();

  const inicial = new URLSearchParams(location.search).get('momento');
  if (inicial) momentoAtivo = inicial;

  criarFiltros();
  document.querySelector('#pesquisa').addEventListener('input', desenhar);
  window.addEventListener('musicasmissa:favoritos-alterados', desenhar);
  desenhar();
}

iniciar().catch(erro => {
  const lista = document.querySelector('#listaMusicas');
  lista.innerHTML = '';
  const vazio = document.createElement('div');
  vazio.className = 'estado-vazio';
  vazio.textContent = erro.message;
  lista.appendChild(vazio);
});
