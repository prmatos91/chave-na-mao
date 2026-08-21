package com.impar.crmcarros.veiculo;

import org.springframework.data.jpa.domain.Specification;

public final class VeiculoSpecifications {

    private VeiculoSpecifications() {
    }

    public static Specification<Veiculo> comStatus(StatusVeiculo status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Veiculo> comTexto(String texto) {
        String like = "%" + texto.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("marca")), like),
                cb.like(cb.lower(root.get("modelo")), like),
                cb.like(cb.lower(root.get("cor")), like)
        );
    }
}
