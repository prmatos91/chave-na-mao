package com.impar.crmcarros.cliente;

import org.springframework.data.jpa.domain.Specification;

public final class ClienteSpecifications {

    private ClienteSpecifications() {
    }

    public static Specification<Cliente> comInteresse(InteressePrincipal interesse) {
        return (root, query, cb) -> cb.equal(root.get("interessePrincipal"), interesse);
    }

    public static Specification<Cliente> comTexto(String texto) {
        String like = "%" + texto.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("nome")), like),
                cb.like(cb.lower(root.get("email")), like)
        );
    }
}
