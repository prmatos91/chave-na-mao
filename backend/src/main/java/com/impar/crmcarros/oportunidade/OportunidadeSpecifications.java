package com.impar.crmcarros.oportunidade;

import org.springframework.data.jpa.domain.Specification;

public final class OportunidadeSpecifications {

    private OportunidadeSpecifications() {
    }

    public static Specification<Oportunidade> comStatus(StatusOportunidade status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Oportunidade> comCliente(Long clienteId) {
        return (root, query, cb) -> cb.equal(root.get("cliente").get("id"), clienteId);
    }

    public static Specification<Oportunidade> comVeiculo(Long veiculoId) {
        return (root, query, cb) -> cb.equal(root.get("veiculo").get("id"), veiculoId);
    }
}
