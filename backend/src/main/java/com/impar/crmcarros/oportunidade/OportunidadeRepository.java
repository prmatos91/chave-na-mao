package com.impar.crmcarros.oportunidade;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface OportunidadeRepository extends JpaRepository<Oportunidade, Long>, JpaSpecificationExecutor<Oportunidade> {

    long countByStatus(StatusOportunidade status);

    List<Oportunidade> findByVeiculoId(Long veiculoId);
}
