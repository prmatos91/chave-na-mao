package com.impar.crmcarros.veiculo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long>, JpaSpecificationExecutor<Veiculo> {

    long countByStatus(StatusVeiculo status);

    @Query("select distinct v.marca from Veiculo v order by v.marca")
    List<String> findDistinctMarcas();

    @Query("select distinct v.modelo from Veiculo v where lower(v.marca) = lower(:marca) order by v.modelo")
    List<String> findDistinctModelosPorMarca(@Param("marca") String marca);

    @Query("select distinct v.cor from Veiculo v order by v.cor")
    List<String> findDistinctCores();
}
