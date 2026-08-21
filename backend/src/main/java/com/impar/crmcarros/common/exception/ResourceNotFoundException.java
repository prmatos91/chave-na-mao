package com.impar.crmcarros.common.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String entity, Long id) {
        return new ResourceNotFoundException(entity + " nao encontrado(a) com id " + id);
    }
}
