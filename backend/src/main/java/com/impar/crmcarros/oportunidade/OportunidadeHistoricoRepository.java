package com.impar.crmcarros.oportunidade;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OportunidadeHistoricoRepository extends JpaRepository<OportunidadeHistorico, Long> {

    List<OportunidadeHistorico> findByOportunidadeIdOrderByAlteradoEmAsc(Long oportunidadeId);
}
