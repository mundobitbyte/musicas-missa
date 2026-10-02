function montarTextoRoteiroParaCompartilhar() {
  const linhas = ['Roteiro da Missa'];
  const identificacao = document.querySelector('#identificacaoRoteiro');

  if (identificacao && !identificacao.classList.contains('oculto') && identificacao.textContent.trim()) {
    linhas.push(identificacao.textContent.trim());
  }

  linhas.push('');

  document.querySelectorAll('.roteiro-item').forEach((item, indice) => {
    const momento = item.querySelector('.sobrelinha')?.textContent.trim() || '';
    const titulo = item.querySelector('h2')?.textContent.trim() || '';
    const meta = item.querySelector('.meta')?.textContent.trim() || '';

    let linha = `${indice + 1}. ${momento}: ${titulo}`;
    if (meta) linha += ` — ${meta}`;
    linhas.push(linha);
  });

  return linhas.join('\n').trim();
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

function iniciarCompartilhamentoRoteiro() {
  const botao = document.querySelector('#compartilharRoteiro');
  const status = document.querySelector('#statusCompartilhamento');
  const roteiro = document.querySelector('#roteiro');
  if (!botao || !status || !roteiro) return;

  function atualizarDisponibilidade() {
    botao.disabled = !roteiro.querySelector('.roteiro-item');
  }

  const observador = new MutationObserver(atualizarDisponibilidade);
  observador.observe(roteiro, { childList: true, subtree: true });
  atualizarDisponibilidade();

  botao.addEventListener('click', async () => {
    const texto = montarTextoRoteiroParaCompartilhar();
    if (!roteiro.querySelector('.roteiro-item')) return;

    status.textContent = '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Roteiro da Missa',
          text: texto
        });
        status.textContent = 'Roteiro compartilhado.';
        return;
      } catch (erro) {
        if (erro?.name === 'AbortError') return;
      }
    }

    try {
      await copiarTexto(texto);
      status.textContent = 'Roteiro copiado. Agora é só colar onde quiser.';
    } catch {
      status.textContent = 'Não foi possível compartilhar ou copiar o roteiro neste navegador.';
    }
  });
}

iniciarCompartilhamentoRoteiro();
