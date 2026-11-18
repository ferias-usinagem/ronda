/* Regras das estrelas da ronda — iguais no PC (app/) e no celular (celular/, copiado pelo build).
 * Destaque (verde) e Atenção (amarela). Verde não apaga amarela: são contadas separadas.
 * Alertas (regras na aba Config da planilha), mesma pessoa + mesmo motivo de Atenção, nos últimos DIAS dias:
 *   VERBAL estrelas (padrão 2) → sugere formalizar a orientação verbal (medida Registro)   · 0 = desligado
 *   LIMITE estrelas (padrão 3) → sugere carta.  Sempre é sugestão: o líder decide.
 * Some sozinho quando já existe registro/carta do mesmo assunto com data igual ou depois da última estrela. */
(function (raiz) {
  const ativa = e => e.situacao !== 'Cancelada';
  const diaMs = 86400000;
  const isoHoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const isoMenos = (iso, dias) => { const d = new Date(iso + 'T12:00:00'); d.setTime(d.getTime() - dias * diaMs); return d.toISOString().slice(0, 10); };

  // alertas abertos: [{ mat, nome, motivoId, motivo, competencia, qtd, datas[], estrelas[], nivel: 'verbal'|'carta' }]
  // r = { verbal, limite, dias }; registros (opcional) = cartas/registros já feitos; cartaDe(motivoId) = modelo ligado
  function alertas(estrelas, r, registros, cartaDe, hoje) {
    r = r || {}; const limite = r.limite || 3, dias = r.dias || 30, verbal = r.verbal === undefined ? 2 : Number(r.verbal) || 0;
    const desde = isoMenos(hoje || isoHoje(), (dias || 30) - 1), grupos = {};
    estrelas.filter(e => ativa(e) && e.tipo === 'Atenção' && e.data >= desde).forEach(e => {
      const k = e.mat + '|' + (e.motivoId || e.motivo);
      (grupos[k] = grupos[k] || { mat: e.mat, nome: e.nome, motivoId: e.motivoId, motivo: e.motivo, competencia: e.competencia, estrelas: [] }).estrelas.push(e);
    });
    const minimo = verbal && verbal < limite ? verbal : limite;
    return Object.values(grupos).filter(g => g.estrelas.length >= minimo)
      .map(g => { g.estrelas.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)); return { ...g, qtd: g.estrelas.length, datas: g.estrelas.map(e => e.data), nivel: g.estrelas.length >= limite ? 'carta' : 'verbal' }; })
      .filter(a => {
        if (!registros || !registros.length) return true;
        const modelo = cartaDe ? cartaDe(a.motivoId) : '', ult = a.datas[a.datas.length - 1];
        if (!modelo) return true;
        return !registros.some(x => String(x.mat) === String(a.mat) && x.modelo === modelo && x.situacao !== 'Cancelada' && !x.exemplo && String(x.dataOcorrencia) >= ult &&
          (a.nivel === 'verbal' ? true : x.medida !== 'Registro'));
      })
      .sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'carta' ? -1 : 1) || b.qtd - a.qtd || a.nome.localeCompare(b.nome));
  }
  // resumo do período: por pessoa e por competência
  function resumo(estrelas, de, ate) {
    const L = estrelas.filter(e => ativa(e) && e.data >= de && e.data <= ate);
    const pessoas = {}, comp = {};
    L.forEach(e => {
      const p = pessoas[e.mat] = pessoas[e.mat] || { mat: e.mat, nome: e.nome, turno: e.turno, maquina: e.maquina, d: 0, a: 0, comp: {} };
      const c = p.comp[e.competencia] = p.comp[e.competencia] || { d: 0, a: 0 };
      const t = comp[e.competencia] = comp[e.competencia] || { d: 0, a: 0 };
      const k = e.tipo === 'Destaque' ? 'd' : 'a'; p[k]++; c[k]++; t[k]++;
    });
    const d = L.filter(e => e.tipo === 'Destaque').length, a = L.length - d;
    return { total: L.length, d, a, proporcao: a ? d / a : null, pessoas: Object.values(pessoas).sort((x, y) => (y.d + y.a) - (x.d + x.a) || x.nome.localeCompare(y.nome)), comp };
  }
  // motivos na ordem de uso: favoritos primeiro, depois a ordem da lista
  const ordenar = (motivos, tipo) => motivos.filter(m => !tipo || m.tipo === tipo).slice().sort((a, b) => (b.favorito - a.favorito) || (a.ordem - b.ordem));
  const R = { alertas, resumo, ordenar, isoHoje, isoMenos, ativa };
  if (typeof module !== 'undefined' && module.exports) module.exports = R; else raiz.ESTRELAS = R;
})(this);
