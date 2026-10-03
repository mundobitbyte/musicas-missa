(() => {
  const zona = document.querySelector('#zonaImagemCadastro');
  const arquivoInput = document.querySelector('#arquivoImagemCadastro');
  const previewArea = document.querySelector('#previewImagemWrap');
  const preview = document.querySelector('#previewImagemCadastro');
  const nomeImagem = document.querySelector('#nomeImagemCadastro');
  const extrair = document.querySelector('#extrairTextoImagem');
  const limpar = document.querySelector('#limparImagemCadastro');
  const progresso = document.querySelector('#progressoOcr');
  const status = document.querySelector('#statusOcr');
  const resultado = document.querySelector('#resultadoOcr');
  const textoExtraido = document.querySelector('#textoExtraidoOcr');
  const usarLetra = document.querySelector('#usarOcrLetra');
  const usarCifra = document.querySelector('#usarOcrCifra');
  const campoLetra = document.querySelector('#musicaLetra');
  const campoCifra = document.querySelector('#musicaCifra');

  if (!zona || !arquivoInput || !previewArea || !preview || !extrair || !limpar ||
      !progresso || !status || !resultado || !textoExtraido || !usarLetra ||
      !usarCifra || !campoLetra || !campoCifra) return;

  const URL_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  let imagemAtual = null;
  let urlPreview = '';
  let worker = null;
  let carregandoBiblioteca = null;
  let processando = false;

  function formatarTamanho(bytes) {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function definirStatus(mensagem) {
    status.textContent = mensagem;
  }

  function definirProgresso(valor) {
    const numero = Number.isFinite(valor) ? Math.max(0, Math.min(100, valor)) : 0;
    progresso.value = numero;
    progresso.setAttribute('aria-valuenow', String(numero));
  }

  function atualizarAcoes() {
    extrair.disabled = !imagemAtual || processando;
    limpar.disabled = !imagemAtual || processando;
    const temTexto = Boolean(textoExtraido.value.trim());
    usarLetra.disabled = !temTexto || processando;
    usarCifra.disabled = !temTexto || processando;
  }

  function carregarImagem(arquivo, nomeAlternativo = '') {
    if (!arquivo || !arquivo.type?.startsWith('image/')) {
      definirStatus('Escolha ou cole um arquivo de imagem válido.');
      return;
    }

    if (urlPreview) URL.revokeObjectURL(urlPreview);
    imagemAtual = arquivo;
    urlPreview = URL.createObjectURL(arquivo);
    preview.src = urlPreview;
    preview.alt = 'Prévia da imagem escolhida para reconhecimento de texto';
    previewArea.hidden = false;

    const nome = arquivo.name || nomeAlternativo || 'Imagem colada';
    nomeImagem.textContent = `${nome}${arquivo.size ? ` · ${formatarTamanho(arquivo.size)}` : ''}`;

    textoExtraido.value = '';
    resultado.hidden = true;
    definirProgresso(0);
    definirStatus('Imagem pronta. Clique em “Extrair texto da imagem”.');
    atualizarAcoes();
  }

  function limparImagem() {
    if (processando) return;

    imagemAtual = null;
    arquivoInput.value = '';
    textoExtraido.value = '';
    resultado.hidden = true;
    previewArea.hidden = true;
    preview.removeAttribute('src');
    nomeImagem.textContent = '';
    definirProgresso(0);
    definirStatus('Cole uma imagem aqui ou escolha um arquivo.');

    if (urlPreview) {
      URL.revokeObjectURL(urlPreview);
      urlPreview = '';
    }

    atualizarAcoes();
  }

  function carregarBiblioteca() {
    if (window.Tesseract?.createWorker) return Promise.resolve(window.Tesseract);
    if (carregandoBiblioteca) return carregandoBiblioteca;

    carregandoBiblioteca = new Promise((resolve, reject) => {
      const existente = document.querySelector('script[data-tesseract-cadastro]');
      if (existente) {
        existente.addEventListener('load', () => resolve(window.Tesseract), { once: true });
        existente.addEventListener('error', () => reject(new Error('Não foi possível carregar o OCR.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = URL_TESSERACT;
      script.async = true;
      script.dataset.tesseractCadastro = '1';
      script.referrerPolicy = 'no-referrer';
      script.addEventListener('load', () => {
        if (window.Tesseract?.createWorker) resolve(window.Tesseract);
        else reject(new Error('A biblioteca de OCR não ficou disponível.'));
      }, { once: true });
      script.addEventListener('error', () => reject(new Error('Não foi possível carregar o OCR. Verifique a conexão com a internet.')), { once: true });
      document.head.appendChild(script);
    }).catch(erro => {
      carregandoBiblioteca = null;
      throw erro;
    });

    return carregandoBiblioteca;
  }

  function mensagemDoLogger(info) {
    const rotulos = {
      'loading tesseract core': 'Carregando mecanismo de OCR…',
      'initializing tesseract': 'Inicializando OCR…',
      'loading language traineddata': 'Carregando português…',
      'initializing api': 'Preparando reconhecimento…',
      'recognizing text': 'Lendo a imagem…'
    };
    return rotulos[info.status] || 'Processando imagem…';
  }

  async function obterWorker(Tesseract) {
    if (worker) return worker;

    worker = await Tesseract.createWorker('por', 1, {
      logger: info => {
        definirStatus(mensagemDoLogger(info));
        if (Number.isFinite(info.progress)) definirProgresso(Math.round(info.progress * 100));
      }
    });

    return worker;
  }

  async function extrairTexto() {
    if (!imagemAtual || processando) return;

    processando = true;
    atualizarAcoes();
    resultado.hidden = true;
    definirProgresso(0);
    definirStatus('Preparando OCR… Na primeira vez, o carregamento pode demorar um pouco.');

    try {
      const Tesseract = await carregarBiblioteca();
      const ocr = await obterWorker(Tesseract);
      const retorno = await ocr.recognize(imagemAtual, { rotateAuto: true });
      const texto = String(retorno?.data?.text || '')
        .replace(/\f/g, '')
        .replace(/\r\n/g, '\n')
        .trim();

      textoExtraido.value = texto;
      resultado.hidden = false;
      definirProgresso(100);

      if (texto) {
        definirStatus('Texto extraído. Revise abaixo antes de enviar para Letra ou Cifra.');
        textoExtraido.focus();
      } else {
        definirStatus('Nenhum texto foi reconhecido. Tente uma imagem mais nítida ou com maior resolução.');
      }
    } catch (erro) {
      console.error(erro);
      definirStatus(erro?.message || 'Não foi possível reconhecer o texto desta imagem.');
      definirProgresso(0);
    } finally {
      processando = false;
      atualizarAcoes();
    }
  }

  function enviarParaCampo(campo, nome) {
    const texto = textoExtraido.value.trim();
    if (!texto) return;

    if (campo.value.trim()) {
      const substituir = window.confirm(`${nome} já contém conteúdo. Substituir pelo texto extraído da imagem?`);
      if (!substituir) return;
    }

    campo.value = texto;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.focus();
    campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    definirStatus(`Texto enviado para ${nome}. Revise o conteúdo antes de gerar o cadastro.`);
  }

  arquivoInput.addEventListener('change', () => {
    const arquivo = arquivoInput.files?.[0];
    if (arquivo) carregarImagem(arquivo);
  });

  document.addEventListener('paste', evento => {
    const itens = [...(evento.clipboardData?.items || [])];
    const itemImagem = itens.find(item => item.type?.startsWith('image/'));
    if (!itemImagem) return;

    const arquivo = itemImagem.getAsFile();
    if (!arquivo) return;

    evento.preventDefault();
    carregarImagem(arquivo, 'Imagem colada');
    zona.focus();
  });

  zona.addEventListener('keydown', evento => {
    if ((evento.key === 'Enter' || evento.key === ' ') && document.activeElement === zona) {
      evento.preventDefault();
      arquivoInput.click();
    }
  });

  textoExtraido.addEventListener('input', atualizarAcoes);
  extrair.addEventListener('click', extrairTexto);
  limpar.addEventListener('click', limparImagem);
  usarLetra.addEventListener('click', () => enviarParaCampo(campoLetra, 'Letra'));
  usarCifra.addEventListener('click', () => enviarParaCampo(campoCifra, 'Cifra'));

  window.addEventListener('pagehide', () => {
    if (urlPreview) URL.revokeObjectURL(urlPreview);
    if (worker) worker.terminate().catch(() => {});
  });

  definirStatus('Cole uma imagem aqui ou escolha um arquivo.');
  atualizarAcoes();
})();
