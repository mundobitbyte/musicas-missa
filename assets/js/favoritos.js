(() => {
  const CHAVE = 'musicasMissaFavoritosV01';

  function ler() {
    try {
      const valor = JSON.parse(localStorage.getItem(CHAVE));
      if (!Array.isArray(valor)) return new Set();
      return new Set(valor.filter(id => typeof id === 'string' && id));
    } catch {
      return new Set();
    }
  }

  function salvar(ids) {
    const lista = [...ids];
    if (lista.length) localStorage.setItem(CHAVE, JSON.stringify(lista));
    else localStorage.removeItem(CHAVE);
  }

  function tem(id) {
    return ler().has(String(id));
  }

  function alternar(id) {
    const chaveId = String(id);
    const ids = ler();
    let ativo;

    if (ids.has(chaveId)) {
      ids.delete(chaveId);
      ativo = false;
    } else {
      ids.add(chaveId);
      ativo = true;
    }

    salvar(ids);
    window.dispatchEvent(new CustomEvent('musicasmissa:favoritos-alterados', {
      detail: { id: chaveId, ativo }
    }));
    return ativo;
  }

  function listar() {
    return [...ler()];
  }

  window.MusicasMissaFavoritos = { tem, alternar, listar };
})();
